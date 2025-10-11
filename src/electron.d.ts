// Electron API 类型定义
export interface ElectronAPI {
  // 检测是否在 Electron 环境
  isElectron: boolean;

  // 获取服务器端口
  getServerPort: () => Promise<number>;

  // 获取应用版本
  getAppVersion: () => Promise<string>;

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
