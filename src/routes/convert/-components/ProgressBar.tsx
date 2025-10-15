import { useTranslation } from 'react-i18next';
import { type ProgressBarProps } from './types';
import { StatusIcon, CheckMark } from './icons';

export function ProgressBar({ progress, status, fileName }: ProgressBarProps) {
  const { t } = useTranslation();

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return t('progress_uploading_file');
      case 'processing':
        return t('progress_converting_file');
      case 'done':
        return t('progress_conversion_completed');
      case 'error':
        return t('progress_conversion_failed');
      default:
        return t('progress_preparing');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return (
          <StatusIcon status="uploading" className="text-blue-600" size={32} />
        );
      case 'processing':
        return (
          <StatusIcon
            status="processing"
            className="text-yellow-600"
            size={32}
          />
        );
      case 'done':
        return (
          <StatusIcon status="done" className="text-emerald-600" size={32} />
        );
      case 'error':
        return <StatusIcon status="error" className="text-red-600" size={32} />;
      default:
        return <StatusIcon status="idle" className="text-gray-600" size={32} />;
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'uploading':
        return 'from-blue-500 to-cyan-500';
      case 'processing':
        return 'from-yellow-500 to-orange-500';
      case 'done':
        return 'from-emerald-500 to-green-500';
      case 'error':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* File information */}
      {fileName && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
          <StatusIcon status="check" className="text-gray-600" size={24} />
          <div>
            <div className="font-medium text-gray-900">
              {t('progress_processing_file')}
            </div>
            <div className="text-sm text-gray-600">{fileName}</div>
          </div>
        </div>
      )}

      {/* Status display */}
      <div className="flex items-center gap-3 mb-4">
        <div>{getStatusIcon()}</div>
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {getStatusText()}
          </div>
          <div className="text-sm text-gray-600">
            {t('progress_percent_complete', { progress })}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{t('progress_label')}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getProgressBarColor()} transition-all duration-500 ease-out rounded-full relative`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* {t('progress_animation_effect')} */}
            {status === 'uploading' || status === 'processing' ? (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
            ) : null}
          </div>
        </div>
      </div>

      {/* {t('progress_stage_indicator')} */}
      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <div
          className={`flex items-center gap-1 ${progress >= 20 ? 'text-green-600 font-medium' : ''}`}
        >
          {progress >= 20 ? (
            <CheckMark className="text-green-600" size={12} />
          ) : (
            '○'
          )}{' '}
          {t('progress_create_task')}
        </div>
        <div
          className={`flex items-center gap-1 ${progress >= 40 ? 'text-green-600 font-medium' : ''}`}
        >
          {progress >= 40 ? (
            <CheckMark className="text-green-600" size={12} />
          ) : (
            '○'
          )}{' '}
          {t('progress_upload_file')}
        </div>
        <div
          className={`flex items-center gap-1 ${progress >= 60 ? 'text-green-600 font-medium' : ''}`}
        >
          {progress >= 60 ? (
            <CheckMark className="text-green-600" size={12} />
          ) : (
            '○'
          )}{' '}
          {t('progress_start_conversion')}
        </div>
        <div
          className={`flex items-center gap-1 ${progress >= 100 ? 'text-green-600 font-medium' : ''}`}
        >
          {progress >= 100 ? (
            <CheckMark className="text-green-600" size={12} />
          ) : (
            '○'
          )}{' '}
          {t('progress_conversion_complete')}
        </div>
      </div>

      {/* {t('progress_loading_animation')} */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="flex items-center justify-center mt-6">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div
              className="w-3 h-3 bg-pink-500 rounded-full animate-bounce"
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
