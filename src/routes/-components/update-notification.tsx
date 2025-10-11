import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, RefreshCw, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UpdateState {
  available: boolean;
  version?: string;
  downloading: boolean;
  downloadProgress?: number;
  downloaded: boolean;
  error?: string;
}

export function UpdateNotification() {
  const { t } = useTranslation();
  const [updateState, setUpdateState] = useState<UpdateState>({
    available: false,
    downloading: false,
    downloaded: false
  });
  const [isVisible, setIsVisible] = useState(false);

  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    // 监听更新可用
    const cleanupAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateState((prev) => ({
        ...prev,
        available: true,
        version: info.version
      }));
      setIsVisible(true);
    });

    // 监听下载进度
    const cleanupProgress = window.electronAPI.onUpdateDownloadProgress(
      (progress) => {
        setUpdateState((prev) => ({
          ...prev,
          downloading: true,
          downloadProgress: Math.round(progress.percent)
        }));
      }
    );

    // 监听下载完成
    const cleanupDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateState((prev) => ({
        ...prev,
        downloading: false,
        downloaded: true,
        version: info.version
      }));
    });

    // 监听错误
    const cleanupError = window.electronAPI.onUpdateError((message) => {
      setUpdateState((prev) => ({
        ...prev,
        downloading: false,
        error: message
      }));
    });

    return () => {
      cleanupAvailable();
      cleanupProgress();
      cleanupDownloaded();
      cleanupError();
    };
  }, [isElectron]);

  const handleDownload = async () => {
    if (!window.electronAPI) return;

    setUpdateState((prev) => ({ ...prev, downloading: true }));
    try {
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      setUpdateState((prev) => ({
        ...prev,
        downloading: false,
        error: t('update_error', '下载失败，请稍后重试')
      }));
    }
  };

  const handleInstall = () => {
    if (!window.electronAPI) return;
    window.electronAPI.installUpdate();
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isElectron || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="border-slate-200 bg-white p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {updateState.available && !updateState.downloaded && (
              <>
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-900">
                    {t('update_available', '发现新版本')}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {t('update_version_available', {
                    version: updateState.version
                  })}
                </p>
                {updateState.downloading && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                      <span>{t('update_downloading', '下载中...')}</span>
                      <span>{updateState.downloadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${updateState.downloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                {!updateState.downloading && !updateState.error && (
                  <Button
                    onClick={handleDownload}
                    size="sm"
                    className="mt-3 w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t('update_download', '下载更新')}
                  </Button>
                )}
                {updateState.error && (
                  <p className="mt-2 text-sm text-red-600">
                    {updateState.error}
                  </p>
                )}
              </>
            )}

            {updateState.downloaded && (
              <>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">
                    {t('update_downloaded', '更新已下载')}
                  </h3>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {t('update_install_desc', {
                    version: updateState.version
                  })}
                </p>
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="mt-3 w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('update_install', '重启并安装')}
                </Button>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="ml-2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
