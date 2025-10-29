import { Textarea } from '@/routes/-components/ui/textarea';
import { Label } from '@/routes/-components/ui/label';
import { useTranslation } from 'react-i18next';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  const { t } = useTranslation();
  const length = value.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-slate-700">
          {t('prompt_optimizer.original_prompt_label')}
        </Label>
        <span className="text-xs text-slate-500">
          {t('prompt_optimizer.char_count', { count: length })}
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('prompt_optimizer.input_placeholder')}
        disabled={disabled}
        rows={10}
      />
      <div className="text-xs text-slate-400">
        {t('prompt_optimizer.length_hint')}
      </div>
    </div>
  );
}
