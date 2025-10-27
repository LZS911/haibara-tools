import { createFileRoute } from '@tanstack/react-router';
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
import {
  useMutation,
  useQuery,
  skipToken,
  useQueryClient
} from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { useSubscription } from '@trpc/tanstack-react-query';
import { TrainingStatusEnum } from '@/types/voice-cloning';
import { toast } from 'sonner';
import { RefreshCw, Trash2, Plus } from 'lucide-react';
import { useConfirmationDialog } from '../../-components/ui/use-confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../-components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/routes/-components/ui/dialog';
import { SpeakerStatusItem } from './-components/SpeakerStatusItem';

export const Route = createFileRoute('/voice-cloning/training/')({
  component: VoiceTrainingPage,
  staticData: { keepAlive: true }
});

function VoiceTrainingPage() {
  const { t } = useTranslation();
  const { confirm } = useConfirmationDialog();
  const queryClient = useQueryClient();

  // 下载状态
  const [bvIdOrUrl, setBvIdOrUrl] = useState('BV1dg41187wd');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [jobId, setJobId] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [refreshingSpeakerId, setRefreshingSpeakerId] = useState<string | null>(
    null
  );

  // 新增音色 ID 状态
  const [isAddSpeakerIDDialogOpen, setIsAddSpeakerIDDialogOpen] =
    useState(false);
  const [newSpeakerID, setNewSpeakerID] = useState('');
  const [newSpeakerName, setNewSpeakerName] = useState('');

  // mutations
  const downloadMutation = useMutation(
    trpc.voiceCloning.downloadBvAudio.mutationOptions()
  );

  const startTrainingMutation = useMutation(
    trpc.voiceCloning.startTraining.mutationOptions()
  );

  const addSpeakerIDMutation = useMutation({
    ...trpc.voiceCloning.addSpeakerID.mutationOptions(),
    onSuccess: (data) => {
      toast.success(t('voice_cloning.add_speaker_success'));
      queryClient.invalidateQueries(
        trpc.voiceCloning.listSpeakerIDs.queryOptions()
      );
      setNewSpeakerID('');
      setNewSpeakerName('');
      setIsAddSpeakerIDDialogOpen(false);
      if (data.speaker) {
        setSelectedSpeakerId(data.speaker.id);
      }
    },
    onError: (error) => {
      toast.error(t('voice_cloning.add_speaker_failed') + ': ' + error.message);
    }
  });

  const deleteSpeakerIDMutation = useMutation({
    ...trpc.voiceCloning.deleteSpeakerID.mutationOptions(),
    onSuccess: () => {
      toast.success(t('voice_cloning.delete_speaker_success'));
      queryClient.invalidateQueries(
        trpc.voiceCloning.listSpeakerIDs.queryOptions()
      );
    },
    onError: (error) => {
      toast.error(
        t('voice_cloning.delete_speaker_failed') + ': ' + error.message
      );
    }
  });

  const handleRefreshStatus = async (speakerId: string) => {
    setRefreshingSpeakerId(speakerId);
    try {
      await queryClient.fetchQuery(
        trpc.voiceCloning.getTrainingStatus.queryOptions({ speakerId })
      );

      // Invalidate the specific speaker's status query to refetch
      queryClient.invalidateQueries(
        trpc.voiceCloning.getTrainingStatus.queryOptions({ speakerId })
      );
      toast.success(t('voice_cloning.status_updated'));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRefreshingSpeakerId(null);
    }
  };

  // 查询音色 ID 列表
  const {
    data: speakerIDs = [],
    refetch: refetchSpeakerIDs,
    isLoading: isLoadingSpeakerIDs
  } = useQuery(trpc.voiceCloning.listSpeakerIDs.queryOptions());

  // 订阅下载进度
  const subscribeProgress = useSubscription(
    trpc.voiceCloning.subscribeProgress.subscriptionOptions(
      jobId ? { jobId } : skipToken
    )
  );

  const handleDownloadAndTrain = async () => {
    if (!bvIdOrUrl.trim()) {
      toast.error(t('voice_cloning.error_no_bv_id'));
      return;
    }

    if (!selectedSpeakerId.trim()) {
      toast.error(t('voice_cloning.error_no_speaker_id'));
      return;
    }

    const newJobId = nanoid();
    setJobId(newJobId);
    setIsDownloading(true);

    const currentBvId = bvIdOrUrl;
    const currentSpeakerId = selectedSpeakerId;

    // 第一步：下载音频
    downloadMutation.mutate(
      { bvIdOrUrl: currentBvId, jobId: newJobId },
      {
        onSuccess: async (data) => {
          setIsDownloading(false);
          if (data.success && data.audioPath) {
            toast.info(t('voice_cloning.download_success_start_training'));
            // 重置表单
            setBvIdOrUrl('');
            // selectedSpeakerId 不重置，保持选中状态

            // 第二步：启动训练
            startTrainingMutation.mutate(
              {
                audioPath: data.audioPath,
                speakerId: currentSpeakerId,
                bvIdOrUrl: currentBvId,
                title: data.title || currentBvId
              },
              {
                onSuccess: () => {
                  toast.success(t('voice_cloning.training_succeeded'));
                  // 训练成功后，刷新音色状态
                  queryClient.invalidateQueries(
                    trpc.voiceCloning.getTrainingStatus.queryOptions({
                      speakerId: currentSpeakerId
                    })
                  );
                },
                onError: (error) => {
                  toast.error(
                    `${t('voice_cloning.training_failed')}: ${error.message}`
                  );
                  // 训练失败后，刷新音色状态
                  queryClient.invalidateQueries(
                    trpc.voiceCloning.getTrainingStatus.queryOptions({
                      speakerId: currentSpeakerId
                    })
                  );
                }
              }
            );
          } else {
            toast.error(t('voice_cloning.error_download_failed'));
          }
        },
        onError: (error) => {
          toast.error(error.message);
          setIsDownloading(false);
        }
      }
    );
  };

  const handleAddSpeakerID = () => {
    if (!newSpeakerID.trim() || !newSpeakerName.trim()) {
      toast.error(t('voice_cloning.error_speaker_id_name_required'));
      return;
    }
    addSpeakerIDMutation.mutate({ id: newSpeakerID, name: newSpeakerName });
  };

  const handleDeleteSpeakerID = async (speakerId: string) => {
    const confirmed = await confirm({
      title: t('voice_cloning.confirm_delete_speaker_title'),
      description: t('voice_cloning.confirm_delete_speaker_desc')
    });

    if (!confirmed) return;

    deleteSpeakerIDMutation.mutate({ speakerId });
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

  const isSubmitting = downloadMutation.isPending;

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

      {/* 音色管理 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium text-slate-900">
            {t('voice_cloning.speaker_management_title')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddSpeakerIDDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('voice_cloning.add_speaker_button')}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingSpeakerIDs ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : speakerIDs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {t('voice_cloning.no_speakers_added')}
            </div>
          ) : (
            <div className="space-y-3">
              {speakerIDs.map((speaker) => (
                <div
                  key={speaker.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 truncate">
                      {speaker.name} ({speaker.id})
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {t('voice_cloning.added_on')}:{' '}
                      {new Date(speaker.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteSpeakerID(speaker.id)}
                    disabled={
                      deleteSpeakerIDMutation.isPending &&
                      deleteSpeakerIDMutation.variables?.speakerId ===
                        speaker.id
                    }
                  >
                    {deleteSpeakerIDMutation.isPending &&
                    deleteSpeakerIDMutation.variables?.speakerId ===
                      speaker.id ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加音色 ID 对话框 */}
      <Dialog
        open={isAddSpeakerIDDialogOpen}
        onOpenChange={setIsAddSpeakerIDDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('voice_cloning.add_speaker_title')}</DialogTitle>
            <DialogDescription>
              {t('voice_cloning.add_speaker_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newSpeakerName" className="text-right">
                {t('voice_cloning.speaker_name_label')}
              </Label>
              <Input
                id="newSpeakerName"
                value={newSpeakerName}
                onChange={(e) => setNewSpeakerName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newSpeakerID" className="text-right">
                {t('voice_cloning.speaker_id_label')}
              </Label>
              <Input
                id="newSpeakerID"
                value={newSpeakerID}
                onChange={(e) => setNewSpeakerID(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleAddSpeakerID}
              disabled={
                addSpeakerIDMutation.isPending ||
                !newSpeakerID.trim() ||
                !newSpeakerName.trim()
              }
            >
              {addSpeakerIDMutation.isPending ? (
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('voice_cloning.save_speaker_button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <Label htmlFor="bvIdOrUrl">BV ID / URL</Label>
            <Input
              id="bvIdOrUrl"
              type="text"
              placeholder={t('voice_cloning.input_bv_placeholder')}
              value={bvIdOrUrl}
              onChange={(e) => setBvIdOrUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="speakerId">
              {t('voice_cloning.speaker_id_label')}
            </Label>
            <Select
              value={selectedSpeakerId}
              onValueChange={setSelectedSpeakerId}
              disabled={
                isSubmitting || isLoadingSpeakerIDs || speakerIDs.length === 0
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t('voice_cloning.select_speaker_placeholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {speakerIDs.map((speaker) => (
                  <SelectItem key={speaker.id} value={speaker.id}>
                    {speaker.name} ({speaker.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleDownloadAndTrain}
            disabled={
              isSubmitting || !bvIdOrUrl.trim() || !selectedSpeakerId.trim()
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                {t('voice_cloning.downloading_audio')}
              </>
            ) : (
              t('voice_cloning.start_training_button')
            )}
          </Button>

          {/* 下载进度 */}
          {isDownloading && subscribeProgress.data && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
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

      {/* 音色状态列表 */}
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium text-slate-900">
              {t('voice_cloning.speaker_status_list_title')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSpeakerIDs()}
              disabled={isLoadingSpeakerIDs}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingSpeakerIDs ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingSpeakerIDs ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
            </div>
          ) : speakerIDs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {t('voice_cloning.no_speakers_to_display')}
            </div>
          ) : (
            <div className="space-y-3">
              {speakerIDs.map((speaker) => (
                <SpeakerStatusItem
                  key={speaker.id}
                  speaker={speaker}
                  refreshingSpeakerId={refreshingSpeakerId}
                  handleRefreshStatus={handleRefreshStatus}
                  getStatusText={getStatusText}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
