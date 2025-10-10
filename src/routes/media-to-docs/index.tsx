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
import { AIConvertIcon } from '@/routes/-components/svg/ai-convert-icon';
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

export const Route = createFileRoute('/media-to-docs/')({
  component: AiConvert
});

function AiConvert() {
  const { t } = useTranslation();
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

    downloadMutation.mutate(
      { bvId, jobId: newJobId },
      {
        onSuccess: (data) => {
          if (data.success && data.audioPath) {
            setAudioPath(data.audioPath);
            setVideoPath(data.videoPath || null);
            setCurrentStep('select-style');
          } else {
            setErrorMessage('下载失败，请检查BV号是否正确');
          }
        },
        onError: (error) => {
          setErrorMessage(error.message);
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
    if (!style) return t('generated_content_title', 'AI 生成内容');
    const key = `style_${style}`;
    // Assuming you have translations like style_note, style_summary, etc.
    return t(key, style.charAt(0).toUpperCase() + style.slice(1));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-6">
          <AIConvertIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          {t('ai_convert_title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t(
            'ai_convert_desc',
            '输入B站视频BV号，AI为你生成内容纪要、文章、笔记等多种格式的文档'
          )}
        </p>
      </div>

      {/* 快捷链接 */}
      <div className="mb-6 flex justify-center gap-3">
        <Link to="/media-to-docs/cache-management">
          <Button variant="outline" size="sm">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            缓存管理
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* 步骤 1: 输入 BV 号 */}
        {currentStep === 'input-bv-id' && (
          <Card className="border-2 border-purple-100 shadow-xl bg-gradient-to-br from-white to-purple-50">
            <CardHeader className="rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="uploadFile" // 复用现有图标
                  className="text-purple-600"
                  size={24}
                />
                {t('step1_input_bv_id', '第一步：输入B站视频BV号')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('input_bv_id_desc', '我们将自动下载视频并进行处理')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <BvInput
                value={bvId}
                onChange={setBvId}
                onStart={handleStart}
                disabled={downloadMutation.isPending}
              />
              {downloadMutation.isPending && (
                <div className="mt-6">
                  {subscribeProgress.data?.stage === 'downloading' ? (
                    <ProcessingSteps
                      stage="downloading"
                      progress={subscribeProgress.data?.progress || 0}
                      message={subscribeProgress.data?.message}
                    />
                  ) : (
                    <div className="flex items-center justify-center text-gray-600">
                      <Spinner className="w-6 h-6 mr-2" />
                      <span>{t('downloading_video', '下载中，请稍候...')}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 步骤 2: 选择风格 */}
        {currentStep === 'select-style' && (
          <Card className="border-2 border-blue-100 shadow-xl bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="selectType" // 复用现有图标
                  className="text-blue-600"
                  size={24}
                />
                {t('step2_select_style', '第二步：选择输出选项')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('select_style_desc', '选择你希望AI生成的文档风格和驱动模型')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
          <Card className="border-2 border-yellow-100 shadow-xl bg-gradient-to-br from-white to-yellow-50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <StepIcon
                  step="converting" // 复用现有图标
                  className="text-yellow-600"
                  size={24}
                />
                {t('step3_processing', '第三步：处理中')}
              </CardTitle>
              <CardDescription className="text-lg">
                {t('processing_desc', 'AI正在努力工作中，请稍候...')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
          <Card className="border-2 border-emerald-100 shadow-xl bg-gradient-to-br from-white to-emerald-50">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <StepIcon
                    step="completed"
                    className="text-emerald-600"
                    size={24}
                  />
                  <div>
                    <CardTitle className="text-2xl">
                      {t('step4_completed', '第四步：转换完成')}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {t('completed_desc', '你的文档已生成，快来查看吧！')}
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
                      📅 时间轴
                    </Button>
                    <Button
                      variant={
                        displayMode === 'markdown' ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setDisplayMode('markdown')}
                    >
                      📝 文档
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8">
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
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-3 text-red-700">
              <StepIcon step="error" className="text-red-600" size={24} />
              <div>
                <div className="font-semibold">
                  {t('conversion_failed', '转换失败')}
                </div>
                <div className="text-sm">
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
