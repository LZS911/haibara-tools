import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import type { DownloadTask } from '../-types';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/routes/-lib/utils';

interface DownloadItemProps {
  task: DownloadTask;
  onDelete: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

export function DownloadItem({ task, onDelete, onCancel }: DownloadItemProps) {
  const { t } = useTranslation();

  const getStatusText = () => {
    switch (task.status) {
      case 'pending':
        return t('bilibili_downloader.download_status_pending');
      case 'downloading':
        return t('bilibili_downloader.download_status_downloading');
      case 'completed':
        return t('bilibili_downloader.download_status_completed');
      case 'failed':
        return t('bilibili_downloader.download_status_failed');
      case 'cancelled':
        return t('bilibili_downloader.download_status_cancelled');
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'text-green-600';
      case 'downloading':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'cancelled':
        return 'text-slate-500';
      default:
        return 'text-slate-600';
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-900">{task.title}</h4>
            <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
              <span>{task.bvId}</span>
              <span className={getStatusText() ? getStatusColor() : ''}>
                {getStatusText()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* {task.status === 'completed' && (
              <>
                {task.mergedPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideoPlayer(true)}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    {t('play_video', '播放')}
                  </Button>
                )}
                {!task.mergedPath && task.videoPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideoPlayer(true)}
                  >
                    <FileVideo className="mr-1 h-4 w-4" />
                    {t('play_video_only', '视频')}
                  </Button>
                )}
                {task.audioPath && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAudioPlayer(true)}
                  >
                    <FileAudio className="mr-1 h-4 w-4" />
                    {t('play_audio', '音频')}
                  </Button>
                )}
              </>
            )} */}
            {task.status === 'downloading' && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel(task.id)}
              >
                {t('bilibili_downloader.cancel')}
              </Button>
            )}
            {(task.status === 'completed' ||
              task.status === 'failed' ||
              task.status === 'cancelled') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 进度条 */}
        {task.status === 'downloading' && (
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-slate-500">{task.progress}%</p>
              {task.downloadedSize && task.totalSize ? (
                <p className="text-xs text-slate-500">
                  {formatBytes(task.downloadedSize)} /{' '}
                  {formatBytes(task.totalSize)}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {task.status === 'failed' && task.error && (
          <p className="mt-2 text-xs text-red-600">{task.error}</p>
        )}
      </Card>

      {/* {showVideoPlayer && (task.mergedPath || task.videoPath) && (
        <VideoPlayer
          videoPath={task.mergedPath || task.videoPath!}
          title={task.title}
          onClose={() => setShowVideoPlayer(false)}
        />
      )}

      {showAudioPlayer && task.audioPath && (
        <AudioPlayer
          audioPath={task.audioPath}
          title={task.title}
          onClose={() => setShowAudioPlayer(false)}
        />
      )} */}
    </>
  );
}
