import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import { DownloadHistoryItem } from './DownloadHistoryItem';
import { Spinner } from '@/routes/-components/spinner';
import { toast } from 'sonner';
import { Video } from 'lucide-react';

interface DownloadHistoryProps {
  onDelete?: () => void;
}

export function DownloadHistory({ onDelete }: DownloadHistoryProps) {
  const { t } = useTranslation();

  // 获取历史记录
  const {
    data: historyData,
    isLoading,
    refetch
  } = useQuery(
    trpc.bilibili.getDownloadHistory.queryOptions({ page: 1, pageSize: 50 })
  );

  // 删除历史记录
  const deleteRecordMutation = useMutation(
    trpc.bilibili.deleteHistoryRecord.mutationOptions()
  );

  const handleDelete = async (recordId: string) => {
    if (
      !window.confirm(
        t(
          'delete_history_record_confirm',
          '此操作会删除已下载的视频文件，确定要删除吗？'
        )
      )
    ) {
      return;
    }
    try {
      await deleteRecordMutation.mutateAsync({ recordId });
      toast.success(t('delete_history_record_success', '删除成功'));
      refetch();
      onDelete?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('delete_history_record_failed', '删除失败')
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!historyData || historyData.items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <Video className="h-12 w-12" />
        <p>{t('no_download_history', '暂无下载历史')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {t('total_records', '共 {{count}} 条记录', {
            count: historyData.total
          })}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {historyData.items.map((item) => (
          <DownloadHistoryItem
            key={item.id}
            item={item}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
