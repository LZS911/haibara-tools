import { Label } from '@/routes/-components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/routes/-components/ui/popover';
import { useTranslation } from 'react-i18next';
import type {
  PromptType,
  OptimizationLevel,
  LanguageStyle,
  OutputFormat,
  TemplateLanguage
} from '@/types/prompt-optimizer';
import { InfoIcon } from '@/routes/-components/svg/info-icon';
import { Skeleton } from '@/routes/-components/ui/skeleton';
import { trpc } from '../../../router';
import { useQuery } from '@tanstack/react-query';

interface OptionsValue {
  promptType: PromptType;
  optimizationLevel: OptimizationLevel;
  languageStyle: LanguageStyle;
  outputFormat: OutputFormat;
  language: TemplateLanguage;
}

interface OptimizationOptionsProps {
  value: OptionsValue;
  onChange: (value: OptionsValue) => void;
  disabled?: boolean;
}

function OptionLabel({
  label,
  description
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Label className="text-sm">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className="text-muted-foreground">
            <InfoIcon className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 text-sm">{description}</PopoverContent>
      </Popover>
    </div>
  );
}

export function OptimizationOptions({
  value,
  onChange,
  disabled
}: OptimizationOptionsProps) {
  const { t } = useTranslation();
  const { data: options, isLoading } = useQuery(
    trpc.promptOptimizer.getOptimizationOptions.queryOptions()
  );

  if (isLoading || !options) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1">
        <OptionLabel
          label={t('prompt_optimizer.prompt_type')}
          description={t('prompt_optimizer.tooltips.prompt_type')}
        />
        <Select
          value={value.promptType}
          onValueChange={(v) =>
            onChange({ ...value, promptType: v as PromptType })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.promptTypes.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.nameKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <OptionLabel
          label={t('prompt_optimizer.optimization_level')}
          description={t('prompt_optimizer.tooltips.optimization_level')}
        />
        <Select
          value={value.optimizationLevel}
          onValueChange={(v) =>
            onChange({ ...value, optimizationLevel: v as OptimizationLevel })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.optimizationLevels.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.nameKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <OptionLabel
          label={t('prompt_optimizer.language_style')}
          description={t('prompt_optimizer.tooltips.language_style')}
        />
        <Select
          value={value.languageStyle}
          onValueChange={(v) =>
            onChange({ ...value, languageStyle: v as LanguageStyle })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.languageStyles.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.nameKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <OptionLabel
          label={t('prompt_optimizer.output_format')}
          description={t('prompt_optimizer.tooltips.output_format')}
        />
        <Select
          value={value.outputFormat}
          onValueChange={(v) =>
            onChange({ ...value, outputFormat: v as OutputFormat })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.outputFormats.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {t(p.nameKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 md:col-span-2">
        <Label className="text-sm">{t('prompt_optimizer.language')}</Label>
        <Select
          value={value.language}
          onValueChange={(v) =>
            onChange({ ...value, language: v as TemplateLanguage })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.languages.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
