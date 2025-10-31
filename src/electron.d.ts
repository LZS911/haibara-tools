// 配置类型定义
export interface AppConfig {
  SIDEBAR_COLLAPSED?: string;
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
  DOUBAO_API_KEY?: string;
  DOUBAO_MODEL_NAME?: string;
  DOUBAO_BASE_URL?: string;
  DEEPSEEK_BASE_URL?: string;
  VOLC_APP_ID?: string;
  VOLC_ACCESS_TOKEN?: string;
  BILIBILI_SESSDATA?: string;
  BILIBILI_BFE_ID?: string;
  BILIBILI_DOWNLOAD_PATH?: string;
  BILIBILI_IS_DANMAKU?: boolean;
  BILIBILI_IS_COVER?: boolean;
  BILIBILI_IS_SUBTITLE?: boolean;
  BILIBILI_IS_FOLDER?: boolean;
  BILIBILI_DOWNLOADING_MAX_SIZE?: number;
  PORT?: string;
  NODE_ENV?: string;
  GITHUB_TOKEN?: string;
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
    isLatest?: boolean;
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

  // 选择文件夹
  selectFolder: () => Promise<string | undefined>;

  // 打开文件夹/文件
  openPath: (path: string) => Promise<{ success: boolean; error?: string }>;

  // 执行 Git 命令
  executeGitCommand: (
    command: string,
    repoPath: string,
    token?: string
  ) => Promise<{
    success: boolean;
    output?: string;
    stderr?: string;
    error?: string;
  }>;
}

// 扩展 Window 接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
