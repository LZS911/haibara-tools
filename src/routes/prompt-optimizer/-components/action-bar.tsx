import { Button } from '@/routes/-components/ui/button';
import { useTranslation } from 'react-i18next';

interface ActionBarProps {
  isSubmitting: boolean;
  onSubmit: () => void;
  onClear: () => void;
}

export function ActionBar({ isSubmitting, onSubmit, onClear }: ActionBarProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Button disabled={isSubmitting} onClick={onSubmit}>
        {isSubmitting
          ? t('prompt_optimizer.submitting')
          : t('prompt_optimizer.submit')}
      </Button>
      <Button variant="outline" disabled={isSubmitting} onClick={onClear}>
        {t('prompt_optimizer.clear')}
      </Button>
    </div>
  );
}
