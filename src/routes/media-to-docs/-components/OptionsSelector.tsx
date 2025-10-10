import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import { useState } from 'react';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { cn } from '@/routes/-lib/utils';
import { trpc } from '@/router';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { SummaryStyle, LLMProvider } from '../-types';

const STYLES: { id: SummaryStyle; name: string }[] = [
  { id: 'note', name: '结构笔记' },
  { id: 'summary', name: '内容摘要' },
  { id: 'article', name: '自媒体文章' },
  { id: 'mindmap', name: '思维导图' },
  { id: 'social-media-post', name: '社交媒体帖子' },
  { id: 'table', name: '信息表格' }
];

const PROVIDERS: { id: LLMProvider; name: string; description?: string }[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 - 高质量通用模型' },
  { id: 'deepseek', name: 'DeepSeek', description: '中文优化，性价比高' },
  { id: 'gemini', name: 'Gemini', description: 'Google - 大免费额度' },
  { id: 'anthropic', name: 'Claude', description: '长上下文，高质量' },
  { id: 'openrouter', name: 'OpenRouter', description: '统一访问多模型' },
  { id: 'groq', name: 'Groq', description: '超快推理速度' },
  { id: 'cohere', name: 'Cohere', description: '企业级 AI' }
];

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

interface OptionsSelectorProps {
  onStart: (
    style: SummaryStyle,
    provider: LLMProvider,
    enableVision: boolean
  ) => void;
  disabled?: boolean;
  hasVideo?: boolean;
}

export function OptionsSelector({
  onStart,
  disabled,
  hasVideo = false
}: OptionsSelectorProps) {
  const { t } = useTranslation();
  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('note');
  const [selectedProvider, setSelectedProvider] =
    useState<LLMProvider>('openai');
  const [enableVision, setEnableVision] = useState(true);

  // 支持视觉的模型
  const visionProviders: LLMProvider[] = ['openai', 'anthropic', 'gemini'];
  const initialTestStatus: Record<LLMProvider, TestStatus> = {
    openai: 'idle',
    deepseek: 'idle',
    gemini: 'idle',
    anthropic: 'idle',
    openrouter: 'idle',
    groq: 'idle',
    cohere: 'idle'
  };
  const [testStatus, setTestStatus] =
    useState<Record<LLMProvider, TestStatus>>(initialTestStatus);

  const checkModelMutation = useMutation(
    trpc.mediaToDoc.checkModelAvailability.mutationOptions()
  );

  const handleTestProvider = (provider: LLMProvider) => {
    setTestStatus((prev) => ({ ...prev, [provider]: 'testing' }));
    checkModelMutation.mutate(
      { provider },
      {
        onSuccess: (data) => {
          setTestStatus((prev) => ({
            ...prev,
            [provider]: data.isAvailable ? 'success' : 'error'
          }));
        },
        onError: () => {
          setTestStatus((prev) => ({ ...prev, [provider]: 'error' }));
        }
      }
    );
  };

  const renderStatusIcon = (provider: LLMProvider) => {
    const status = testStatus[provider];
    switch (status) {
      case 'testing':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-transparent">
        <CardHeader className="px-2">
          <CardTitle className="text-xl">
            {t('select_style_title', '1. 选择内容风格')}
          </CardTitle>
          <CardDescription>
            {t('select_style_desc_new', '选择你希望 AI 生成的文档风格')}
          </CardDescription>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2">
          {STYLES.map((style) => (
            <Button
              key={style.id}
              variant="outline"
              size="lg"
              className={cn(
                'p-6 h-auto text-lg hover:bg-blue-50 hover:border-blue-400',
                selectedStyle === style.id &&
                  'border-blue-500 bg-blue-50 text-blue-600'
              )}
              onClick={() => setSelectedStyle(style.id)}
            >
              {t(style.id, style.name)}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="bg-transparent">
        <CardHeader className="px-2">
          <CardTitle className="text-xl">
            {t('select_provider_title', '2. 选择大语言模型')}
          </CardTitle>
          <CardDescription>
            {t('select_provider_desc', '不同的模型会影响内容质量和响应速度')}
          </CardDescription>
        </CardHeader>
        <div className="space-y-3 p-2">
          {PROVIDERS.map((provider) => (
            <div key={provider.id} className="flex items-center gap-2">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  'flex-grow p-4 h-auto text-left hover:bg-green-50 hover:border-green-400',
                  selectedProvider === provider.id &&
                    'border-green-500 bg-green-50 text-green-600'
                )}
                onClick={() => setSelectedProvider(provider.id)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-medium">
                    {t(provider.id, provider.name)}
                  </span>
                  {provider.description && (
                    <span className="text-sm text-gray-500">
                      {provider.description}
                    </span>
                  )}
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleTestProvider(provider.id)}
                disabled={
                  checkModelMutation.isPending &&
                  testStatus[provider.id] === 'testing'
                }
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800"
              >
                {renderStatusIcon(provider.id)}
                <span>{t('test_connectivity', '测试')}</span>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {hasVideo && (
        <Card className="bg-transparent">
          <CardHeader className="px-2">
            <CardTitle className="text-xl">
              {t('vision_mode_title', '3. 视觉增强模式')}
            </CardTitle>
            <CardDescription>
              {t(
                'vision_mode_desc',
                '启用后将提取视频关键帧，生成图文结合的时间轴笔记'
              )}
            </CardDescription>
          </CardHeader>
          <div className="p-2 space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">启用视觉模式</div>
                <div className="text-sm text-gray-500 mt-1">
                  {visionProviders.includes(selectedProvider)
                    ? '✅ 当前模型支持视觉功能'
                    : '⚠️ 当前模型不支持视觉功能，请选择 OpenAI、Anthropic 或 Gemini'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enableVision}
                  onChange={(e) => setEnableVision(e.target.checked)}
                  disabled={!visionProviders.includes(selectedProvider)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {enableVision && visionProviders.includes(selectedProvider) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                💡 提示：视觉模式将自动生成时间轴风格的笔记，包含关键画面描述
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="text-center pt-6">
        <Button
          size="lg"
          className="w-full max-w-xs text-xl py-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:opacity-90"
          onClick={() => {
            onStart(selectedStyle, selectedProvider, enableVision);
          }}
          disabled={disabled}
        >
          {t('start_generation_button', '开始生成')}
        </Button>
      </div>
    </div>
  );
}
