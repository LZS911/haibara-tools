import { useTranslation } from 'react-i18next';
import type { DownloadTask } from '../-types';
import { DownloadItem } from './DownloadItem';

interface DownloadQueueProps {
  tasks: DownloadTask[];
  onDelete: (taskId: string) => void;
  onCancel?: (taskId: string) => void;
}

export function DownloadQueue({
  tasks,
  onDelete,
  onCancel
}: DownloadQueueProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-500">
          {t('download_queue_empty', '暂无下载任务')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <DownloadItem
          key={task.id}
          task={task}
          onDelete={onDelete}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
