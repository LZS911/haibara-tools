import { useTranslation } from 'react-i18next';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Switch } from '@/routes/-components/ui/switch';
import { Button } from '@/routes/-components/ui/button';
import { Label } from '@/routes/-components/ui/label';
import type { AppConfig } from '@/electron';

interface BilibiliSettingsProps {
  config: AppConfig;
  handleInputChange: (key: keyof AppConfig, value: string | boolean) => void;
}

export function BilibiliSettings({
  config,
  handleInputChange
}: BilibiliSettingsProps) {
  const { t } = useTranslation();

  return (
    <Card className="mt-6 border-slate-200 bg-white p-6">
      <div className="mb-4">
        <h3 className="text-base font-medium text-slate-900">
          {t('settings.bilibili_title')}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {t('settings.bilibili_desc')}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label
            htmlFor="BILIBILI_SESSDATA"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            SESSDATA
          </Label>
          <Input
            id="BILIBILI_SESSDATA"
            type="password"
            placeholder={t('settings.bilibili_sessdata_placeholder')}
            value={config.BILIBILI_SESSDATA || ''}
            onChange={(e) =>
              handleInputChange('BILIBILI_SESSDATA', e.target.value)
            }
          />
          <p className="mt-1 text-xs text-slate-500">
            {t('settings.bilibili_sessdata_tip')}
          </p>
        </div>
        <div>
          <Label
            htmlFor="BILIBILI_BFE_ID"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            BFE_ID {t('settings.optional')}
          </Label>
          <Input
            id="BILIBILI_BFE_ID"
            type="text"
            placeholder={t('settings.bilibili_bfe_id_placeholder')}
            value={config.BILIBILI_BFE_ID || ''}
            onChange={(e) =>
              handleInputChange('BILIBILI_BFE_ID', e.target.value)
            }
          />
        </div>
        <div>
          <Label
            htmlFor="BILIBILI_DOWNLOAD_PATH"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {t('settings.bilibili_download_path')}
          </Label>
          <div className="flex gap-2">
            <Input
              id="BILIBILI_DOWNLOAD_PATH"
              type="text"
              placeholder={t('settings.bilibili_download_path_placeholder')}
              value={config.BILIBILI_DOWNLOAD_PATH || ''}
              onChange={(e) =>
                handleInputChange('BILIBILI_DOWNLOAD_PATH', e.target.value)
              }
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={async () => {
                if (window.electronAPI) {
                  const path = await window.electronAPI.selectFolder();
                  if (path) {
                    handleInputChange('BILIBILI_DOWNLOAD_PATH', path);
                  }
                }
              }}
            >
              {t('settings.select_folder')}
            </Button>
          </div>
        </div>
        <div>
          <Label
            htmlFor="BILIBILI_DOWNLOADING_MAX_SIZE"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {t('settings.bilibili_max_download_size')}
          </Label>
          <Input
            id="BILIBILI_DOWNLOADING_MAX_SIZE"
            type="number"
            placeholder="1"
            value={config.BILIBILI_DOWNLOADING_MAX_SIZE ?? ''}
            onChange={(e) =>
              handleInputChange('BILIBILI_DOWNLOADING_MAX_SIZE', e.target.value)
            }
          />
          <p className="mt-1 text-xs text-slate-500">
            {t('settings.bilibili_max_download_size_tip')}
          </p>
        </div>
        {/* Download Options */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label
                htmlFor="bili-is-danmaku"
                className="font-medium text-slate-800"
              >
                {t('settings.bilibili_download_danmaku')}
              </Label>
              <p className="text-sm text-slate-500">
                {t('settings.bilibili_download_danmaku_desc')}
              </p>
            </div>
            <Switch
              id="bili-is-danmaku"
              checked={!!config.BILIBILI_IS_DANMAKU}
              onCheckedChange={(checked) =>
                handleInputChange('BILIBILI_IS_DANMAKU', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label
                htmlFor="bili-is-cover"
                className="font-medium text-slate-800"
              >
                {t('settings.bilibili_download_cover')}
              </Label>
              <p className="text-sm text-slate-500">
                {t('settings.bilibili_download_cover_desc')}
              </p>
            </div>
            <Switch
              id="bili-is-cover"
              checked={config.BILIBILI_IS_COVER !== false}
              onCheckedChange={(checked) =>
                handleInputChange('BILIBILI_IS_COVER', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label
                htmlFor="bili-is-subtitle"
                className="font-medium text-slate-800"
              >
                {t('settings.bilibili_download_subtitle')}
              </Label>
              <p className="text-sm text-slate-500">
                {t('settings.bilibili_download_subtitle_desc')}
              </p>
            </div>
            <Switch
              id="bili-is-subtitle"
              checked={!!config.BILIBILI_IS_SUBTITLE}
              onCheckedChange={(checked) =>
                handleInputChange('BILIBILI_IS_SUBTITLE', checked)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label
                htmlFor="bili-is-folder"
                className="font-medium text-slate-800"
              >
                {t('settings.bilibili_create_folder')}
              </Label>
              <p className="text-sm text-slate-500">
                {t('settings.bilibili_create_folder_desc')}
              </p>
            </div>
            <Switch
              id="bili-is-folder"
              checked={config.BILIBILI_IS_FOLDER !== false}
              onCheckedChange={(checked) =>
                handleInputChange('BILIBILI_IS_FOLDER', checked)
              }
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
