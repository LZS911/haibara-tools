import { createFileRoute, Link } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import { useMutation, useQuery, skipToken } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { useSubscription } from '@trpc/tanstack-react-query';
import { TrainingStatusEnum } from '@/types/voice-cloning';
import { toast } from 'sonner';
import { RefreshCw, Trash2, Mic } from 'lucide-react';
import { useConfirmationDialog } from '../../-components/ui/use-confirm-dialog';

export const Route = createFileRoute('/voice-cloning/training/')({
  component: VoiceTrainingPage
});

function VoiceTrainingPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirmationDialog();

  // 下载状态
  const [bvId, setBvId] = useState('BV1TSWmzZEDg');
  const [speakerId, setSpeakerId] = useState('S_jxJkgn3H1');
  const [jobId, setJobId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);

  // mutations
  const downloadMutation = useMutation(
    trpc.voiceCloning.downloadBvAudio.mutationOptions()
  );

  const startTrainingMutation = useMutation(
    trpc.voiceCloning.startTraining.mutationOptions()
  );

  const deleteTrainingMutation = useMutation(
    trpc.voiceCloning.deleteTraining.mutationOptions()
  );

  // 查询训练列表
  const {
    data: trainings = [],
    refetch: refetchTrainings,
    isLoading: isLoadingTrainings
  } = useQuery(trpc.voiceCloning.listTrainings.queryOptions());

  // 订阅下载进度
  const subscribeProgress = useSubscription(
    trpc.voiceCloning.subscribeProgress.subscriptionOptions(
      jobId ? { jobId } : skipToken
    )
  );

  const handleDownloadAndTrain = async () => {
    if (!bvId.trim()) {
      toast.error(t('voice_cloning.error_no_speaker_id'));
      return;
    }

    if (!speakerId.trim()) {
      toast.error(t('voice_cloning.error_no_speaker_id'));
      return;
    }

    const newJobId = nanoid();
    setJobId(newJobId);
    setIsDownloading(true);

    // 第一步：下载音频
    downloadMutation.mutate(
      { bvIdOrUrl: bvId, jobId: newJobId },
      {
        onSuccess: async (data) => {
          if (data.success && data.audioPath) {
            setIsDownloading(false);

            // 第二步：启动训练
            startTrainingMutation.mutate(
              {
                audioPath: data.audioPath,
                speakerId: speakerId.trim(),
                bvId: bvId,
                title: data.title || bvId
              },
              {
                onSuccess: () => {
                  toast.success(t('voice_cloning.training_status_training'));
                  // 重置表单
                  setBvId('');
                  setSpeakerId('');
                  refetchTrainings();
                },
                onError: (error) => {
                  toast.error(error.message);
                }
              }
            );
          } else {
            toast.error(t('voice_cloning.error_download_failed'));
            setIsDownloading(false);
          }
        },
        onError: (error) => {
          toast.error(error.message);
          setIsDownloading(false);
        }
      }
    );
  };

  const handleDelete = async (speakerId: string) => {
    const confirmed = await confirm({
      title: t('voice_cloning.confirm_delete_title'),
      description: t('voice_cloning.confirm_delete_desc')
    });

    if (!confirmed) return;

    deleteTrainingMutation.mutate(
      { speakerId },
      {
        onSuccess: () => {
          toast.success(t('voice_cloning.delete_success'));
          refetchTrainings();
        },
        onError: (error) => {
          toast.error(t('voice_cloning.delete_failed') + ': ' + error.message);
        }
      }
    );
  };

  const getStatusText = (status: TrainingStatusEnum) => {
    switch (status) {
      case TrainingStatusEnum.NotFound:
        return t('voice_cloning.training_status_not_found');
      case TrainingStatusEnum.Training:
        return t('voice_cloning.training_status_training');
      case TrainingStatusEnum.Success:
      case TrainingStatusEnum.Active:
        return t('voice_cloning.training_status_success');
      case TrainingStatusEnum.Failed:
        return t('voice_cloning.training_status_failed');
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: TrainingStatusEnum) => {
    switch (status) {
      case TrainingStatusEnum.Success:
      case TrainingStatusEnum.Active:
        return 'text-green-600';
      case TrainingStatusEnum.Training:
        return 'text-blue-600';
      case TrainingStatusEnum.Failed:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const isPending =
    downloadMutation.isPending || startTrainingMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('voice_cloning.training_page_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('voice_cloning.training_page_desc')}
          </p>
        </div>
      </div>

      {/* 训练表单 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-900">
            {t('voice_cloning.start_training_button')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('voice_cloning.input_bv_placeholder')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bvId">BV ID / URL</Label>
            <Input
              id="bvId"
              type="text"
              placeholder={t('voice_cloning.input_bv_placeholder')}
              value={bvId}
              onChange={(e) => setBvId(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speakerId">
              {t('voice_cloning.speaker_id_label')}
            </Label>
            <Input
              id="speakerId"
              type="text"
              placeholder={t('voice_cloning.speaker_id_placeholder')}
              value={speakerId}
              onChange={(e) => setSpeakerId(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-slate-500">
              {t('voice_cloning.speaker_id_help')}
            </p>
          </div>

          <Button
            onClick={handleDownloadAndTrain}
            disabled={isPending || !bvId.trim() || !speakerId.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {isDownloading
                  ? t('voice_cloning.downloading_audio')
                  : t('voice_cloning.training_status_training')}
              </>
            ) : (
              t('voice_cloning.start_training_button')
            )}
          </Button>

          {/* 下载进度 */}
          {isDownloading && subscribeProgress.data && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Spinner className="h-4 w-4" />
                <span>
                  {subscribeProgress.data.message ||
                    t('voice_cloning.progress_downloading')}
                </span>
                <span className="ml-auto font-medium">
                  {subscribeProgress.data.progress}%
                </span>
              </div>
              <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${subscribeProgress.data.progress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 训练列表 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-900">
              {t('voice_cloning.training_list_title')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchTrainings()}
              disabled={isLoadingTrainings}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingTrainings ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTrainings ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {t('voice_cloning.training_list_empty')}
            </div>
          ) : (
            <div className="space-y-3">
              {trainings.map((training) => (
                <div
                  key={training.speakerId}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <h3 className="font-medium text-slate-900 truncate">
                        {training.title}
                      </h3>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                      <span>ID: {training.speakerId}</span>
                      <span className={getStatusColor(training.status)}>
                        {getStatusText(training.status)}
                      </span>
                      <span>
                        {new Date(training.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {training.status === TrainingStatusEnum.Success ||
                    training.status === TrainingStatusEnum.Active ? (
                      <Link
                        to="/voice-cloning/synthesis"
                        search={{ speakerId: training.speakerId }}
                      >
                        <Button size="sm" variant="default">
                          {t('voice_cloning.use_for_synthesis')}
                        </Button>
                      </Link>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(training.speakerId)}
                      disabled={deleteTrainingMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
