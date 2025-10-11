import { createFileRoute, Link } from '@tanstack/react-router';
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
  FileCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/media-to-docs/cache-management/')({
  component: CacheManagement
});

function CacheManagement() {
  const { t } = useTranslation();
  const [selectedBvId, setSelectedBvId] = useState<string | null>(null);

  // 获取缓存列表
  const {
    data: caches,
    isLoading,
    refetch
  } = useQuery(trpc.mediaToDoc.listCaches.queryOptions());

  // 删除缓存
  const deleteMutation = useMutation(
    trpc.mediaToDoc.deleteCache.mutationOptions()
  );

  // 清理过期缓存
  const clearExpiredMutation = useMutation(
    trpc.mediaToDoc.clearExpiredCaches.mutationOptions()
  );

  const handleDelete = async (bvId: string) => {
    if (!confirm(t('cache_management_delete_confirm', { bvId }))) return;

    deleteMutation.mutate(
      { bvId },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          alert(t('cache_management_delete_fail', { error: error.message }));
        }
      }
    );
  };

  const handleClearExpired = async () => {
    if (!confirm(t('cache_management_clear_expired_confirm'))) return;

    clearExpiredMutation.mutate(
      { maxAgeDays: 7 },
      {
        onSuccess: (data) => {
          alert(
            t('cache_management_clear_expired_success', {
              count: data.deletedCount
            })
          );
          refetch();
        },
        onError: (error) => {
          alert(
            t('cache_management_clear_expired_fail', {
              error: error.message
            })
          );
        }
      }
    );
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

  const totalSize = caches?.reduce((sum, c) => sum + c.size, 0) || 0;
  const transcribedCount = caches?.filter((c) => c.hasTranscript).length || 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('cache_management_title', '缓存管理')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('cache_management_desc', '管理视频下载和转录的缓存数据')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} size="sm" disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t('cache_management_refreshing', '刷新中')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('cache_management_refresh', '刷新')}
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
                {t('cache_management_clearing', '清理中')}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t('cache_management_clear_expired', '清理过期')}
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
                {t('cache_management_total_count', '总缓存数')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {caches?.length || 0}
              </p>
            </div>
            <Database className="h-8 w-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {t('cache_management_transcribed_count', '已转录')}
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
                {t('cache_management_total_size', '占用空间')}
              </p>
              <p className="mt-1 text-2xl font-semibold text-purple-600">
                {formatBytes(totalSize)}
              </p>
            </div>
            <HardDrive className="h-8 w-8 text-purple-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* 缓存列表 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('cache_management_list_title', '缓存列表')}
        </h2>

        {isLoading ? (
          <Card className="border-slate-200 bg-white p-12">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-12 w-12 animate-spin" />
              <p className="mt-4">
                {t('cache_management_loading', '加载中...')}
              </p>
            </div>
          </Card>
        ) : !caches || caches.length === 0 ? (
          <Card className="border-slate-200 bg-white p-12">
            <div className="flex flex-col items-center justify-center text-slate-400">
              <Database className="h-12 w-12 opacity-20" />
              <p className="mt-4 text-lg font-medium">
                {t('cache_management_no_data', '暂无缓存数据')}
              </p>
              <p className="mt-2 text-sm">
                {t('cache_management_no_data_desc')}
              </p>
              <Link to="/media-to-docs">
                <Button variant="outline" size="sm" className="mt-4">
                  {t('cache_management_go_to_media_to_docs')}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {caches.map((cache) => (
              <Card
                key={cache.bvId}
                className={`cursor-pointer border-slate-200 bg-white transition-all ${
                  selectedBvId === cache.bvId
                    ? 'border-blue-500 shadow-sm'
                    : 'hover:border-slate-300'
                }`}
                onClick={() => setSelectedBvId(cache.bvId)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-slate-900">
                        {cache.bvId}
                      </h3>
                      {cache.hasTranscript && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('cache_management_transcribed', '已转录')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span>{formatBytes(cache.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(cache.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cache.bvId);
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables?.bvId === cache.bvId ? (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        {t('cache_management_deleting', '删除中')}
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-1 h-3 w-3" />
                        {t('cache_management_delete', '删除')}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
