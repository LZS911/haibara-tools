import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import updater from 'electron-updater';
import dotenv from 'dotenv';
import fs from 'node:fs';
import type { AppConfig } from '../src/electron.d';

const { autoUpdater } = updater;

// ESM 环境下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development';

// 加载环境变量
// 在开发模式下，从项目根目录加载 .env
// 在生产模式下，从 userData 目录加载 .env（用户可自行创建配置文件）
if (isDev) {
  // 开发模式：从项目根目录加载
  dotenv.config({ path: path.join(process.cwd(), '.env') });
} else {
  // 生产模式：从 userData 目录加载
  // 用户可以在 ~/Library/Application Support/Haibara Tools/.env 创建配置文件
  const userDataPath = app.getPath('userData');
  const envPath = path.join(userDataPath, '.env');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('[Electron] Loaded .env file from:', envPath);
  } else {
    console.log('[Electron] No .env file found at:', envPath);
    console.log(
      '[Electron] You can create a .env file at this location to configure API keys and other settings'
    );

    // 可选：创建一个示例 .env 文件
    const exampleEnv = `# Haibara Tools Configuration
# Add your API keys and configuration here

# Example:
# OPENAI_API_KEY=your_api_key_here
# ANTHROPIC_API_KEY=your_api_key_here
`;
    try {
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      const examplePath = path.join(userDataPath, '.env.example');
      if (!fs.existsSync(examplePath)) {
        fs.writeFileSync(examplePath, exampleEnv, 'utf-8');
        console.log('[Electron] Created .env.example at:', examplePath);
      }
    } catch (error) {
      console.error('[Electron] Failed to create .env.example:', error);
    }
  }
}
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
  try {
    // 查找可用端口（从 3000 开始）
    serverPort = await findAvailablePort(3000);

    // 获取应用资源根目录和用户数据目录
    // 在开发模式下使用 process.cwd()
    // 在生产模式下：
    //   - appRoot: 应用资源目录（用于读取静态文件）
    //   - userData: 用户数据目录（用于写入临时文件、缓存等）
    const appRoot = isDev ? process.cwd() : path.join(__dirname, '../..');
    const userDataPath = app.getPath('userData');

    // ⚠️ 重要：必须在导入 server 模块之前设置环境变量
    // 因为 server 模块在导入时会立即初始化，读取这个环境变量
    process.env.USER_DATA_PATH = userDataPath;

    // 动态导入服务器模块
    // __dirname 在打包后是 app.asar/dist/electron/
    // 所以 server.cjs 在 ../server/server.cjs
    const serverModule = await import(
      path.join(__dirname, '../server/server.cjs')
    );

    const { app: expressApp } = await serverModule.createServer(appRoot, true);

    expressApp.listen(serverPort, () => {
      console.log(`[Electron] Express server running on port ${serverPort}`);
      console.log(`[Electron] App root: ${appRoot}`);
      console.log(`[Electron] User data directory: ${userDataPath}`);
    });

    return serverPort;
  } catch (error) {
    console.error('[Electron] Failed to start server:', error);
    throw error;
  }
}

// 创建主窗口
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    title: 'Haibara Tools',
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? false : true
  });

  // 开发模式：加载 Vite 开发服务器
  // 生产模式：加载本地构建文件
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  }

  // 在默认浏览器中打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
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

  // 配置自动更新
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

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
    mainWindow?.webContents.send('update-error', error.message);
  });

  // 启动时检查更新
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error('[Electron] Failed to check for updates:', error);
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

  // 开发环境：从 process.env 读取（已经通过 dotenv 加载）
  if (isDev) {
    return {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME,
      DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
      DEEPSEEK_MODEL_NAME: process.env.DEEPSEEK_MODEL_NAME,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      GEMINI_MODEL_NAME: process.env.GEMINI_MODEL_NAME,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL_NAME: process.env.ANTHROPIC_MODEL_NAME,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_MODEL_NAME: process.env.OPENROUTER_MODEL_NAME,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      GROQ_MODEL_NAME: process.env.GROQ_MODEL_NAME,
      COHERE_API_KEY: process.env.COHERE_API_KEY,
      COHERE_MODEL_NAME: process.env.COHERE_MODEL_NAME,
      VOLC_APP_ID: process.env.VOLC_APP_ID,
      VOLC_ACCESS_TOKEN: process.env.VOLC_ACCESS_TOKEN,
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    };
  }

  // 生产环境：从 config.json 读取
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

    // 更新 process.env
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        process.env[key] = value;
      }
    });
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
  ipcMain.handle('check-for-updates', async () => {
    if (isDev) {
      return { available: false, message: 'Updates disabled in development' };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        available: result !== null,
        version: result?.updateInfo.version
      };
    } catch (error) {
      console.error('[Electron] Check for updates failed:', error);
      return { available: false, error: (error as Error).message };
    }
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
}

// 应用启动
app.whenReady().then(async () => {
  try {
    // 加载配置并注入到 process.env
    const config = loadConfig();
    Object.entries(config).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        process.env[key] = value;
      }
    });

    // 启动 Express 服务器（开发和生产模式都需要）
    if (!isDev) {
      await startServer();
    }
    // 创建窗口
    await createWindow();

    // 设置 IPC 通信
    setupIPC();

    // 设置自动更新
    setupAutoUpdater();

    // macOS 特定行为
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('[Electron] Failed to start application:', error);
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
