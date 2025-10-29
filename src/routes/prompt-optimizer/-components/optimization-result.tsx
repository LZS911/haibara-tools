import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import type { OptimizationResponse } from '@/types/prompt-optimizer';

interface OptimizationResultProps {
  value: OptimizationResponse;
  onCopyOptimized: () => void;
  onCopyExplanation: () => void;
  onCopyAll: () => void;
}

export function OptimizationResult({
  value,
  onCopyOptimized,
  onCopyExplanation,
  onCopyAll
}: OptimizationResultProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-900">
            {t('prompt_optimizer.optimized_prompt')}
          </h3>
          <Button size="sm" variant="outline" onClick={onCopyOptimized}>
            {t('prompt_optimizer.copy')}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">
          {value.optimizedPrompt}
        </pre>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-900">
            {t('prompt_optimizer.optimization_explanation')}
          </h3>
          <Button size="sm" variant="outline" onClick={onCopyExplanation}>
            {t('prompt_optimizer.copy')}
          </Button>
        </div>
        <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">
          {value.optimizationExplanation}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-1">
            {t('prompt_optimizer.improvements')}
          </h4>
          <ul className="list-disc list-inside text-sm text-slate-700">
            {value.improvements.map((it, idx) => (
              <li key={idx}>{it}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-1">
            {t('prompt_optimizer.techniques')}
          </h4>
          <ul className="list-disc list-inside text-sm text-slate-700">
            {value.techniques.map((it, idx) => (
              <li key={idx}>{it}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        {t('prompt_optimizer.metadata')}: {value.metadata.provider} ·{' '}
        {value.metadata.timestamp} ·{` `}
        {t('prompt_optimizer.tokens')}: {value.metadata.tokenUsage}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onCopyAll}>
          {t('prompt_optimizer.copy_all')}
        </Button>
      </div>
    </div>
  );
}
