import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Button } from '@/routes/-components/ui/button';
import type { AppConfig } from '@/electron';
import { Save, RefreshCw, Info, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/settings/')({
  component: Settings
});

interface LLMProvider {
  id: string;
  name: string;
  description: string;
  apiKeyField: keyof AppConfig;
  modelNameField: keyof AppConfig;
  defaultModel?: string;
}

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

  const LLM_PROVIDERS: LLMProvider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      description: t('settings_openai_desc', 'GPT-4, GPT-3.5 等模型'),
      apiKeyField: 'OPENAI_API_KEY',
      modelNameField: 'OPENAI_MODEL_NAME',
      defaultModel: 'gpt-4o'
    },
    {
      id: 'deepseek',
      name: 'DeepSeek',
      description: t('settings_deepseek_desc', '中文优化，性价比高'),
      apiKeyField: 'DEEPSEEK_API_KEY',
      modelNameField: 'DEEPSEEK_MODEL_NAME',
      defaultModel: 'deepseek-chat'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      description: t('settings_gemini_desc', '有免费额度，适合开发测试'),
      apiKeyField: 'GEMINI_API_KEY',
      modelNameField: 'GEMINI_MODEL_NAME',
      defaultModel: 'gemini-2.0-flash-exp'
    },
    {
      id: 'claude',
      name: 'Anthropic Claude',
      description: t('settings_claude_desc', '长上下文，高质量输出'),
      apiKeyField: 'ANTHROPIC_API_KEY',
      modelNameField: 'ANTHROPIC_MODEL_NAME',
      defaultModel: 'claude-3-5-sonnet-20241022'
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      description: t('settings_openrouter_desc', '统一访问多个模型'),
      apiKeyField: 'OPENROUTER_API_KEY',
      modelNameField: 'OPENROUTER_MODEL_NAME',
      defaultModel: 'anthropic/claude-3.5-sonnet'
    },
    {
      id: 'groq',
      name: 'Groq',
      description: t('settings_groq_desc', '超快推理速度'),
      apiKeyField: 'GROQ_API_KEY',
      modelNameField: 'GROQ_MODEL_NAME',
      defaultModel: 'llama-3.3-70b-versatile'
    },
    {
      id: 'cohere',
      name: 'Cohere',
      description: t('settings_cohere_desc', '企业级 AI'),
      apiKeyField: 'COHERE_API_KEY',
      modelNameField: 'COHERE_MODEL_NAME',
      defaultModel: 'command-r-plus-08-2024'
    }
  ];

  // 检查是否在 Electron 环境
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    if (!isElectron) {
      navigate({ to: '/' });
      return;
    }

    loadConfig();
    loadAppInfo();
  }, [isElectron, navigate]);

  const loadConfig = async () => {
    if (!window.electronAPI) return;

    try {
      const loadedConfig = await window.electronAPI.getConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
      setMessage({ type: 'error', text: t('settings_load_fail', '加载配置失败') });
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
        setMessage({ type: 'success', text: t('settings_save_success', '配置保存成功！') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: t('settings_save_failed', { error: result.error }) });
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: t('settings_save_fail_base', '保存配置失败') });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof AppConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  // 检查提供商是否已配置
  const isProviderConfigured = (provider: LLMProvider) => {
    return !!(config[provider.apiKeyField] || config[provider.modelNameField]);
  };

  if (!isElectron) {
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
          <h1 className="text-2xl font-semibold text-slate-900">{t('settings_title', '设置')}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('settings_desc', '配置 API Keys 和应用设置')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('settings_saving', '保存中...')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings_save', '保存配置')}
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
            <p className="font-medium text-slate-900">{t('settings_config_location', '配置文件位置')}</p>
            <p className="mt-1 break-all text-slate-600">{userDataPath}</p>
            <p className="mt-2 text-slate-600">{t('settings_app_version', { appVersion })}</p>
          </div>
        </div>
      </Card>

      {/* LLM 提供商配置 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('settings_llm_section', 'LLM 提供商配置')}
        </h2>

        {!selectedProvider ? (
          /* 提供商选择列表 */
          <div className="space-y-2">
            {LLM_PROVIDERS.map((provider) => (
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
                      {isProviderConfigured(provider) && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {t('settings_provider_configured', '已配置')}
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
              {t('settings_back_to_providers', '← 返回提供商列表')}
            </Button>

            <Card className="border-slate-200 bg-white p-6">
              {(() => {
                const provider = LLM_PROVIDERS.find(
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
                        <label
                          htmlFor={provider.apiKeyField}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          API Key
                        </label>
                        <Input
                          id={provider.apiKeyField}
                          type="password"
                          placeholder={t('settings_api_key_placeholder', '输入 API Key')}
                          value={config[provider.apiKeyField] || ''}
                          onChange={(e) =>
                            handleInputChange(
                              provider.apiKeyField,
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={provider.modelNameField}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          Model Name
                        </label>
                        <Input
                          id={provider.modelNameField}
                          type="text"
                          placeholder={provider.defaultModel}
                          value={config[provider.modelNameField] || ''}
                          onChange={(e) =>
                            handleInputChange(
                              provider.modelNameField,
                              e.target.value
                            )
                          }
                        />
                        {provider.defaultModel && (
                          <p className="mt-1 text-xs text-slate-500">
                            {t('settings_default_model', { model: provider.defaultModel })}
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
      </div>

      {/* VOLC ASR 配置 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('settings_volc_asr_section', '火山引擎 ASR 配置')}
        </h2>
        <Card className="border-slate-200 bg-white p-6">
          <div className="mb-4">
            <h3 className="text-base font-medium text-slate-900">
              {t('settings_volc_asr_title', '语音识别服务')}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              {t('settings_volc_asr_desc', '用于视频转文档功能的语音识别')}
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="VOLC_APP_ID"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                App ID
              </label>
              <Input
                id="VOLC_APP_ID"
                type="text"
                placeholder={t('settings_app_id_placeholder', '输入 App ID')}
                value={config.VOLC_APP_ID || ''}
                onChange={(e) =>
                  handleInputChange('VOLC_APP_ID', e.target.value)
                }
              />
            </div>
            <div>
              <label
                htmlFor="VOLC_ACCESS_TOKEN"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Access Token
              </label>
              <Input
                id="VOLC_ACCESS_TOKEN"
                type="password"
                placeholder={t('settings_access_token_placeholder', '输入 Access Token')}
                value={config.VOLC_ACCESS_TOKEN || ''}
                onChange={(e) =>
                  handleInputChange('VOLC_ACCESS_TOKEN', e.target.value)
                }
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
