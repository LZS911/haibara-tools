import { app, BrowserWindow, protocol } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  createMainWindow,
  getMainWindow,
  hideMainWindow,
  showMainWindow
} from './windows/main-window';
import { startServer } from './server/start-server';
import { loadConfig, saveConfig } from './config/app-config';
import { registerIpcHandlers } from './ipc';
import { autoUpdater, initializeAutoUpdater } from './updater/auto-updater';
import {
  createStatusTray,
  destroyStatusTray,
  updateStatusTray
} from './tray/status-tray';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let serverPort: number | null = null;
let assetsRoot = '';
let isTrayInitialized = false;

function getAppRoot(): string {
  return isDev ? process.cwd() : path.join(__dirname, '..', '..');
}

function resolveAssetsRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'build');
  }

  return path.join(process.cwd(), 'build');
}

function registerLocalResourceProtocol(): void {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace(/^local-resource:\/\//, '');
    const decodedUrl = decodeURI(url);
    try {
      callback(decodedUrl);
    } catch (error) {
      console.error('Failed to register protocol', error);
      callback('404');
    }
  });
}

async function writeDevContext(): Promise<void> {
  if (!isDev) {
    return;
  }

  try {
    const userDataPath = app.getPath('userData');
    const context = { userDataPath };
    const contextPath = path.join(
      process.cwd(),
      'tmp',
      'electron-context.json'
    );
    const tmpDir = path.dirname(contextPath);

    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    fs.writeFileSync(contextPath, JSON.stringify(context));
    console.log('[Electron] Wrote dev context to:', contextPath);
  } catch (error) {
    console.error('[Electron] Failed to write dev context file:', error);
  }
}

function logEnvironment(): void {
  console.log('[Electron] ========================================');
  console.log('[Electron] App is ready, starting initialization...');
  console.log('[Electron] Platform:', process.platform);
  console.log('[Electron] Architecture:', process.arch);
  console.log('[Electron] Node version:', process.version);
  console.log('[Electron] Electron version:', process.versions.electron);
  console.log('[Electron] ========================================');
}

function getPreloadPath(): string {
  return path.join(__dirname, 'preload.cjs');
}

function getServerEntryPath(): string {
  return path.join(__dirname, '..', 'server', 'server.cjs');
}

function getTrayOptions() {
  return {
    assetsRoot,
    onToggleMainWindow: () => {
      const window = getMainWindow();
      if (!window) {
        return;
      }
      if (window.isVisible()) {
        hideMainWindow();
      } else {
        showMainWindow();
      }
    },
    onQuit: () => {
      app.quit();
    },
    isMainWindowVisible: () => Boolean(getMainWindow()?.isVisible())
  };
}

function ensureStatusTray(): void {
  if (process.platform !== 'darwin') {
    return;
  }

  if (!isTrayInitialized) {
    createStatusTray(getTrayOptions());
    isTrayInitialized = true;
  } else {
    updateStatusTray(getTrayOptions());
  }
}

async function bootstrap() {
  registerLocalResourceProtocol();
  await writeDevContext();
  logEnvironment();

  try {
    console.log('[Electron] Loading configuration...');
    const config = loadConfig();
    console.log('[Electron] Configuration loaded:', Object.keys(config));
  } catch (error) {
    console.error('[Electron] Failed to load configuration:', error);
  }

  assetsRoot = resolveAssetsRoot();
  console.log('[Electron] Assets root:', assetsRoot);

  if (!isDev) {
    console.log('[Electron] Starting Express server (production mode)...');
    try {
      serverPort = await startServer({
        appRoot: getAppRoot(),
        serverEntry: getServerEntryPath()
      });
      console.log('[Electron] ✅ Server started on port:', serverPort);
    } catch (error) {
      console.error('[Electron] ❌ Failed to start server:', error);
      throw error;
    }
  } else {
    console.log('[Electron] Skipping server startup (development mode)');
  }

  const preloadPath = getPreloadPath();
  if (!fs.existsSync(preloadPath)) {
    throw new Error(`Preload script not found at ${preloadPath}`);
  }

  console.log('[Electron] Creating application window...');
  const window = await createMainWindow({
    isDev,
    preloadPath,
    serverPort,
    assetsRoot
  });
  console.log('[Electron] ✅ Window created successfully');

  window.on('show', ensureStatusTray);
  window.on('hide', ensureStatusTray);
  window.on('closed', () => {
    ensureStatusTray();
  });

  registerIpcHandlers({
    autoUpdater,
    getServerPort: () => serverPort,
    isDev,
    loadConfig,
    saveConfig
  });
  console.log('[Electron] ✅ IPC handlers registered');

  initializeAutoUpdater({
    isDev,
    getMainWindow
  });
  console.log('[Electron] ✅ Auto-updater initialized');

  ensureStatusTray();

  console.log('[Electron] ========================================');
  console.log('[Electron] ✅ Application started successfully');
  console.log('[Electron] ========================================');

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createMainWindow({
        isDev,
        preloadPath: getPreloadPath(),
        serverPort,
        assetsRoot
      });
      ensureStatusTray();
    }
  });
}

app
  .whenReady()
  .then(bootstrap)
  .catch(async (error) => {
    console.error('[Electron] ========================================');
    console.error('[Electron] ❌ FATAL ERROR: Failed to start application');
    console.error('[Electron] Error:', error);
    console.error(
      '[Electron] Stack:',
      error instanceof Error ? error.stack : ''
    );
    console.error('[Electron] ========================================');

    const { dialog } = await import('electron');
    await dialog.showErrorBox(
      'Application Startup Error',
      `Failed to start Haibara Tools:\n\n${error instanceof Error ? error.message : String(error)}\n\nPlease check the console for more details.`
    );

    app.quit();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  destroyStatusTray();
});
