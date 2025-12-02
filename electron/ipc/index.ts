import { app, dialog, ipcMain, shell } from 'electron';
import type { AppUpdater } from 'electron-updater';
import { exec } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import type { AppConfig } from '../../src/electron.d';

interface RegisterIpcHandlersOptions {
  getServerPort: () => number | null;
  loadConfig: () => AppConfig;
  saveConfig: (config: AppConfig) => void;
  isDev: boolean;
  autoUpdater: AppUpdater;
}

export function registerIpcHandlers({
  autoUpdater,
  getServerPort,
  isDev,
  loadConfig,
  saveConfig
}: RegisterIpcHandlersOptions): void {
  ipcMain.handle('get-server-port', () => getServerPort());

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('get-config', () => loadConfig());

  ipcMain.handle('save-config', (_event, config: AppConfig) => {
    try {
      saveConfig(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('get-user-data-path', () => app.getPath('userData'));

  ipcMain.handle('check-for-updates', () => {
    if (isDev) {
      console.log(
        '[Electron] Update check skipped: disabled in development mode.'
      );
      return Promise.resolve({
        available: false,
        isLatest: true,
        message: 'Updates disabled in development'
      });
    }

    return new Promise((resolve) => {
      autoUpdater.removeAllListeners('update-not-available');
      autoUpdater.removeAllListeners('update-available');
      autoUpdater.removeAllListeners('error');

      autoUpdater.once('update-not-available', () => {
        console.log('[Electron] Update not available.');
        resolve({ available: false, isLatest: true });
      });

      autoUpdater.once('update-available', (info) => {
        console.log('[Electron] Update available:', info.version);
        resolve({ available: true, isLatest: false, version: info.version });
      });

      autoUpdater.once('error', (error) => {
        console.error('[Electron] Check for updates failed:', error.message);
        resolve({ available: false, error: 'Failed to check for updates' });
      });

      console.log('[Electron] Checking for updates...');
      autoUpdater.checkForUpdates().catch((error) => {
        console.error('[Electron] Error checking for updates:', error);
        resolve({ available: false, error: 'Failed to check for updates' });
      });
    });
  });

  ipcMain.handle('download-update', async () => {
    if (isDev) {
      return { success: false, message: 'Updates disabled in development' };
    }

    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('[Electron] Download update failed:', error);
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('install-update', () => {
    if (!isDev) {
      autoUpdater.quitAndInstall();
    }
  });

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  ipcMain.handle('open-path', async (_event, targetPath: string) => {
    try {
      await shell.openPath(targetPath);
      return { success: true };
    } catch (error) {
      console.error('Failed to open path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle(
    'execute-git-command',
    async (_event, command: string, repoPath: string, token?: string) => {
      return new Promise((resolve) => {
        // 构建包含 Node.js 路径的 PATH 环境变量
        // 这对于 husky hooks 能够找到 npm 命令很重要
        const nodePath = process.execPath; // Node.js 可执行文件的路径
        const nodeBinDir = path.dirname(nodePath); // Node.js bin 目录

        // 获取当前 PATH 或使用默认值
        const currentPath = process.env.PATH || '';

        // 常见的 Node.js 安装路径（macOS）
        const commonNodePaths = [
          nodeBinDir, // 当前 Node.js 的 bin 目录
          '/usr/local/bin', // Homebrew 和其他安装的默认路径
          '/opt/homebrew/bin', // Apple Silicon Mac 的 Homebrew 路径
          '/usr/bin', // 系统默认路径
          '/bin' // 系统默认路径
        ];

        // 如果使用 nvm，尝试查找当前激活的 Node.js 版本
        const nvmPath =
          process.env.NVM_DIR || path.join(process.env.HOME || '', '.nvm');
        try {
          const nvmVersionsPath = path.join(nvmPath, 'versions', 'node');
          if (fs.existsSync(nvmVersionsPath)) {
            // 查找最新的版本目录
            const versions = fs
              .readdirSync(nvmVersionsPath)
              .filter((v: string) => /^v\d+\.\d+\.\d+/.test(v))
              .sort()
              .reverse();
            if (versions.length > 0) {
              commonNodePaths.push(
                path.join(nvmVersionsPath, versions[0], 'bin')
              );
            }
          }
        } catch (e) {
          // 忽略 nvm 路径查找错误
        }

        // 合并所有路径，去重
        const pathSet = new Set<string>();
        // 先添加当前 PATH 中的路径
        currentPath.split(path.delimiter).forEach((p) => {
          if (p) pathSet.add(p);
        });
        // 再添加 Node.js 相关路径
        commonNodePaths.forEach((p) => {
          if (p) pathSet.add(p);
        });

        const enhancedPath = Array.from(pathSet).join(path.delimiter);

        exec(
          command,
          {
            cwd: repoPath,
            env: {
              ...process.env,
              PATH: enhancedPath,
              GITHUB_TOKEN: token || ''
            }
          },
          (error, stdout, stderr) => {
            if (error) {
              console.error(
                `[Electron] Git command failed: ${command} in ${repoPath}`,
                error
              );
              resolve({ success: false, error: error.message, stdout, stderr });
            } else {
              console.log(
                `[Electron] Git command successful: ${command} in ${repoPath}`
              );
              resolve({ success: true, output: stdout, stderr });
            }
          }
        );
      });
    }
  );
}
