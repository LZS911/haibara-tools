import { useTranslation } from 'react-i18next';
import { LoginStatus } from '@/types/bilibili';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
interface QualitySelectorProps {
  options: Array<{ label: string; value: number }>;
  value?: number;
  onChange: (value: number) => void;
  loginStatus: LoginStatus;
}

export function QualitySelector({
  options,
  value,
  onChange,
  loginStatus
}: QualitySelectorProps) {
  const { t } = useTranslation();

  const loginStatusMap: Record<LoginStatus, string> = {
    [LoginStatus.visitor]: t('bilibili_downloader.not_login'),
    [LoginStatus.user]: t('bilibili_downloader.normal_user'),
    [LoginStatus.vip]: t('bilibili_downloader.vip_user')
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {t('bilibili_downloader.quality_selector_label')}
      </label>
      <Select
        value={value?.toString() || ''}
        onValueChange={(e) => onChange(Number(e))}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={t('bilibili_downloader.quality_selector_label')}
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="text-xs text-slate-500">
        {t('bilibili_downloader.current_login_status', {
          loginStatus: loginStatusMap[loginStatus as LoginStatus]
        })}
      </p>

      {loginStatus < LoginStatus.vip && (
        <p className="text-xs text-slate-500">
          {loginStatus === LoginStatus.visitor
            ? t('bilibili_downloader.quality_login_tip')
            : t('bilibili_downloader.quality_vip_tip')}
        </p>
      )}
    </div>
  );
}
