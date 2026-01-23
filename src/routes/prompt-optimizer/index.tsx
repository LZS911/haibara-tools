import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/router';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '@/routes/-components/ui/tabs';
import { toast } from 'sonner';
import { Spinner } from '@/routes/-components/spinner';
import { PromptInput } from './-components/prompt-input';
import { ProviderSelector } from './-components/provider-selector';
import { OptimizationOptions } from './-components/optimization-options';
import { AdvancedOptions } from './-components/advanced-options';
import { ActionBar } from './-components/action-bar';
import { OptimizationResult } from './-components/optimization-result';
import { HistoryList } from './-components/history-list';
import { FavoritesList } from './-components/favorites-list';
import type {
  OptimizationLevel,
  LanguageStyle,
  OutputFormat,
  PromptType,
  TemplateType,
  ImageTool,
  TemplateLanguage,
  OptimizationRequest
} from '@/types/prompt-optimizer';
import type { LLMProvider } from '@/types/llm';
import { useClipboard, useSubmitHotkey, useScrollToRef } from '../-lib/hooks';

export const Route = createFileRoute('/prompt-optimizer/')({
  component: PromptOptimizerPage
});

function PromptOptimizerPage() {
  const { t } = useTranslation();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const scrollToResult = useScrollToRef(resultRef);
  const { copy } = useClipboard();

  // 表单状态（与服务端 OptimizationRequestSchema 对齐）
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [promptType, setPromptType] = useState<PromptType>('creative');
  const [optimizationLevel, setOptimizationLevel] =
    useState<OptimizationLevel>('standard');
  const [languageStyle, setLanguageStyle] =
    useState<LanguageStyle>('professional');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('text');
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [language, setLanguage] = useState<TemplateLanguage>('chinese');

  // 高级选项
  const [templateType, setTemplateType] = useState<TemplateType | undefined>(
    'text'
  );
  const [context, setContext] = useState<string | undefined>(undefined);
  const [imageTool, setImageTool] = useState<ImageTool | undefined>(undefined);
  const [artisticStyle, setArtisticStyle] = useState<string | undefined>(
    undefined
  );
  const [composition, setComposition] = useState<string | undefined>(undefined);
  const [additionalRequirements, setAdditionalRequirements] = useState<
    string | undefined
  >(undefined);

  const requestPayload = useMemo(
    () => ({
      originalPrompt,
      promptType,
      optimizationLevel,
      languageStyle,
      outputFormat,
      provider,
      language,
      templateType,
      context,
      imageTool,
      artisticStyle,
      composition,
      additionalRequirements
    }),
    [
      originalPrompt,
      promptType,
      optimizationLevel,
      languageStyle,
      outputFormat,
      provider,
      language,
      templateType,
      context,
      imageTool,
      artisticStyle,
      composition,
      additionalRequirements
    ]
  );

  const optimizeMutation = useMutation(
    trpc.promptOptimizer.optimize.mutationOptions()
  );

  const { data: templates } = useQuery(
    trpc.promptOptimizer.getTemplates.queryOptions({ category: promptType })
  );

  const handleSubmit = () => {
    if (originalPrompt.trim().length < 10) {
      toast(
        t('prompt_optimizer.validation_error') +
          ': ' +
          t('prompt_optimizer.validation_min_length')
      );
      return;
    }
    if (originalPrompt.length > 5000) {
      toast(
        t('prompt_optimizer.validation_error') +
          ': ' +
          t('prompt_optimizer.validation_max_length')
      );
      return;
    }
    optimizeMutation.mutate(requestPayload, {
      onSuccess: () => {
        scrollToResult();
      },
      onError: (error) => {
        const message = error?.message ?? String(error ?? 'Unknown error');
        toast(t('prompt_optimizer.error_title') + ': ' + message);
      }
    });
  };

  useSubmitHotkey(handleSubmit);

  // Handle restore from history or favorites
  const handleRestore = (request: OptimizationRequest) => {
    setOriginalPrompt(request.originalPrompt);
    setPromptType(request.promptType);
    setOptimizationLevel(request.optimizationLevel);
    setLanguageStyle(request.languageStyle);
    setOutputFormat(request.outputFormat);
    setProvider(request.provider);
    setLanguage(request.language);
    setTemplateType(request.templateType);
    setContext(request.context);
    setImageTool(request.imageTool);
    setArtisticStyle(request.artisticStyle);
    setComposition(request.composition);
    setAdditionalRequirements(request.additionalRequirements);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('prompt_optimizer.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('prompt_optimizer.subtitle')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="optimize" className="w-full">
        <TabsList>
          <TabsTrigger value="optimize">
            {t('prompt_optimizer.optimize_tab')}
          </TabsTrigger>
          <TabsTrigger value="history">
            {t('prompt_optimizer.history_tab')}
          </TabsTrigger>
          <TabsTrigger value="favorites">
            {t('prompt_optimizer.favorites_tab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="optimize" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：输入与配置 */}
            <Card className="border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-medium text-slate-900">
                  {t('prompt_optimizer.input_title')}
                </CardTitle>
                <CardDescription className="text-sm">
                  {t('prompt_optimizer.input_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <PromptInput
                  value={originalPrompt}
                  onChange={setOriginalPrompt}
                  disabled={optimizeMutation.isPending}
                />

                <div className="h-px bg-slate-200" />

                <OptimizationOptions
                  value={{
                    promptType,
                    optimizationLevel,
                    languageStyle,
                    outputFormat,
                    language
                  }}
                  onChange={({
                    promptType: pt,
                    optimizationLevel: ol,
                    languageStyle: ls,
                    outputFormat: of,
                    language: lang
                  }: {
                    promptType: typeof promptType;
                    optimizationLevel: typeof optimizationLevel;
                    languageStyle: typeof languageStyle;
                    outputFormat: typeof outputFormat;
                    language: string;
                  }) => {
                    setPromptType(pt);
                    setOptimizationLevel(ol);
                    setLanguageStyle(ls);
                    setOutputFormat(of);
                    setLanguage(lang as TemplateLanguage);
                  }}
                  disabled={optimizeMutation.isPending}
                />

                <ProviderSelector
                  value={provider}
                  onChange={setProvider}
                  disabled={optimizeMutation.isPending}
                />

                <AdvancedOptions
                  value={{
                    templateType,
                    context,
                    imageTool,
                    artisticStyle,
                    composition,
                    additionalRequirements
                  }}
                  onChange={({
                    templateType: tt,
                    context: ctx,
                    imageTool: it,
                    artisticStyle: as,
                    composition: comp,
                    additionalRequirements: ar
                  }: {
                    templateType?: typeof templateType;
                    context?: string;
                    imageTool?: typeof imageTool;
                    artisticStyle?: string;
                    composition?: string;
                    additionalRequirements?: string;
                  }) => {
                    setTemplateType(tt);
                    setContext(ctx);
                    setImageTool(it);
                    setArtisticStyle(as);
                    setComposition(comp);
                    setAdditionalRequirements(ar);
                  }}
                  disabled={optimizeMutation.isPending}
                />

                <ActionBar
                  isSubmitting={optimizeMutation.isPending}
                  onSubmit={handleSubmit}
                  onClear={() => setOriginalPrompt('')}
                />
              </CardContent>
            </Card>

            {/* 右侧：结果 */}
            <div ref={resultRef}>
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-slate-900">
                    {t('prompt_optimizer.result_title')}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {t('prompt_optimizer.result_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {optimizeMutation.isPending && (
                    <div className="flex items-center justify-center text-slate-600 py-8">
                      <Spinner className="w-5 h-5 mr-2" />
                      <span className="text-sm">
                        {t('prompt_optimizer.optimizing')}
                      </span>
                    </div>
                  )}

                  {!optimizeMutation.isPending && optimizeMutation.data && (
                    <OptimizationResult
                      value={optimizeMutation.data}
                      onCopyOptimized={() =>
                        copy(optimizeMutation.data.optimizedPrompt)
                      }
                      onCopyExplanation={() =>
                        copy(optimizeMutation.data.optimizationExplanation)
                      }
                      onCopyAll={() =>
                        copy(
                          `${optimizeMutation.data.optimizedPrompt}\n\n${optimizeMutation.data.optimizationExplanation}`
                        )
                      }
                    />
                  )}
                </CardContent>
              </Card>

              {/* 轻量模板提示（不做模板库 UI） */}
              {templates && templates.length > 0 && (
                <div className="text-xs text-slate-500 mt-2">
                  {t('prompt_optimizer.templates_hint', {
                    count: templates.length
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t('prompt_optimizer.history_title')}
            </h2>
            <HistoryList onRestore={handleRestore} />
          </div>
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t('prompt_optimizer.favorites_title')}
            </h2>
            <FavoritesList onRestore={handleRestore} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
