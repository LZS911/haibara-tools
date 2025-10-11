import { contextBridge, ipcRenderer } from 'electron';

// 通过 contextBridge 安全地暴露 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 检测是否在 Electron 环境
  isElectron: true,

  // 获取服务器端口
  getServerPort: (): Promise<number> => {
    return ipcRenderer.invoke('get-server-port');
  },

  // 获取应用版本
  getAppVersion: (): Promise<string> => {
    return ipcRenderer.invoke('get-app-version');
  },

  // 检查更新
  checkForUpdates: (): Promise<{
    available: boolean;
    version?: string;
    error?: string;
  }> => {
    return ipcRenderer.invoke('check-for-updates');
  },

  // 下载更新
  downloadUpdate: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('download-update');
  },

  // 安装更新（会重启应用）
  installUpdate: (): void => {
    ipcRenderer.invoke('install-update');
  },

  // 监听更新可用事件
  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      info: { version: string }
    ) => {
      callback(info);
    };
    ipcRenderer.on('update-available', listener);

    // 返回清理函数
    return () => {
      ipcRenderer.removeListener('update-available', listener);
    };
  },

  // 监听更新下载进度
  onUpdateDownloadProgress: (
    callback: (progress: { percent: number }) => void
  ) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      progress: { percent: number }
    ) => {
      callback(progress);
    };
    ipcRenderer.on('update-download-progress', listener);

    return () => {
      ipcRenderer.removeListener('update-download-progress', listener);
    };
  },

  // 监听更新已下载事件
  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      info: { version: string }
    ) => {
      callback(info);
    };
    ipcRenderer.on('update-downloaded', listener);

    return () => {
      ipcRenderer.removeListener('update-downloaded', listener);
    };
  },

  // 监听更新错误
  onUpdateError: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => {
      callback(message);
    };
    ipcRenderer.on('update-error', listener);

    return () => {
      ipcRenderer.removeListener('update-error', listener);
    };
  }
});
