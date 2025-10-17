import { useTranslation } from 'react-i18next';
import { Spinner } from '@/routes/-components/spinner';
import type { ProgressStage } from '../-types';

interface ProcessingStepsProps {
  stage: ProgressStage;
  progress: number; // 0-100
  message?: string;
}

export function ProcessingSteps({
  stage,
  progress,
  message
}: ProcessingStepsProps) {
  const { t } = useTranslation();

  const stageMapping: Record<ProgressStage, { text: string; color: string }> = {
    downloading: {
      text: t('media_to_docs.progress_stage_downloading'),
      color: 'text-blue-600'
    },
    transcribing: {
      text: t('media_to_docs.progress_stage_transcribing'),
      color: 'text-purple-600'
    },
    'extracting-keyframes': {
      text: t('media_to_docs.progress_stage_extracting_keyframes'),
      color: 'text-orange-600'
    },
    generating: {
      text: t('media_to_docs.progress_stage_generating'),
      color: 'text-green-600'
    },
    completed: {
      text: t('media_to_docs.progress_stage_completed'),
      color: 'text-emerald-600'
    },
    error: {
      text: t('media_to_docs.progress_stage_error'),
      color: 'text-red-600'
    }
  };

  const stageInfo = stageMapping[stage] || stageMapping.downloading;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4">
      {/* 进度圆环 */}
      <div className="relative w-24 h-24">
        {stage !== 'completed' && stage !== 'error' && (
          <Spinner className="w-24 h-24 text-yellow-500" />
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${stageInfo.color}`}
        >
          {progress}%
        </div>
      </div>

      {/* 状态文本 */}
      <div className="text-center space-y-1">
        <p className={`text-lg font-semibold ${stageInfo.color}`}>
          {stageInfo.text}
        </p>
        {message && <p className="text-xs text-gray-600">{message}</p>}
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-sm">
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
