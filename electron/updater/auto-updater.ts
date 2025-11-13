import type { BrowserWindow } from 'electron';
import updater from 'electron-updater';

const { autoUpdater } = updater;

interface InitializeAutoUpdaterOptions {
  isDev: boolean;
  getMainWindow: () => BrowserWindow | null;
}

export function initializeAutoUpdater({
  isDev,
  getMainWindow
}: InitializeAutoUpdaterOptions): void {
  if (isDev) {
    console.log('[Electron] Auto-updater disabled in development mode');
    return;
  }

  if (process.env.DISABLE_AUTO_UPDATE === 'true') {
    console.log('[Electron] Auto-updater disabled by environment variable');
    return;
  }

  autoUpdater.removeAllListeners();

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.requestHeaders = {
    'Cache-Control': 'no-cache'
  };

  autoUpdater.on('update-available', (info) => {
    console.log('[Electron] Update available:', info.version);
    getMainWindow()?.webContents.send('update-available', {
      version: info.version
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Electron] Update not available:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Electron] Download progress: ${progress.percent}%`);
    getMainWindow()?.webContents.send('update-download-progress', {
      percent: progress.percent
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Electron] Update downloaded:', info.version);
    getMainWindow()?.webContents.send('update-downloaded', {
      version: info.version
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('[Electron] Auto-updater error:', error);
    getMainWindow()?.webContents.send('update-error', error.message);
  });

  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.warn(
        '[Electron] Update check failed on startup:',
        error instanceof Error ? error.message : error
      );
    });
  }, 3000);
}

export { autoUpdater };
