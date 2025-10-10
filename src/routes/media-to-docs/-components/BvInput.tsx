
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
    <div className="flex w-full max-w-lg mx-auto items-center space-x-4">
      <Input
        type="text"
        placeholder={t('bv_input_placeholder', '例如：BV1xx411c7mD')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-lg p-4"
        disabled={disabled}
      />
      <Button
        onClick={onStart}
        size="lg"
        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        disabled={disabled || !value}
      >
        {t('start_conversion', '开始转换')}
      </Button>
    </div>
  );
}
