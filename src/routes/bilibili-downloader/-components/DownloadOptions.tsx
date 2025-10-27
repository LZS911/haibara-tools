import { Switch } from '@/routes/-components/ui/switch';
import { useTranslation } from 'react-i18next';

interface DownloadOptionsProps {
  isMerge: boolean;
  isDelete: boolean;
  onMergeChange: (value: boolean) => void;
  onDeleteChange: (value: boolean) => void;
}

export function DownloadOptions({
  isMerge,
  isDelete,
  onMergeChange,
  onDeleteChange
}: DownloadOptionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {t('bilibili_downloader.merge_audio_video')}
          </p>
          <p className="text-xs text-slate-500">
            {t('bilibili_downloader.merge_audio_video_desc')}
          </p>
        </div>
        <Switch checked={isMerge} onCheckedChange={onMergeChange} />
      </div>

      {isMerge && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {t('bilibili_downloader.delete_source_files')}
            </p>
            <p className="text-xs text-slate-500">
              {t('bilibili_downloader.delete_source_files_desc')}
            </p>
          </div>
          <Switch checked={isDelete} onCheckedChange={onDeleteChange} />
        </div>
      )}
    </div>
  );
}
