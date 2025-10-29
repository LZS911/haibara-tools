import { Label } from '@/routes/-components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import { useTranslation } from 'react-i18next';
import type { LLMProvider } from '@/types/llm';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '../../../router';

interface ProviderSelectorProps {
  value: LLMProvider;
  onChange: (value: LLMProvider) => void;
  disabled?: boolean;
}

export function ProviderSelector({
  value,
  onChange,
  disabled
}: ProviderSelectorProps) {
  const { t } = useTranslation();
  const providerOptions = useQuery(trpc.llm.getProviders.queryOptions());
  return (
    <div className="space-y-2">
      <Label className="text-sm text-slate-700">
        {t('prompt_optimizer.provider_label')}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as LLMProvider)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={t('prompt_optimizer.provider_placeholder')}
          />
        </SelectTrigger>
        <SelectContent>
          {providerOptions?.data
            ?.filter((p) => p.isConfigured)
            ?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
}
