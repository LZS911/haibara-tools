import { useTranslation } from 'react-i18next';
import { Spinner } from '@/routes/-components/spinner';
import type { ProgressStage } from '../-types';

interface ProcessingStepsProps {
  stage: ProgressStage;
  progress: number; // 0-100
  message?: string;
}

const stageMapping: Record<ProgressStage, { text: string; color: string }> = {
  downloading: { text: '视频下载中', color: 'text-blue-600' },
  transcribing: { text: '语音识别中', color: 'text-purple-600' },
  'extracting-keyframes': { text: '提取关键帧中', color: 'text-orange-600' },
  generating: { text: '文档生成中', color: 'text-green-600' },
  completed: { text: '处理完成', color: 'text-emerald-600' },
  error: { text: '处理失败', color: 'text-red-600' }
};

export function ProcessingSteps({
  stage,
  progress,
  message
}: ProcessingStepsProps) {
  const { t } = useTranslation();
  const stageInfo = stageMapping[stage] || stageMapping.downloading;

  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8">
      {/* 进度圆环 */}
      <div className="relative w-32 h-32">
        {stage !== 'completed' && stage !== 'error' && (
          <Spinner className="w-32 h-32 text-yellow-500" />
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${stageInfo.color}`}
        >
          {progress}%
        </div>
      </div>

      {/* 状态文本 */}
      <div className="text-center space-y-2">
        <p className={`text-xl font-semibold ${stageInfo.color}`}>
          {t(stage, stageInfo.text)}
        </p>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-md">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
