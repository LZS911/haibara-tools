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
            {t('merge_audio_video', '合并音视频')}
          </p>
          <p className="text-xs text-slate-500">
            {t('merge_audio_video_desc', '将分离的视频和音频合并为一个文件')}
          </p>
        </div>
        <Switch checked={isMerge} onCheckedChange={onMergeChange} />
      </div>

      {isMerge && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {t('delete_source_files', '删除源文件')}
            </p>
            <p className="text-xs text-slate-500">
              {t('delete_source_files_desc', '合并后删除原始的视频和音频文件')}
            </p>
          </div>
          <Switch checked={isDelete} onCheckedChange={onDeleteChange} />
        </div>
      )}
    </div>
  );
}
