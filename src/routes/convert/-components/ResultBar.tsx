import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';

export interface ResultBarProps {
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  downloadUrl?: string;
  onReset?: () => void;
}

export function ResultBar({
  status,
  errorMessage,
  downloadUrl,
  onReset
}: ResultBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mt-6 p-3 border rounded-lg bg-white flex items-center justify-between">
      <div className="text-sm">
        {status === 'idle' && (
          <span className="text-slate-500">{t('status_idle')}</span>
        )}
        {status === 'uploading' && (
          <span className="text-slate-700">{t('status_uploading')}</span>
        )}
        {status === 'processing' && (
          <span className="text-slate-700">{t('status_processing')}</span>
        )}
        {status === 'done' && (
          <span className="text-emerald-700">{t('status_done')}</span>
        )}
        {status === 'error' && (
          <span className="text-rose-700">
            {t('status_error')}
            {errorMessage ? `: ${errorMessage}` : ''}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {downloadUrl && status === 'done' ? (
          <a href={downloadUrl} download>
            <Button size="sm">{t('download_result')}</Button>
          </a>
        ) : null}
        {onReset ? (
          <Button size="sm" variant="outline" onClick={onReset}>
            {t('clear')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
