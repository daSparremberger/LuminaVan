import { app, BrowserWindow, Menu, Notification, dialog, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createServer, type Server } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
const isDev = !app.isPackaged;
let localServer: Server | null = null;
let localServerUrl: string | null = null;
const popupAllowedHosts = new Set([
  'accounts.google.com',
  'oauth2.googleapis.com',
  'apis.google.com',
  'securetoken.googleapis.com',
  'identitytoolkit.googleapis.com',
  'firebaseapp.com'
]);

function canOpenPopup(url: string) {
  if (url === 'about:blank') return true;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'https:') return false;
    return popupAllowedHosts.has(hostname) || hostname.endsWith('.firebaseapp.com');
  } catch {
    return false;
  }
}

function isInternalAppUrl(url: string) {
  if (url.startsWith('file://')) return true;
  if (isDev && url.startsWith('http://localhost:5173')) return true;
  if (!localServerUrl) return false;
  try {
    const target = new URL(url);
    const internal = new URL(localServerUrl);
    return target.origin === internal.origin;
  } catch {
    return false;
  }
}

const contentTypeByExt: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function startLocalServer() {
  if (localServerUrl) return localServerUrl;

  const distDir = path.join(__dirname, '../../dist');
  const indexPath = path.join(distDir, 'index.html');

  localServer = createServer(async (req, res) => {
    try {
      const rawUrl = req.url || '/';
      const cleanUrl = rawUrl.split('?')[0];
      const reqPath = cleanUrl === '/' ? '/index.html' : cleanUrl;
      const normalized = path.normalize(reqPath).replace(/^(\.\.[\\/])+/, '');
      let filePath = path.join(distDir, normalized);

      let data: Buffer;
      try {
        data = await fs.readFile(filePath);
      } catch {
        // SPA fallback for client routes.
        filePath = indexPath;
        data = await fs.readFile(filePath);
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': contentTypeByExt[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Erro ao carregar aplicativo desktop');
    }
  });

  const port = await new Promise<number>((resolve, reject) => {
    localServer!.once('error', reject);
    localServer!.listen(0, '127.0.0.1', () => {
      const address = localServer!.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Falha ao iniciar servidor local'));
        return;
      }
      resolve(address.port);
    });
  });

  localServerUrl = `http://localhost:${port}`;
  return localServerUrl;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    backgroundColor: '#101214',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'RotaVans',
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    startLocalServer()
      .then((url) => mainWindow?.loadURL(url))
      .catch(() => mainWindow?.loadFile(path.join(__dirname, '../../dist/index.html')));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  const sendMaxState = () => {
    mainWindow?.webContents.send('window:maximized-changed', Boolean(mainWindow?.isMaximized()));
  };
  mainWindow.on('maximize', sendMaxState);
  mainWindow.on('unmaximize', sendMaxState);

  // Allow OAuth popups used by Firebase Google login; open other links externally.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (canOpenPopup(url)) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isInternalAppUrl(url) || url === 'about:blank') return;
    event.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return;
    dialog.showErrorBox(
      'Falha ao abrir o aplicativo',
      `Nao foi possivel carregar a interface.\n\nURL: ${validatedURL}\nErro: ${errorDescription} (${errorCode})`
    );
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

function sendUpdaterStatus(payload: {
  status: 'checking' | 'available' | 'not-available' | 'downloaded' | 'error' | 'download-progress';
  version?: string;
  message?: string;
  progress?: number;
}) {
  mainWindow?.webContents.send('updater:status', payload);
}

function setupWindowControlsIpc() {
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize-toggle', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return;
    }
    mainWindow.maximize();
  });
  ipcMain.handle('window:is-maximized', () => Boolean(mainWindow?.isMaximized()));
  ipcMain.handle('window:close', () => mainWindow?.close());
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdaterStatus({ status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdaterStatus({ status: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdaterStatus({ status: 'not-available' });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    sendUpdaterStatus({
      status: 'download-progress',
      progress: progressObj.percent,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdaterStatus({ status: 'downloaded', version: info.version });

    if (Notification.isSupported()) {
      const notification = new Notification({
        title: 'Atualização disponível',
        body: `A versão ${info.version} foi baixada. Clique para instalar agora.`,
      });
      notification.on('click', () => autoUpdater.quitAndInstall());
      notification.show();
    }

    dialog.showMessageBox({
      type: 'info',
      buttons: ['Instalar agora', 'Depois'],
      defaultId: 0,
      cancelId: 1,
      title: 'Nova versão disponível',
      message: `A versão ${info.version} foi baixada e está pronta para instalar.`,
      detail: 'O aplicativo será reiniciado para concluir a atualização.',
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (error) => {
    sendUpdaterStatus({
      status: 'error',
      message: error?.message || 'Falha ao verificar atualizações',
    });
  });

  ipcMain.handle('updater:check-now', async () => autoUpdater.checkForUpdates());
  ipcMain.handle('updater:install-now', () => autoUpdater.quitAndInstall());

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => undefined);
  }, 5000);
}

app.on('ready', createWindow);
app.whenReady().then(() => {
  setupWindowControlsIpc();
  if (!isDev) setupAutoUpdater();
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (mainWindow === null) createWindow(); });
app.on('before-quit', () => {
  if (localServer) {
    localServer.close();
    localServer = null;
    localServerUrl = null;
  }
});
