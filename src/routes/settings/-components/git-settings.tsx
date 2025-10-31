import { useTranslation } from 'react-i18next';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import type { AppConfig } from '@/electron';

interface GitSettingsProps {
  config: AppConfig;
  handleInputChange: (key: keyof AppConfig, value: string) => void;
}

export function GitSettings({ config, handleInputChange }: GitSettingsProps) {
  const { t } = useTranslation();

  return (
    <Card className="mt-6 border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-slate-900">
          {t('settings.github_token_title')}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {t('settings.github_token_desc')}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="GITHUB_TOKEN"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            GitHub Token
          </Label>
          <Input
            id="GITHUB_TOKEN"
            type="password"
            placeholder={t('settings.github_token_placeholder')}
            value={config.GITHUB_TOKEN || ''}
            onChange={(e) => handleInputChange('GITHUB_TOKEN', e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
