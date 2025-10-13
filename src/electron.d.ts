// 配置类型定义
export interface AppConfig {
  SIDEBAR_COLLAPSED?: boolean;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL_NAME?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_MODEL_NAME?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL_NAME?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL_NAME?: string;
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL_NAME?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL_NAME?: string;
  COHERE_API_KEY?: string;
  COHERE_MODEL_NAME?: string;
  VOLC_APP_ID?: string;
  VOLC_ACCESS_TOKEN?: string;
  PORT?: string;
  NODE_ENV?: string;
}

// Electron API 类型定义
export interface ElectronAPI {
  // 检测是否在 Electron 环境
  isElectron: boolean;

  // 获取服务器端口
  getServerPort: () => Promise<number>;

  // 获取应用版本
  getAppVersion: () => Promise<string>;

  // 获取配置
  getConfig: () => Promise<AppConfig>;

  // 保存配置
  saveConfig: (
    config: AppConfig
  ) => Promise<{ success: boolean; error?: string }>;

  // 获取 userData 路径
  getUserDataPath: () => Promise<string>;

  // 检查更新
  checkForUpdates: () => Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }>;

  // 下载更新
  downloadUpdate: () => Promise<{
    success: boolean;
    error?: string;
  }>;

  // 安装更新（会重启应用）
  installUpdate: () => void;

  // 监听更新可用事件
  onUpdateAvailable: (
    callback: (info: { version: string }) => void
  ) => () => void;

  // 监听更新下载进度
  onUpdateDownloadProgress: (
    callback: (progress: { percent: number }) => void
  ) => () => void;

  // 监听更新已下载事件
  onUpdateDownloaded: (
    callback: (info: { version: string }) => void
  ) => () => void;

  // 监听更新错误
  onUpdateError: (callback: (message: string) => void) => () => void;
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
