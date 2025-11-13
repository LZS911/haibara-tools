import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

interface CreateMainWindowOptions {
  isDev: boolean;
  preloadPath: string;
  serverPort: number | null;
  assetsRoot: string;
}

let mainWindow: BrowserWindow | null = null;

function resolveIconPath(assetsRoot: string): string | undefined {
  const iconFile =
    process.platform === 'win32'
      ? 'icon.ico'
      : process.platform === 'linux'
        ? 'icon.png'
        : 'icon.icns';
  const iconPath = path.join(assetsRoot, iconFile);

  if (process.platform === 'darwin') {
    // Electron 在 macOS 上不使用窗口图标，所以直接返回 undefined。
    return undefined;
  }

  return fs.existsSync(iconPath) ? iconPath : undefined;
}

export async function createMainWindow({
  isDev,
  preloadPath,
  serverPort,
  assetsRoot
}: CreateMainWindowOptions): Promise<BrowserWindow> {
  if (mainWindow) {
    return mainWindow;
  }

  if (!isDev && !serverPort) {
    throw new Error('Cannot create main window before server is ready.');
  }

  const browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 1400,
    height: 900,
    title: 'Haibara Tools',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform === 'darwin' ? false : true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  };

  const iconPath = resolveIconPath(assetsRoot);
  if (iconPath) {
    browserWindowOptions.icon = iconPath;
  }

  mainWindow = new BrowserWindow(browserWindowOptions);

  if (!isDev) {
    mainWindow.setMenu(null);
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] ✅ Window loaded successfully');
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription) => {
      console.error(
        '[Electron] ❌ Window failed to load:',
        errorCode,
        errorDescription
      );
    }
  );

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function showMainWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
}

export function hideMainWindow(): void {
  mainWindow?.hide();
}
