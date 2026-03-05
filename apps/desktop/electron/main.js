"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#ffffff',
            height: 40
        }
    });
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('closed', () => { mainWindow = null; });
}
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    electron_1.app.quit(); });
electron_1.app.on('activate', () => { if (mainWindow === null)
    createWindow(); });
