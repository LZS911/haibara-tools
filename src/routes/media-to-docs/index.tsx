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
import { StepIcon } from '@/routes/convert/-components';
import { BvInput } from './-components/BvInput';
import { OptionsSelector } from './-components/OptionsSelector';
import { ProcessingSteps } from './-components/ProcessingSteps';
import { ContentPreview } from './-components/ContentPreview';
import type { AiConvertStep } from './-types';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import { useMutation, skipToken } from '@tanstack/react-query';
import type { LLMProvider, SummaryStyle, Keyframe } from './-types';
import { nanoid } from 'nanoid';
import { Button } from '../-components/ui/button';
import { useSubscription } from '@trpc/tanstack-react-query';
import { TimelineView } from './-components/TimelineView';
import { parseTimelineContent } from './-lib/utils';
import { useAppStore } from '@/store/app';

export const Route = createFileRoute('/media-to-docs/')({
  component: AiConvert
});

function AiConvert() {
  const { t } = useTranslation();
  const { setIsTaskRunning } = useAppStore();
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
            setErrorMessage(t('download_failed_check_bv'));
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

  const handleStartProcessing = (
    style: SummaryStyle,
    provider: LLMProvider,
    enableVision: boolean
  ) => {
    if (!audioPath) return;

    setSelectedStyle(style);
    setCurrentStep('processing');
    setIsTaskRunning(true);

    summarizeMutation.mutate(
      {
        audioPath,
        videoPath: videoPath || undefined,
        style,
        provider,
        enableVision,
        skipAsr: false, // 🧪 测试模式：如需跳过 ASR，取消注释
        jobId
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
    if (!style) return t('generated_content_title');
    const key = `style_${style}`;
    // Assuming you have translations like style_note, style_summary, etc.
    return t(key, style.charAt(0).toUpperCase() + style.slice(1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('ai_convert_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('ai_convert_desc')}
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
                {t('step1_input_bv_id')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('input_bv_id_desc')}
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
                        {t('downloading_video')}
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
                {t('step2_select_style')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('select_style_desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <OptionsSelector
                onStart={handleStartProcessing}
                disabled={summarizeMutation.isPending}
                hasVideo={!!videoPath}
              />
            </CardContent>
          </Card>
        )}

        {/* 步骤 3: 处理中 */}
        {currentStep === 'processing' && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 font-medium text-slate-900">
                <StepIcon
                  step="converting"
                  className="text-slate-700"
                  size={20}
                />
                {t('step3_processing')}
              </CardTitle>
              <CardDescription className="text-sm">
                {t('processing_desc')}
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
                      {t('step4_completed')}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {t('completed_desc')}
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
                      {t('timeline_view')}
                    </Button>
                    <Button
                      variant={
                        displayMode === 'markdown' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setDisplayMode('markdown')}
                    >
                      {t('document_view')}
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
            <div className="flex items-center gap-2 text-red-700">
              <StepIcon step="error" className="text-red-600" size={20} />
              <div>
                <div className="font-medium text-sm">
                  {t('conversion_failed')}
                </div>
                <div className="text-xs">
                  {errorMessage ||
                    subscribeProgress.data?.error ||
                    downloadMutation.error?.message ||
                    summarizeMutation.error?.message}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
