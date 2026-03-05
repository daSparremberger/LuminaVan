import { Router } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

const RELEASES_DIR = path.join(__dirname, '../../uploads/releases');

// GET /download/desktop - download do .exe
router.get('/desktop', (req, res) => {
  const filePath = path.join(RELEASES_DIR, 'RotaVans-Setup.exe');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo nao disponivel' });
  }

  res.download(filePath, 'RotaVans-Setup.exe');
});

// GET /download/mobile - download do .apk
router.get('/mobile', (req, res) => {
  const filePath = path.join(RELEASES_DIR, 'RotaVans.apk');

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo nao disponivel' });
  }

  res.download(filePath, 'RotaVans.apk');
});

// GET /download/info - info sobre releases disponiveis
router.get('/info', (req, res) => {
  const exePath = path.join(RELEASES_DIR, 'RotaVans-Setup.exe');
  const apkPath = path.join(RELEASES_DIR, 'RotaVans.apk');

  const info = {
    desktop: {
      disponivel: fs.existsSync(exePath),
      tamanho: fs.existsSync(exePath) ? fs.statSync(exePath).size : null
    },
    mobile: {
      disponivel: fs.existsSync(apkPath),
      tamanho: fs.existsSync(apkPath) ? fs.statSync(apkPath).size : null
    }
  };

  res.json(info);
});

export default router;
