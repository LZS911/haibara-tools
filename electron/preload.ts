import { contextBridge, ipcRenderer } from 'electron';
import type { AppConfig } from '../src/electron.d';

// 配置类型定义

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

  // 获取配置
  getConfig: (): Promise<AppConfig> => {
    return ipcRenderer.invoke('get-config');
  },

  // 保存配置
  saveConfig: (
    config: AppConfig
  ): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('save-config', config);
  },

  // 获取 userData 路径
  getUserDataPath: (): Promise<string> => {
    return ipcRenderer.invoke('get-user-data-path');
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
  },

  // 选择文件夹
  selectFolder: (): Promise<string | undefined> => {
    return ipcRenderer.invoke('select-folder');
  },

  // 打开文件夹/文件
  openPath: (path: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('open-path', path);
  }
});
