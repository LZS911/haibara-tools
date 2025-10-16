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

const loginStatusMap: Record<LoginStatus, string> = {
  [LoginStatus.visitor]: '未登录',
  [LoginStatus.user]: '普通用户',
  [LoginStatus.vip]: '大会员'
};

export function QualitySelector({
  options,
  value,
  onChange,
  loginStatus
}: QualitySelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {t('quality_selector_label', '选择清晰度')}
      </label>
      <Select
        value={value?.toString() || ''}
        onValueChange={(e) => onChange(Number(e))}
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={t('quality_selector_label', '选择清晰度')}
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
        {t('current_login_status', '当前登录状态：{{loginStatus}}', {
          loginStatus: loginStatusMap[loginStatus as LoginStatus]
        })}
      </p>

      {loginStatus < LoginStatus.vip && (
        <p className="text-xs text-slate-500">
          {loginStatus === LoginStatus.visitor
            ? t('quality_login_tip', '登录后可下载更高清晰度')
            : t('quality_vip_tip', '开通大会员可下载4K及以上清晰度')}
        </p>
      )}
    </div>
  );
}
