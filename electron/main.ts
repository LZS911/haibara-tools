import { app, BrowserWindow, ipcMain, shell, protocol } from 'electron';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import updater from 'electron-updater';
import fs from 'node:fs';
import type { AppConfig } from '../src/electron.d';

const { autoUpdater } = updater;

// ESM 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

let mainWindow: BrowserWindow | null = null;
let serverPort: number | null = null;

// 查找可用端口
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('node:net');

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// 启动 Express 服务器
async function startServer() {
  console.log('[Electron] Starting server...');
  console.log('[Electron] isDev:', isDev);
  console.log('[Electron] __dirname:', __dirname);
  console.log('[Electron] process.cwd():', process.cwd());

  try {
    // 查找可用端口（从 3000 开始）
    console.log('[Electron] Finding available port...');
    serverPort = await findAvailablePort(3000);
    console.log('[Electron] Found available port:', serverPort);

    // 获取应用资源根目录和用户数据目录
    // 在开发模式下使用 process.cwd()
    // 在生产模式下：
    //   - appRoot: 应用资源目录（用于读取静态文件）
    //   - userData: 用户数据目录（用于写入临时文件、缓存等）
    const appRoot = isDev ? process.cwd() : path.join(__dirname, '..', '..');
    const userDataPath = app.getPath('userData');

    console.log('[Electron] App root:', appRoot);
    console.log('[Electron] User data directory:', userDataPath);

    // 检查关键文件是否存在
    const serverPath = path.join(__dirname, '..', 'server', 'server.cjs');
    console.log('[Electron] Server path:', serverPath);
    console.log('[Electron] Server exists:', fs.existsSync(serverPath));

    if (!fs.existsSync(serverPath)) {
      throw new Error(`Server file not found at: ${serverPath}`);
    }

    // ⚠️ 重要：必须在导入 server 模块之前设置环境变量
    // 因为 server 模块在导入时会立即初始化，读取这个环境变量
    process.env.USER_DATA_PATH = userDataPath;
    process.env.IS_PACKAGED = String(app.isPackaged);

    // 动态导入服务器模块
    console.log('[Electron] Importing server module...');
    // 使用 pathToFileURL 将文件路径转换为 file:// URL，以确保在 Windows 上动态导入正常工作
    const serverModule = await import(pathToFileURL(serverPath).href);
    console.log('[Electron] Server module imported successfully');

    console.log('[Electron] Creating server...');
    const { app: expressApp } = await serverModule.createServer(appRoot, true);
    console.log('[Electron] Server created successfully');

    return new Promise<number>((resolve, reject) => {
      const server = expressApp.listen(serverPort, () => {
        console.log(
          `[Electron] ✅ Express server running on port ${serverPort}`
        );
        console.log(`[Electron] App root: ${appRoot}`);
        console.log(`[Electron] User data directory: ${userDataPath}`);
        resolve(serverPort!);
      });

      server.on('error', (error: Error) => {
        console.error('[Electron] ❌ Server error:', error);
        reject(error);
      });
    });
  } catch (error) {
    console.error('[Electron] ❌ Failed to start server:', error);
    console.error('[Electron] Error stack:', (error as Error).stack);
    throw error;
  }
}

// 创建主窗口
async function createWindow() {
  console.log('[Electron] Creating main window...');

  const preloadPath = path.join(__dirname, 'preload.cjs');
  const iconPath = path.join(__dirname, '..', '..', 'build', 'icon.png');

  console.log('[Electron] Preload path:', preloadPath);
  console.log('[Electron] Preload exists:', fs.existsSync(preloadPath));
  console.log('[Electron] Icon path:', iconPath);
  console.log('[Electron] Icon exists:', fs.existsSync(iconPath));

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    title: 'Haibara Tools',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform === 'darwin' ? false : true
    // frame: process.platform !== 'win32',
  });

  console.log('[Electron] Window created successfully');

  // 开发模式：加载 Vite 开发服务器
  // 生产模式：加载本地构建文件
  if (isDev) {
    console.log('[Electron] Loading dev server at http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const url = `http://localhost:${serverPort}`;
    console.log('[Electron] Loading production server at', url);
    mainWindow.loadURL(url);
  }

  // 监听加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] ✅ Window loaded successfully');
  });

  // 监听加载失败事件
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

  // 在默认浏览器中打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    console.log('[Electron] Window closed');
    mainWindow = null;
  });
}

// 配置自动更新

