import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import { DownloadHistoryItem } from './DownloadHistoryItem';
import { Spinner } from '@/routes/-components/spinner';
import { toast } from 'sonner';
import { Video } from 'lucide-react';
import { useConfirmationDialog } from '@/routes/-components/ui/use-confirm-dialog';

interface DownloadHistoryProps {
  onDelete?: () => void;
}

export function DownloadHistory({ onDelete }: DownloadHistoryProps) {
  const { t } = useTranslation();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
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
    const confirmed = await confirm({
      title: t('bilibili_downloader.delete_history_record_confirm_title'),
      description: t('bilibili_downloader.delete_history_record_confirm_desc')
    });
    if (!confirmed) return;
    handleConfirmDelete(recordId);
  };

  const handleConfirmDelete = async (recordId: string) => {
    if (!recordId) return;

    try {
      await deleteRecordMutation.mutateAsync({ recordId: recordId });
      toast.success(t('bilibili_downloader.delete_history_record_success'));
      refetch();
      onDelete?.();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('bilibili_downloader.delete_history_record_failed')
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
        <p>{t('bilibili_downloader.no_download_history')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {t('bilibili_downloader.total_records', {
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
      {ConfirmationDialog}
    </>
  );
}
