import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/routes/-components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/routes/-components/ui/tabs';
import { Input } from '@/routes/-components/ui/input';
import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';
import { VideoInfoCard } from './-components/VideoInfoCard';
import { QualitySelector } from './-components/QualitySelector';
import { DownloadOptions } from './-components/DownloadOptions';
import { DownloadQueue } from './-components/DownloadQueue';
import { DownloadHistory } from './-components/DownloadHistory';
import { PageSelector } from './-components/PageSelector';
import type { VideoInfo, DownloadTask } from './-types';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { useSubscription } from '@trpc/tanstack-react-query';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoginStatus, QualityEnum } from '@/types/bilibili';

export const Route = createFileRoute('/bilibili-downloader/')({
  component: BilibiliDownloader,
  staticData: { keepAlive: true }
});

function BilibiliDownloader() {
  const { t } = useTranslation();
  const [bvInput, setBvInput] = useState('BV11T4EzyEdF');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loginStatus, setLoginStatus] = useState(LoginStatus.visitor);
  const [selectedQuality, setSelectedQuality] = useState<number | undefined>(
    undefined
  );
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isMerge, setIsMerge] = useState(true);
  const [isDelete, setIsDelete] = useState(true);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // 加载下载任务列表
  const { data: downloadTasks, refetch: refetchTasks } = useQuery(
    trpc.bilibili.getDownloadTasks.queryOptions(undefined, {
      refetchInterval: 5000
    })
  );

  useEffect(() => {
    if (downloadTasks) {
      setTasks(downloadTasks);
    }
  }, [downloadTasks]);

  // 获取视频信息
  const getVideoInfoMutation = useMutation(
    trpc.bilibili.getVideoInfo.mutationOptions()
  );

  // 下载视频
  const downloadVideoMutation = useMutation(
    trpc.bilibili.downloadVideo.mutationOptions()
  );

  const checkFileExistsMutation = useMutation(
    trpc.bilibili.checkFileExists.mutationOptions()
  );

  // 取消下载
  const cancelDownloadMutation = useMutation(
    trpc.bilibili.cancelDownload.mutationOptions()
  );

  // 删除任务
  const deleteTaskMutation = useMutation(
    trpc.bilibili.deleteTask.mutationOptions()
  );

  // 订阅进度
  const subscribeProgress = useSubscription(
    trpc.bilibili.subscribeDownloadProgress.subscriptionOptions(
      activeTaskId ? { taskId: activeTaskId } : { taskId: '' }
    )
  );

  // 处理进度更新
  useEffect(() => {
    if (subscribeProgress.data) {
      const data = subscribeProgress.data;
      setTasks((prev) =>
        prev.map((task) =>
          task.id === data.taskId
            ? {
                ...task,
                progress: data.progress,
                status: data.status as DownloadTask['status']
              }
            : task
        )
      );
    }
  }, [subscribeProgress.data]);

  const availableQualityOptions = useMemo(() => {
    const getQualityOptionsWithLoginStatus = (
      videoInfo: VideoInfo,
      loginStatus: LoginStatus
    ) => {
      if (loginStatus === LoginStatus.vip) {
        return videoInfo.qualityOptions;
      }
      if (loginStatus === LoginStatus.user) {
        return videoInfo.qualityOptions.filter(
          (option) => option.value <= QualityEnum.ultra
        );
      }

      return videoInfo.qualityOptions.filter(
        (option) => option.value <= QualityEnum.medium
      ); // 未登录最高480P
    };
    if (videoInfo) {
      return getQualityOptionsWithLoginStatus(videoInfo, loginStatus);
    }
    return [];
  }, [videoInfo, loginStatus]);

  const handleGetVideoInfo = async () => {
    if (!bvInput.trim()) {
      toast.error(t('please_input_bv_id', '请输入 BV 号或视频链接'));
      return;
    }

    try {
      const result = await getVideoInfoMutation.mutateAsync({
        input: bvInput.trim()
      });

      if (result.success && result.videoInfo) {
        setVideoInfo(result.videoInfo);
        setLoginStatus(result.loginStatus);
        // 默认选中所有分P
        if (result.videoInfo.page.length > 0) {
          setSelectedPages(result.videoInfo.page.map((p) => p.page));
        }
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('get_video_info_failed', '获取视频信息失败')
      );
    }
  };

  const handleDownload = async () => {
    if (!videoInfo || selectedPages.length === 0) return;

    if (!selectedQuality) {
      toast.error(t('please_select_quality', '请选择清晰度'));
      return;
    }

    try {
      const pagesToDownload = videoInfo.page.filter((p) =>
        selectedPages.includes(p.page)
      );

      const existingFilesResult = await checkFileExistsMutation.mutateAsync({
        bvId: videoInfo.bvid,
        title: videoInfo.title,
        pages: pagesToDownload.map((p) => ({
          page: p.page,
          title: p.title
        }))
      });

      if (existingFilesResult.exists) {
        const fileList = existingFilesResult.existingFiles.join('\n');
        const confirmed = window.confirm(
          t(
            'files_exist_overwrite_confirm',
            `以下文件已存在，是否覆盖？\n${fileList}`
          )
        );
        if (!confirmed) {
          return;
        }
      }

      const result = await downloadVideoMutation.mutateAsync({
        bvId: videoInfo.bvid,
        videoUrl: videoInfo.url,
        quality: selectedQuality,
        pages: selectedPages,
        isMerge,
        isDelete
      });

      if (result.success && result.taskIds) {
        toast.success(
          t(
            'download_started_multiple',
            `已创建 ${result.taskIds.length} 个下载任务`
          )
        );
        // 激活第一个任务的进度订阅
        setActiveTaskId(result.taskIds[0]);
        // 重置输入
        setBvInput('');
        setVideoInfo(null);
        setSelectedPages([]);
        // 刷新任务列表
        refetchTasks();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('download_failed', '下载失败')
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskMutation.mutateAsync({ taskId });
      toast.success(t('task_deleted', '任务已删除'));
      refetchTasks();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('delete_task_failed', '删除任务失败')
      );
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await cancelDownloadMutation.mutateAsync({ taskId });
      toast.success(t('task_cancelled', '任务已取消'));
      refetchTasks();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('cancel_task_failed', '取消任务失败')
      );
    }
  };

  useEffect(() => {
    if (availableQualityOptions.length > 0) {
      setSelectedQuality(availableQualityOptions[0].value);
    }
  }, [availableQualityOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {t('bilibili_downloader_title', 'Bilibili 视频下载')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t('bilibili_downloader_desc', '下载 Bilibili 视频到本地')}
        </p>
      </div>

      {/* 输入BV号 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900">
            {t('input_bv_id', '输入视频信息')}
          </CardTitle>
          <CardDescription>
            {t('input_bv_id_desc_tips', '输入 BV 号或完整的视频链接')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex gap-2">
            <Input
              placeholder={t(
                'bilibili_input_placeholder',
                '例如：BV1xx411c7mD 或视频链接'
              )}
              value={bvInput}
              onChange={(e) => setBvInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGetVideoInfo();
                }
              }}
              disabled={getVideoInfoMutation.isPending}
            />
            <Button
              onClick={handleGetVideoInfo}
              disabled={getVideoInfoMutation.isPending || !bvInput.trim()}
            >
              {getVideoInfoMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  {t('loading', '加载中...')}
                </>
              ) : (
                t('get_video_info', '获取信息')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 视频信息和下载选项 */}
      {videoInfo && (
        <div className="space-y-4">
          <VideoInfoCard videoInfo={videoInfo} />

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-medium text-slate-900">
                {t('download_options', '下载选项')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              {videoInfo.page.length > 1 && (
                <PageSelector
                  pages={videoInfo.page}
                  selectedPages={selectedPages}
                  onSelectionChange={setSelectedPages}
                />
              )}
              <QualitySelector
                options={availableQualityOptions}
                value={selectedQuality}
                onChange={setSelectedQuality}
                loginStatus={loginStatus}
              />
              <DownloadOptions
                isMerge={isMerge}
                isDelete={isDelete}
                onMergeChange={setIsMerge}
                onDeleteChange={setIsDelete}
              />
              <Button
                onClick={handleDownload}
                disabled={
                  downloadVideoMutation.isPending || selectedPages.length === 0
                }
                className="w-full"
              >
                {downloadVideoMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    {t('downloading', '下载中...')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('start_download', '开始下载')}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 下载队列和历史记录 */}
      <Tabs defaultValue="queue" className="w-full">
        <TabsList>
          <TabsTrigger value="queue">
            {t('download_queue', '下载队列')}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t('download_history', '已下载列表')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="queue" className="mt-4">
          <DownloadQueue
            tasks={tasks}
            onDelete={handleDeleteTask}
            onCancel={handleCancelTask}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <DownloadHistory onDelete={refetchTasks} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
