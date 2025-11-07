import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/routes/-components/ui/card';
import { Input } from '@/routes/-components/ui/input';
import { Button } from '@/routes/-components/ui/button';
import { Label } from '@/routes/-components/ui/label';
import { trpc } from '@/router';
import type { AppConfig } from '@/electron';
import type { LLMProvider } from '@/types/llm';
import { ChevronRight, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../-components/ui/select';

interface LlmSettingsProps {
  config: AppConfig;
  handleInputChange: (key: keyof AppConfig, value: string | boolean) => void;
}

export function LlmSettings({ config, handleInputChange }: LlmSettingsProps) {
  const { t } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(
    null
  );

  const llmProvidersQuery = useQuery(trpc.llm.getProviders.queryOptions());
  const modelSuggestionsQuery = useQuery({
    ...trpc.llm.getModelSuggestions.queryOptions({
      provider: selectedProvider!
    }),
    enabled: !!selectedProvider
  });

  if (llmProvidersQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!selectedProvider ? (
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
                    {provider.apiKeyField && (
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
                              provider.apiKeyField!,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}

                    {provider.baseURLField && (
                      <div>
                        <Label
                          htmlFor={provider.baseURLField}
                          className="mb-2 block text-sm font-medium text-slate-700"
                        >
                          {t('settings.base_url')}
                        </Label>
                        <Input
                          id={provider.baseURLField}
                          type="text"
                          placeholder={t('settings.base_url_placeholder')}
                          value={config[provider.baseURLField] as string}
                          onChange={(e) =>
                            handleInputChange(
                              provider.baseURLField as keyof AppConfig,
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}

                    <div>
                      <Label
                        htmlFor={provider.modelNameField}
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        {t('settings.model_name')}
                      </Label>
                      {modelSuggestionsQuery.data &&
                      modelSuggestionsQuery.data.length > 0 ? (
                        <Select
                          value={config[provider.modelNameField] as string}
                          onValueChange={(value) =>
                            handleInputChange(provider.modelNameField, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t(
                                'bilibili_downloader.quality_selector_label'
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {modelSuggestionsQuery.data.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
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
                      )}
                      {provider.defaultModel && (
                        <p className="mt-1 text-xs text-slate-500">
                          {t('settings.default_model', {
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
    </div>
  );
}
