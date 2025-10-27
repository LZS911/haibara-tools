import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { trpc } from '@/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Clock,
  HardDrive,
  FileCheck,
  History,
  ChevronDown,
  ChevronUp,
  Bot,
  Palette
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app';
import { TimelineView } from '../-components/TimelineView';
import { parseTimelineContent } from '../-lib/utils';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/routes/-components/ui/use-confirm-dialog';

export const Route = createFileRoute('/media-to-docs/convert-history/')({
  component: HistoryManagement
});

function HistoryManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setJobToLoadFromHistory } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState<string | null>(
    null
  );
  const { confirm, ConfirmationDialog } = useConfirmationDialog();

  // 获取历史列表
  const {
    data: historyItems,
    isLoading,
    refetch
  } = useQuery(trpc.mediaToDoc.listCaches.queryOptions());

  // 删除历史
  const deleteMutation = useMutation(
    trpc.mediaToDoc.deleteCache.mutationOptions()
  );

  // 清理过期历史
  const clearExpiredMutation = useMutation(
    trpc.mediaToDoc.clearExpiredCaches.mutationOptions()
  );

  const handleDelete = async (bvId: string) => {
    const confirmed = await confirm({
      title: t('media_to_docs.history_management_delete_confirm_title'),
      description: t('media_to_docs.history_management_delete_confirm_desc', {
        bvId
      })
    });
    if (!confirmed) return;

    deleteMutation.mutate(
      { bvId },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          toast.error(
            t('media_to_docs.history_management_delete_fail', {
              error: error.message
            })
          );
        }
      }
    );
  };

  const handleClearExpired = async () => {
    const confirmed = await confirm({
      title: t('media_to_docs.history_management_clear_expired_confirm_title'),
      description: t(
        'media_to_docs.history_management_clear_expired_confirm_desc'
      )
    });
    if (!confirmed) return;

    clearExpiredMutation.mutate(
      { maxAgeDays: 7 },
      {
        onSuccess: (data) => {
          toast.success(
            t('media_to_docs.history_management_clear_expired_success', {
              count: data.deletedCount
            })
          );
          refetch();
        },
        onError: (error) => {
          toast.error(
            t('media_to_docs.history_management_clear_expired_fail', {
              error: error.message
            })
          );
        }
      }
    );
  };

  const handleRegenerate = (item: NonNullable<typeof historyItems>[0]) => {
    if (!item.audioPath) {
      toast.warning(t('media_to_docs.history_management_no_audio_file'));
      return;
    }
    setJobToLoadFromHistory({
      bvId: item.bvId,
      audioPath: item.audioPath,
      videoPath: item.videoPath
    });
    navigate({ to: '/media-to-docs' });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalSize =
    historyItems?.reduce((sum, c) => sum + (c.size || 0), 0) || 0;
  const transcribedCount =
    historyItems?.filter((c) => c.hasTranscript).length || 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('media_to_docs.history_management_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('media_to_docs.history_management_desc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} size="sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('media_to_docs.history_management_refreshing')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('media_to_docs.history_management_refresh')}
              </>
            )}
          </Button>
          <Button
            onClick={handleClearExpired}
            size="sm"
            disabled={clearExpiredMutation.isPending}
          >
            {clearExpiredMutation.isPending ? (
              <>
                <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                {t('media_to_docs.history_management_clearing')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('media_to_docs.history_management_clear_expired')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {t('media_to_docs.history_management_total_count')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {historyItems?.length || 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {t('media_to_docs.history_management_transcribed_count')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                {transcribedCount}
              </p>
            </div>
            <FileCheck className="h-8 w-8 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {t('media_to_docs.history_management_total_size')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-purple-600">
                {formatBytes(totalSize)}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* 历史列表 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('media_to_docs.history_management_list_title')}
        </h2>

        {isLoading ? (
          <Card className="border-slate-200 bg-white p-12">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-12 w-12 animate-spin" />
              <p className="mt-4">
                {t('media_to_docs.history_management_loading')}
              </p>
            </div>
          </Card>
        ) : !historyItems || historyItems.length === 0 ? (
          <Card className="border-slate-200 bg-white p-12">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <History className="h-12 w-12 opacity-20" />
              <p className="mt-4 text-lg font-medium">
                {t('media_to_docs.history_management_no_data')}
              </p>
              <p className="mt-2 text-sm">
                {t('media_to_docs.history_management_no_data_desc')}
              </p>
              <Link to="/media-to-docs">
                <Button variant="outline" size="sm" className="mt-4">
                  {t('media_to_docs.history_management_go_to_media_to_docs')}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <Card
                key={item.bvId}
                className={`border-slate-200 bg-white transition-all ${expandedId === item.bvId ? 'border-blue-500' : ''}`}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-3">
                      <h3
                        className="truncate font-medium text-slate-900"
                        title={item.title || item.bvId}
                      >
                        {item.title || item.bvId}
                      </h3>
                      {item.hasTranscript && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('media_to_docs.history_management_transcribed')}
                        </span>
                      )}
                      {item.summaries && item.summaries.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {t('media_to_docs.history_management_summarized')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatBytes(item.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegenerate(item);
                      }}
                    >
                      {t('media_to_docs.history_management_regenerate')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.bvId);
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables?.bvId === item.bvId ? (
                        <>
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          {t('media_to_docs.history_management_deleting')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-1 h-3 w-3" />
                          {t('media_to_docs.history_management_delete')}
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setExpandedId(
                          expandedId === item.bvId ? null : item.bvId
                        )
                      }
                      disabled={!item.summaries || item.summaries.length === 0}
                    >
                      {expandedId === item.bvId ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* 摘要列表 */}
                {expandedId === item.bvId && (
                  <div className="border-t border-slate-200 p-4 space-y-3">
                    {item.summaries.map((summary) => {
                      const isTimeline =
                        summary.keyframes && summary.keyframes.length > 0;
                      return (
                        <div
                          key={summary.id}
                          className="rounded-lg border border-slate-200 bg-slate-50"
                        >
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer"
                            onClick={() =>
                              setExpandedSummaryId(
                                expandedSummaryId === summary.id
                                  ? null
                                  : summary.id
                              )
                            }
                          >
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Bot className="h-4 w-4" />
                                <span className="font-medium text-slate-800">
                                  {summary.provider}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-600">
                                <Palette className="h-4 w-4" />
                                <span>{summary.style}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(summary.createdAt)}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              {expandedSummaryId === summary.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {expandedSummaryId === summary.id && (
                            <div className="border-t border-slate-200 bg-white p-3">
                              {isTimeline ? (
                                <TimelineView
                                  items={parseTimelineContent(
                                    summary.content,
                                    summary.keyframes || []
                                  )}
                                  onReset={() => {}} // 在历史页面中，重置按钮可能不需要
                                />
                              ) : (
                                <pre className="whitespace-pre-wrap rounded-md p-3 text-sm text-slate-700 font-sans">
                                  {summary.content}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      {ConfirmationDialog}
    </div>
  );
}
