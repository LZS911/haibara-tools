import { createFileRoute } from '@tanstack/react-router';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { BvInput } from './-components/BvInput';
import { OptionsSelector } from './-components/OptionsSelector';
import { ProcessingSteps } from './-components/ProcessingSteps';
import { ContentPreview } from './-components/ContentPreview';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import { useMutation, skipToken } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Button } from '../-components/ui/button';
import { useSubscription } from '@trpc/tanstack-react-query';
import { TimelineView } from './-components/TimelineView';
import { parseTimelineContent } from './-lib/utils';
import { useAppStore } from '@/store/app';
import { StepIcon } from './-components/Icons/StepIcon';
import type {
  AiConvertStep,
  SummaryStyle,
  KeyframeStrategy,
  Keyframe
} from '@/types/media-to-docs';
import type { LLMProvider } from '@/types/llm';

export const Route = createFileRoute('/media-to-docs/')({
  component: AiConvert,
  staticData: { keepAlive: true }
});

function AiConvert() {
  const { t } = useTranslation();
  const { setIsTaskRunning, jobToLoadFromHistory, setJobToLoadFromHistory } =
    useAppStore();
  const [bvId, setBvId] = useState('BV11T4EzyEdF');
  const [currentStep, setCurrentStep] = useState<AiConvertStep>('input-bv-id');
  const [jobId, setJobId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [summarizedContent, setSummarizedContent] = useState<string | null>(
    null
  );
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [displayMode, setDisplayMode] = useState<'timeline' | 'markdown'>(
    'timeline'
  );

  useEffect(() => {
    if (jobToLoadFromHistory) {
      console.log('Loading job from history:', jobToLoadFromHistory);
      // 从历史记录加载任务
      setBvId(jobToLoadFromHistory.bvId);
      setAudioPath(jobToLoadFromHistory.audioPath);
      setVideoPath(jobToLoadFromHistory.videoPath);
      setCurrentStep('select-style');

      // 重置错误和之前任务的状态
      setErrorMessage(undefined);
      downloadMutation.reset();
      summarizeMutation.reset();
      setSummarizedContent(null);
      setSelectedStyle(null);
      setKeyframes([]);
      setJobId('');
      setDisplayMode('timeline');

      // 清理 store 中的任务，防止重复加载
      setJobToLoadFromHistory(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobToLoadFromHistory]);

  const downloadMutation = useMutation(
    trpc.mediaToDoc.downloadBvVideo.mutationOptions()
  );

  const summarizeMutation = useMutation(
    trpc.mediaToDoc.summarize.mutationOptions()
  );

  const subscribeProgress = useSubscription(
    trpc.mediaToDoc.subscribeProgress.subscriptionOptions(
      jobId ? { jobId } : skipToken
    )
  );

  const handleStart = async () => {
    setErrorMessage(undefined);
    const newJobId = nanoid();
    setJobId(newJobId);
    setIsTaskRunning(true);

    downloadMutation.mutate(
      { bvId, jobId: newJobId },
      {
        onSuccess: (data) => {
          if (data.success && data.audioPath) {
            setAudioPath(data.audioPath);
            setVideoPath(data.videoPath || null);
            setCurrentStep('select-style');
          } else {
            setErrorMessage(t('media_to_docs.download_failed_check_bv'));
          }
        },
        onError: (error) => {
          setErrorMessage(error.message);
        },
        onSettled: () => {
          setIsTaskRunning(false);
        }
      }
    );
  };

  const handleStartProcessing = (params: {
    style: SummaryStyle;
    provider: LLMProvider;
    enableVision: boolean;
    keyframeStrategy: KeyframeStrategy;
    forceAsr: boolean;
    forceKeyframeGeneration: boolean;
    keywords?: string;
  }) => {
    if (!audioPath) return;

    const {
      style,
      provider,
      enableVision,
      keyframeStrategy,
      forceAsr,
      forceKeyframeGeneration,
      keywords
    } = params;

    setSelectedStyle(style);
    setCurrentStep('processing');
    setIsTaskRunning(true);

    const currentJobId = jobId || nanoid();
    if (!jobId) {
      setJobId(currentJobId);
    }

    summarizeMutation.mutate(
      {
        audioPath,
        videoPath: videoPath || undefined,
        style,
        provider,
        enableVision,
        keyframeStrategy,
        jobId: currentJobId,
        keywords,
        forceAsr,
        forceKeyframeGeneration
      },
      {
        onSuccess: (data) => {
          setSummarizedContent(data.summarizedContent);
          setKeyframes(data.keyframes || []);
          // 如果有关键帧，默认显示时间轴视图
          if (data.keyframes && data.keyframes.length > 0) {
            setDisplayMode('timeline');
          } else {
            setDisplayMode('markdown');
          }
          setCurrentStep('completed');
        },
        onError: (error) => {
          setErrorMessage(error.message);
        },
        onSettled: () => {
          setIsTaskRunning(false);
        }
      }
    );
  };

  const handleReset = () => {
    setBvId('');
    setCurrentStep('input-bv-id');
    setJobId('');
    setErrorMessage(undefined);
    setAudioPath(null);
    setVideoPath(null);
    setSummarizedContent(null);
    setSelectedStyle(null);
    setKeyframes([]);
    setDisplayMode('timeline');
    downloadMutation.reset();
    summarizeMutation.reset();
  };

  const getTitleForStyle = (style: string | null) => {
    if (!style) return t('media_to_docs.generated_content_title');
    return style.charAt(0).toUpperCase() + style.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('media_to_docs.ai_convert_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('media_to_docs.ai_convert_desc')}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* 步骤 1: 输入 BV 号 */}
        {currentStep === 'input-bv-id' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="uploadFile"
                  className="text-slate-700"
                  size={20}
                />
                {t('media_to_docs.step1_input_bv_id')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('media_to_docs.input_bv_id_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <BvInput
                value={bvId}
                onChange={setBvId}
                onStart={handleStart}
                disabled={downloadMutation.isPending}
              />
              {downloadMutation.isPending && (
                <div className="mt-4">
                  {subscribeProgress.data?.stage === 'downloading' ? (
                    <ProcessingSteps
                      stage="downloading"
                      progress={subscribeProgress.data?.progress || 0}
                      message={subscribeProgress.data?.message}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-slate-600">
                      <Spinner className="w-5 h-5 mr-2" />
                      <span className="text-sm">
                        {t('media_to_docs.downloading_video')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 步骤 2: 选择风格 */}
        {currentStep === 'select-style' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="selectType"
                  className="text-slate-700"
                  size={20}
                />
                {t('media_to_docs.step2_select_style')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('media_to_docs.select_style_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <OptionsSelector
                onStart={handleStartProcessing}
                disabled={summarizeMutation.isPending}
                hasVideo={!!videoPath}
              />
            </CardContent>
          </Card>
        )}

        {/* 步骤 3: 处理中 */}
        {currentStep === 'processing' &&
          !(
            subscribeProgress.data?.stage === 'error' ||
            downloadMutation.isError ||
            summarizeMutation.isError
          ) && (
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                  <StepIcon
                    step="converting"
                    className="text-slate-700"
                    size={20}
                  />
                  {t('media_to_docs.step3_processing')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('media_to_docs.processing_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <ProcessingSteps
                  stage={subscribeProgress.data?.stage || 'downloading'}
                  progress={subscribeProgress.data?.progress || 0}
                  message={subscribeProgress.data?.message || undefined}
                />
              </CardContent>
            </Card>
          )}

        {/* 步骤 4: 完成 */}
        {currentStep === 'completed' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <StepIcon
                    step="completed"
                    className="text-green-600"
                    size={20}
                  />
                  <div>
                    <CardTitle className="text-base font-medium text-slate-900">
                      {t('media_to_docs.step4_completed')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('media_to_docs.completed_desc')}
                    </CardDescription>
                  </div>
                </div>
                {/* 视图切换按钮 */}
                {keyframes.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant={
                        displayMode === 'timeline' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setDisplayMode('timeline')}
                    >
                      {t('media_to_docs.timeline_view')}
                    </Button>
                    <Button
                      variant={
                        displayMode === 'markdown' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setDisplayMode('markdown')}
                    >
                      {t('media_to_docs.document_view')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {displayMode === 'timeline' && keyframes.length > 0 ? (
                <TimelineView
                  items={parseTimelineContent(
                    summarizedContent || '',
                    keyframes
                  )}
                  onReset={handleReset}
                />
              ) : (
                <ContentPreview
                  onReset={handleReset}
                  content={summarizedContent}
                  title={getTitleForStyle(selectedStyle)}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* 错误状态 */}
        {(subscribeProgress.data?.stage === 'error' ||
          downloadMutation.isError ||
          summarizeMutation.isError) && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <StepIcon step="error" className="text-red-600" size={20} />
                <div>
                  <div className="font-medium text-sm">
                    {t('media_to_docs.conversion_failed')}
                  </div>
                  <div className="text-xs">
                    {errorMessage ||
                      subscribeProgress.data?.error ||
                      downloadMutation.error?.message ||
                      summarizeMutation.error?.message}
                  </div>
                </div>
              </div>
              <Button variant="destructive" size="sm" onClick={handleReset}>
                {t('media_to_docs.reset')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
