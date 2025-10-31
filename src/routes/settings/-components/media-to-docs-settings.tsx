import { useTranslation } from 'react-i18next';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import type { AppConfig } from '@/electron';

interface MediaToDocsSettingsProps {
  config: AppConfig;
  handleInputChange: (key: keyof AppConfig, value: string) => void;
}

export function MediaToDocsSettings({
  config,
  handleInputChange
}: MediaToDocsSettingsProps) {
  const { t } = useTranslation();

  return (
    <Card className="mt-6 border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-slate-900">
          {t('settings.volc_asr_title')}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {t('settings.volc_asr_desc')}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="VOLC_APP_ID"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            App ID
          </Label>
          <Input
            id="VOLC_APP_ID"
            type="text"
            placeholder={t('settings.app_id_placeholder')}
            value={config.VOLC_APP_ID || ''}
            onChange={(e) => handleInputChange('VOLC_APP_ID', e.target.value)}
          />
        </div>
        <div>
          <Label
            htmlFor="VOLC_ACCESS_TOKEN"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Access Token
          </Label>
          <Input
            id="VOLC_ACCESS_TOKEN"
            type="password"
            placeholder={t('settings.access_token_placeholder')}
            value={config.VOLC_ACCESS_TOKEN || ''}
            onChange={(e) =>
              handleInputChange('VOLC_ACCESS_TOKEN', e.target.value)
            }
          />
        </div>
      </div>
    </Card>
  );
}
