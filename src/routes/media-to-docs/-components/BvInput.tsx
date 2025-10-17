import { Input } from '@/routes/-components/ui/input';
import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';

interface BvInputProps {
  value: string;
  onChange: (value: string) => void;
  onStart: () => void;
  disabled?: boolean;
}

export function BvInput({ value, onChange, onStart, disabled }: BvInputProps) {
  const { t } = useTranslation();

  return (
    <div className="flex w-full max-w-lg mx-auto items-center space-x-2">
      <Input
        type="text"
        placeholder={t('media_to_docs.bv_input_placeholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-base"
        disabled={disabled}
      />
      <Button onClick={onStart} disabled={disabled || !value}>
        {t('media_to_docs.start_conversion')}
      </Button>
    </div>
  );
}
