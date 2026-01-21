import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/routes/-components/ui/tabs';
import type { AppConfig } from '@/electron';
import { Save, RefreshCw, Info, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CONSTANT } from '../../data/constant';
import { cn } from '../-lib/utils';
import { LlmSettings } from './-components/llm-settings';
import { MediaToDocsSettings } from './-components/media-to-docs-settings';
import { BilibiliSettings } from './-components/bilibili-settings';
import { GitSettings } from './-components/git-settings';
import { DocsSettings } from './-components/docs-settings';

export const Route = createFileRoute('/settings/')({
  component: Settings,
  staticData: { keepAlive: true }
});

function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AppConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userDataPath, setUserDataPath] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!CONSTANT.IS_ELECTRON) {
      navigate({ to: '/' });
      return;
    }

    loadConfig();
    loadAppInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const loadConfig = async () => {
    if (!window.electronAPI) return;

    try {
      const loadedConfig = await window.electronAPI.getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({
        type: 'error',
        text: t('load_fail', '加载配置失败')
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppInfo = async () => {
    if (!window.electronAPI) return;

    try {
      const [path, version] = await Promise.all([
        window.electronAPI.getUserDataPath(),
        window.electronAPI.getAppVersion()
      ]);
      setUserDataPath(path);
      setAppVersion(version);
    } catch (error) {
      console.error('Failed to load app info:', error);
    }
  };

  const handleSave = async () => {
    if (!window.electronAPI) return;

    setSaving(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.saveConfig(config);
      if (result.success) {
        setMessage({
          type: 'success',
          text: t('settings.save_success')
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: t('settings.save_failed', { error: result.error })
        });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({
        type: 'error',
        text: t('settings.save_fail_base')
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof AppConfig, value: string | boolean) => {
    const isNumberField = key === 'BILIBILI_DOWNLOADING_MAX_SIZE';

    if (isNumberField) {
      const num = parseInt(value as string, 10);
      setConfig((prev) => ({
        ...prev,
        [key]: isNaN(num) ? undefined : num
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        [key]: value
      }));
    }
  };

  if (!CONSTANT.IS_ELECTRON) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('settings.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('settings.desc')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('settings.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings.save')}
            </>
          )}
        </Button>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 应用信息 */}
      <Card className="border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Info className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-slate-900">
              {t('settings.config_location')}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <p
                onClick={async () => {
                  if (window.electronAPI) {
                    await window.electronAPI.openPath(userDataPath);
                  }
                }}
                className={cn('break-all text-slate-600 flex-1', {
                  'text-blue-500 cursor-pointer': CONSTANT.IS_ELECTRON
                })}
              >
                {userDataPath}
              </p>
              {CONSTANT.IS_ELECTRON && userDataPath && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={async () => {
                    if (window.electronAPI) {
                      await window.electronAPI.openPath(userDataPath);
                    }
                  }}
                  title={t('settings.open_folder')}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="mt-2 text-slate-600">
              {t('settings.app_version', { appVersion })}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs 区域 */}
      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="llm">{t('settings.tab_llm')}</TabsTrigger>
          <TabsTrigger value="media-to-docs">
            {t('settings.tab_media_to_docs')}
          </TabsTrigger>
          <TabsTrigger value="bilibili">
            {t('settings.tab_bilibili')}
          </TabsTrigger>
          <TabsTrigger value="git">{t('settings.tab_git')}</TabsTrigger>
          <TabsTrigger value="docs">{t('docs_manager.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="llm">
          <LlmSettings config={config} handleInputChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="media-to-docs">
          <MediaToDocsSettings
            config={config}
            handleInputChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="bilibili">
          <BilibiliSettings
            config={config}
            handleInputChange={handleInputChange}
          />
        </TabsContent>

        <TabsContent value="git">
          <GitSettings config={config} handleInputChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="docs">
          <DocsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