function setupAutoUpdater() {
  // 仅在生产环境启用自动更新
  if (isDev) {
    console.log('[Electron] Auto-updater disabled in development mode');
    return;
  }

  // 允许通过环境变量禁用自动更新
  if (process.env.DISABLE_AUTO_UPDATE === 'true') {
    console.log('[Electron] Auto-updater disabled by environment variable');
    return;
  }

  // 配置自动更新
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // 设置请求超时（默认 120 秒太长）
  autoUpdater.requestHeaders = {
    'Cache-Control': 'no-cache'
  };

  // 监听更新事件
  autoUpdater.on('update-available', (info) => {
    console.log('[Electron] Update available:', info.version);
    mainWindow?.webContents.send('update-available', { version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[Electron] Update not available:', info.version);
  });

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[Electron] Download progress: ${progress.percent}%`);
    mainWindow?.webContents.send('update-download-progress', {
      percent: progress.percent
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Electron] Update downloaded:', info.version);
    mainWindow?.webContents.send('update-downloaded', {
      version: info.version
    });
  });

  autoUpdater.on('error', (error) => {
    console.error('[Electron] Auto-updater error:', error);
    // 不向渲染进程发送错误，避免在没有配置更新服务时影响用户体验
    mainWindow?.webContents.send('update-error', error.message);
  });

  // 启动时检查更新（使用更短的延迟和超时控制）
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.warn(
        '[Electron] Update check failed on startup (this is normal if no updates are configured):',
        error.message
      );
    });
  }, 3000);
}

// 配置管理

// 获取配置文件路径
function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.json');
}

// 加载配置
function loadConfig(): AppConfig {
  const configPath = getConfigPath();

  // 无论开发还是生产，都从 config.json 读取
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('[Electron] Failed to load config:', error);
  }

  return {};
}

// 保存配置
function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();

  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[Electron] Config saved to:', configPath);
  } catch (error) {
    console.error('[Electron] Failed to save config:', error);
    throw error;
  }
}

// IPC 通信处理
function setupIPC() {
  // 获取服务器端口
  ipcMain.handle('get-server-port', () => {
    return serverPort;
  });

  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // 获取配置
  ipcMain.handle('get-config', () => {
    return loadConfig();
  });

  // 保存配置
  ipcMain.handle('save-config', (_event, config: AppConfig) => {
    try {
      saveConfig(config);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // 获取 userData 路径
  ipcMain.handle('get-user-data-path', () => {
    return app.getPath('userData');
  });

  // 检查更新
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
      // 移除之前的监听器，避免重复触发
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
        // 不把错误信息发送到渲染进程，避免在网络错误等情况下打扰用户
        resolve({ available: false, error: 'Failed to check for updates' });
      });

      console.log('[Electron] Checking for updates...');
      autoUpdater.checkForUpdates();
    });
  });

  // 下载更新
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

  // 安装更新（会重启应用）
  ipcMain.handle('install-update', () => {
    if (isDev) {
      return;
    }
    autoUpdater.quitAndInstall();
  });

  // 选择文件夹
  ipcMain.handle('select-folder', async () => {
    const { dialog } = await import('electron');
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.filePaths[0];
  });

  // 打开文件夹/文件
  ipcMain.handle('open-path', async (_event, path: string) => {
    try {
      await shell.openPath(path);
      return { success: true };
    } catch (error) {
      console.error('Failed to open path:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

// 应用启动
app.whenReady().then(async () => {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace(/^local-resource:\/\//, '');
    // Decode URL to handle special characters in file paths
    const decodedUrl = decodeURI(url);
    try {
      return callback(decodedUrl);
    } catch (error) {
      console.error('Failed to register protocol', error);
      return callback('404');
    }
  });

  // In dev mode, write a context file for the separate server process to find the userData path.
  if (isDev) {
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

  console.log('[Electron] ========================================');
  console.log('[Electron] App is ready, starting initialization...');
  console.log('[Electron] Platform:', process.platform);
  console.log('[Electron] Architecture:', process.arch);
  console.log('[Electron] Node version:', process.version);
  console.log('[Electron] Electron version:', process.versions.electron);
  console.log('[Electron] ========================================');

  try {
    console.log('[Electron] Loading configuration...');
    const config = loadConfig();
    console.log('[Electron] Configuration loaded:', Object.keys(config));

    // 启动 Express 服务器（仅生产模式）
    if (!isDev) {
      console.log('[Electron] Starting Express server (production mode)...');
      await startServer();
      console.log('[Electron] ✅ Server started successfully');
    } else {
      console.log('[Electron] Skipping server startup (development mode)');
    }

    // 创建窗口
    console.log('[Electron] Creating application window...');
    await createWindow();
    console.log('[Electron] ✅ Window created successfully');

    // 在 macOS 上设置 Dock 图标，确保在各种情况下（包括台前调度）都能正确显示
    if (process.platform === 'darwin') {
      const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'build', 'icon.png') // 生产环境
        : path.join(process.cwd(), 'build/icon.png'); // 开发环境

      console.log(
        `[Electron] Setting Dock icon for ${app.isPackaged ? 'production' : 'development'}...`
      );
      console.log('[Electron] Icon path:', iconPath);

      if (fs.existsSync(iconPath)) {
        app.dock?.setIcon(iconPath);
      } else {
        console.warn('[Electron] ⚠️ Dock icon not found at:', iconPath);
      }
    }

    // 设置 IPC 通信
    console.log('[Electron] Setting up IPC handlers...');
    setupIPC();

    // 设置自动更新
    // console.log('[Electron] Setting up auto-updater...');
    setupAutoUpdater();

    console.log('[Electron] ========================================');
    console.log('[Electron] ✅ Application started successfully');
    console.log('[Electron] ========================================');

    // macOS 特定行为
    app.on('activate', () => {
      console.log('[Electron] App activated');
      if (BrowserWindow.getAllWindows().length === 0) {
        console.log('[Electron] No windows, creating new window...');
        createWindow();
      }
    });
  } catch (error) {
    console.error('[Electron] ========================================');
    console.error('[Electron] ❌ FATAL ERROR: Failed to start application');
    console.error('[Electron] Error:', error);
    console.error('[Electron] Stack:', (error as Error).stack);
    console.error('[Electron] ========================================');

    // 显示错误对话框
    const { dialog } = await import('electron');
    await dialog.showErrorBox(
      'Application Startup Error',
      `Failed to start Haibara Tools:\n\n${(error as Error).message}\n\nPlease check the console for more details.`
    );

    app.quit();
  }
});

// 退出应用
app.on('window-all-closed', () => {
  // macOS 上除非用户明确退出，否则保持应用运行
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
