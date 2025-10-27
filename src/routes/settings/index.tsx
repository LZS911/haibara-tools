import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Switch } from '@/routes/-components/ui/switch';
import { Button } from '@/routes/-components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/routes/-components/ui/tabs';
import { trpc } from '@/router';
import type { AppConfig } from '@/electron';
import { Save, RefreshCw, Info, ChevronRight, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CONSTANT } from '../../data/constant';
import { cn } from '../-lib/utils';
import { Label } from '../-components/ui/label';

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
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const llmProvidersQuery = useQuery(trpc.llm.getProviders.queryOptions());

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
          text: t('save_success', '配置保存成功！')
        });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: 'error',
          text: t('save_failed', { error: result.error })
        });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({
        type: 'error',
        text: t('save_fail_base', '保存配置失败')
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

  if (loading || llmProvidersQuery.isLoading) {
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="llm">{t('settings.tab_llm')}</TabsTrigger>
          <TabsTrigger value="media-to-docs">
            {t('settings.tab_media_to_docs')}
          </TabsTrigger>
          <TabsTrigger value="bilibili">
            {t('settings.tab_bilibili')}
          </TabsTrigger>
          <TabsTrigger value="git">{t('settings.tab_git')}</TabsTrigger>
        </TabsList>

        {/* Tab 1: LLM 配置 */}
        <TabsContent value="llm" className="mt-6">
          {!selectedProvider ? (
            /* 提供商选择列表 */
            <div className="space-y-2">
              {llmProvidersQuery.data?.map((provider) => (
                <Card
                  key={provider.id}
                  className="cursor-pointer border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-sm"
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">
                          {provider.name}
                        </h3>
                        {provider.isConfigured && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {t('settings.provider_configured')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {provider.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            /* 提供商配置表单 */
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedProvider(null)}
              >
                {t('settings.back_to_providers')}
              </Button>

              <Card className="border-slate-200 bg-white p-6">
                {(() => {
                  const provider = llmProvidersQuery.data?.find(
                    (p) => p.id === selectedProvider
                  );
                  if (!provider) return null;

                  return (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {provider.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {provider.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor={provider.apiKeyField}
                            className="mb-2 block text-sm font-medium text-slate-700"
                          >
                            API Key
                          </Label>
                          <Input
                            id={provider.apiKeyField}
                            type="password"
                            placeholder={t('settings.api_key_placeholder')}
                            value={config[provider.apiKeyField] as string}
                            onChange={(e) =>
                              handleInputChange(
                                provider.apiKeyField,
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor={provider.modelNameField}
                            className="mb-2 block text-sm font-medium text-slate-700"
                          ></Label>
                          <Input
                            id={provider.modelNameField}
                            type="text"
                            placeholder={provider.defaultModel}
                            value={config[provider.modelNameField] as string}
                            onChange={(e) =>
                              handleInputChange(
                                provider.modelNameField,
                                e.target.value
                              )
                            }
                          />
                          {provider.defaultModel && (
                            <p className="mt-1 text-xs text-slate-500">
                              {t('default_model', {
                                model: provider.defaultModel
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: 视频转文档配置 */}
        <TabsContent value="media-to-docs" className="mt-6">
          <Card className="border-slate-200 bg-white p-6">
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
                  onChange={(e) =>
                    handleInputChange('VOLC_APP_ID', e.target.value)
                  }
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
                  placeholder={t(
                    'access_token_placeholder',
                    '输入 Access Token'
                  )}
                  value={config.VOLC_ACCESS_TOKEN || ''}
                  onChange={(e) =>
                    handleInputChange('VOLC_ACCESS_TOKEN', e.target.value)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Bilibili 下载配置 */}
        <TabsContent value="bilibili" className="mt-6">
          <Card className="border-slate-200 bg-white p-6">
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
                  BFE_ID {t('optional', '(可选)')}
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
                    placeholder={t(
                      'settings.bilibili_download_path_placeholder'
                    )}
                    value={config.BILIBILI_DOWNLOAD_PATH || ''}
                    onChange={(e) =>
                      handleInputChange(
                        'BILIBILI_DOWNLOAD_PATH',
                        e.target.value
                      )
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
                    handleInputChange(
                      'BILIBILI_DOWNLOADING_MAX_SIZE',
                      e.target.value
                    )
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
        </TabsContent>

        {/* Tab 4: Git 配置 */}
        <TabsContent value="git" className="mt-6">
          <Card className="border-slate-200 bg-white p-6">
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
                  onChange={(e) =>
                    handleInputChange('GITHUB_TOKEN', e.target.value)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
