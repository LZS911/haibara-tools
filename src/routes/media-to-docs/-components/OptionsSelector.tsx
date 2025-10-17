import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import { useState, useEffect } from 'react';
import { Card } from '@/routes/-components/ui/card';
import { cn } from '@/routes/-lib/utils';
import { trpc } from '@/router';
import { CheckCircle, XCircle, Loader, ChevronsUpDown } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { SummaryStyle, LLMProvider } from '../-types';
import { Switch } from '@/routes/-components/ui/switch';

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

  const optionsQuery = useQuery(trpc.mediaToDoc.getOptionsData.queryOptions());
  const { data: optionsData, isLoading, isError } = optionsQuery;

  const [selectedStyle, setSelectedStyle] = useState<SummaryStyle>('note');
  const [selectedProvider, setSelectedProvider] =
    useState<LLMProvider>('openai');
  const [enableVision, setEnableVision] = useState(true);
  const [isProvidersExpanded, setIsProvidersExpanded] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});

  const visionProviders: LLMProvider[] = ['openai', 'anthropic', 'gemini'];

  useEffect(() => {
    if (optionsData) {
      const { providers, providerStatuses } = optionsData;
      const isSelectedProviderConfigured =
        providerStatuses[selectedProvider] === 'success';

      if (!isSelectedProviderConfigured) {
        const firstAvailable = providers.find(
          (p) => providerStatuses[p.id] === 'success'
        );
        if (firstAvailable) {
          setSelectedProvider(firstAvailable.id as LLMProvider);
        }
      }
    }
  }, [optionsData, selectedProvider]);

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
          // Refetch data to get updated statuses
          optionsQuery.refetch();
        },
        onError: () => {
          setTestStatus((prev) => ({ ...prev, [provider]: 'error' }));
        }
      }
    );
  };

  const renderStatusIcon = (provider: LLMProvider) => {
    const currentTestStatus = testStatus[provider];
    if (currentTestStatus === 'testing') {
      return <Loader className="w-4 h-4 animate-spin" />;
    }

    const statusFromServer = optionsData?.providerStatuses[provider];
    switch (statusFromServer) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-transparent shadow-none p-4 flex justify-center items-center">
        <Loader className="w-6 h-6 animate-spin" />
      </Card>
    );
  }

  if (isError || !optionsData) {
    return (
      <Card className="bg-transparent shadow-none p-4 text-center text-red-500">
        {t('media_to_docs.error_loading_options')}
      </Card>
    );
  }

  const { styles, providers, providerStatuses } = optionsData;

  const visibleProviders = isProvidersExpanded
    ? providers
    : providers.slice(0, 3);

  return (
    <Card className="bg-transparent shadow-none p-4">
      <div className="space-y-4">
        {/* -- Content Style -- */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('media_to_docs.select_style_title')}
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {styles.map((style) => (
              <Button
                key={style.id}
                variant={selectedStyle === style.id ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => setSelectedStyle(style.id as SummaryStyle)}
              >
                {t(style.id, style.name)}
              </Button>
            ))}
          </div>
        </div>

        {/* -- LLM Provider -- */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {t('media_to_docs.select_provider_title')}
          </label>
          <div className="space-y-2 mt-2">
            {visibleProviders.map((provider) => {
              const isSelectable = providerStatuses[provider.id] === 'success';

              return (
                <div
                  key={provider.id}
                  className={cn(
                    'flex items-center gap-2 p-2 border rounded-md transition-all',
                    selectedProvider === provider.id &&
                      'border-blue-500 bg-blue-50',
                    isSelectable
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed opacity-60'
                  )}
                  onClick={() =>
                    isSelectable &&
                    setSelectedProvider(provider.id as LLMProvider)
                  }
                >
                  <div className="flex-grow">
                    <div className="text-sm font-medium">{provider.name}</div>
                    <div className="text-xs text-gray-500">
                      {provider.description}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestProvider(provider.id as LLMProvider);
                    }}
                    disabled={
                      checkModelMutation.isPending &&
                      testStatus[provider.id] === 'testing'
                    }
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-xs pr-0"
                  >
                    {renderStatusIcon(provider.id as LLMProvider)}
                    <span>{t('media_to_docs.test_connectivity')}</span>
                  </Button>
                </div>
              );
            })}
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-xs text-blue-600 p-0 h-auto"
            onClick={() => setIsProvidersExpanded(!isProvidersExpanded)}
          >
            <ChevronsUpDown className="w-3 h-3 mr-1" />
            {isProvidersExpanded
              ? t('media_to_docs.collapse')
              : t('media_to_docs.show_all')}
          </Button>
        </div>

        {/* -- Vision Mode -- */}
        {hasVideo && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('media_to_docs.vision_mode_title')}
            </label>
            <div className="flex items-center justify-between p-3 border rounded-lg bg-white mt-2">
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {t('media_to_docs.enable_vision_mode')}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {visionProviders.includes(selectedProvider)
                    ? t('media_to_docs.support_vision_mode_desc')
                    : t('media_to_docs.not_support_vision_mode_desc')}
                </div>
              </div>
              <Switch
                checked={
                  enableVision && visionProviders.includes(selectedProvider)
                }
                onCheckedChange={setEnableVision}
                disabled={!visionProviders.includes(selectedProvider)}
              />
            </div>
            {enableVision && visionProviders.includes(selectedProvider) && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                {t('media_to_docs.support_vision_mode_desc_not')}
              </div>
            )}
          </div>
        )}

        {/* -- Start Button -- */}
        <div className="text-center pt-2">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              onStart(selectedStyle, selectedProvider, enableVision);
            }}
            disabled={disabled}
          >
            {t('media_to_docs.start_generation_button')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
