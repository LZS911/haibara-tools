import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Spinner } from '@/routes/-components/spinner';
import { useState } from 'react';

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
    if (!confirm(`确定要删除 ${bvId} 的缓存吗？`)) return;

    deleteMutation.mutate(
      { bvId },
      {
        onSuccess: () => {
          refetch();
        },
        onError: (error) => {
          alert(`删除失败: ${error.message}`);
        }
      }
    );
  };

  const handleClearExpired = async () => {
    if (!confirm('确定要清理超过 7 天的缓存吗？')) return;

    clearExpiredMutation.mutate(
      { maxAgeDays: 7 },
      {
        onSuccess: (data) => {
          alert(`成功清理了 ${data.deletedCount} 个过期缓存`);
          refetch();
        },
        onError: (error) => {
          alert(`清理失败: ${error.message}`);
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          {t('cache_management', '缓存管理')}
        </h1>
        <p className="text-lg text-gray-600">
          {t('cache_management_desc', '管理视频下载和转录的缓存数据')}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Link to="/media-to-docs">返回</Link>
          </Button>
          <div className="text-sm text-gray-600">
            {caches && `共 ${caches.length} 个缓存项`}
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => refetch()}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                刷新中...
              </>
            ) : (
              '刷新列表'
            )}
          </Button>
          <Button
            onClick={handleClearExpired}
            variant="outline"
            disabled={clearExpiredMutation.isPending}
            className="text-orange-600 hover:text-orange-700"
          >
            {clearExpiredMutation.isPending ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                清理中...
              </>
            ) : (
              '清理过期缓存'
            )}
          </Button>
        </div>
      </div>

      {/* 缓存列表 */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="w-12 h-12 text-blue-600" />
        </div>
      ) : !caches || caches.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-gray-500">
            <p className="text-lg">暂无缓存数据</p>
            <p className="text-sm mt-2">下载视频后，缓存会自动保存在这里</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {caches.map((cache) => (
            <Card
              key={cache.bvId}
              className={`transition-all ${
                selectedBvId === cache.bvId
                  ? 'border-2 border-blue-500'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => setSelectedBvId(cache.bvId)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold text-gray-800">
                      {cache.bvId}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">大小:</span>
                        <span className="font-medium">
                          {formatBytes(cache.size)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">创建时间:</span>
                        <span className="font-medium">
                          {formatDate(cache.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">转录状态:</span>
                        {cache.hasTranscript ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ 已转录
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            未转录
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cache.bvId);
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables?.bvId === cache.bvId ? (
                      <>
                        <Spinner className="w-3 h-3 mr-1" />
                        删除中...
                      </>
                    ) : (
                      '删除'
                    )}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* 统计信息 */}
      {caches && caches.length > 0 && (
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg">统计信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {caches.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">总缓存数</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {caches.filter((c) => c.hasTranscript).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">已转录</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {formatBytes(caches.reduce((sum, c) => sum + c.size, 0))}
                </div>
                <div className="text-sm text-gray-600 mt-1">总占用空间</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
