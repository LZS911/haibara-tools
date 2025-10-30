import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/router';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
import { Button } from '@/routes/-components/ui/button';
import { Spinner } from '@/routes/-components/spinner';
import { toast } from 'sonner';
import { StarIcon, ArrowLeftIcon } from 'lucide-react';
import type { OptimizationRecord } from '@/types/prompt-optimizer';

interface OptimizationDetailDialogProps {
  id: string;
  onClose: () => void;
  onRestore: (record: OptimizationRecord) => void;
}

export function OptimizationDetailDialog({
  id,
  onClose,
  onRestore
}: OptimizationDetailDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery(
    trpc.promptOptimizer.getHistoryItem.queryOptions({ id })
  );

  const toggleFavoriteMutation = useMutation(
    trpc.promptOptimizer.toggleFavorite.mutationOptions()
  );

  const handleToggleFavorite = async () => {
    if (!record) return;
    try {
      await toggleFavoriteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: [['promptOptimizer', 'getHistoryItem'], { input: { id } }]
      });
      queryClient.invalidateQueries({
        queryKey: [['promptOptimizer', 'getHistory']]
      });
      queryClient.invalidateQueries({
        queryKey: [['promptOptimizer', 'getFavorites']]
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('prompt_optimizer.error_title') + ': ' + message);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Spinner className="w-6 h-6 mr-2" />
            <span className="text-sm text-slate-600">
              {t('prompt_optimizer.loading')}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!record) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('prompt_optimizer.error_title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            {t('prompt_optimizer.record_not_found') || '记录未找到'}
          </p>
          <DialogFooter>
            <Button onClick={onClose}>{t('prompt_optimizer.close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {t('prompt_optimizer.optimization_details')}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {formatTimestamp(record.timestamp)}
              </span>
              {record.isFavorite && (
                <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Prompt */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              {t('prompt_optimizer.original_prompt')}
            </h3>
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">
              {record.originalPrompt}
            </pre>
          </div>

          {/* Optimized Prompt */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              {t('prompt_optimizer.optimized_prompt')}
            </h3>
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">
              {record.optimizedPrompt}
            </pre>
          </div>

          {/* Explanation */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              {t('prompt_optimizer.optimization_explanation')}
            </h3>
            <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded border border-slate-200">
              {record.response.optimizationExplanation}
            </pre>
          </div>

          {/* Improvements and Techniques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">
                {t('prompt_optimizer.improvements')}
              </h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {record.response.improvements.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">
                {t('prompt_optimizer.techniques')}
              </h4>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {record.response.techniques.map((it, idx) => (
                  <li key={idx}>{it}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Request Parameters */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">
              {t('prompt_optimizer.request_parameters') || '请求参数'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.prompt_type')}:
                </span>{' '}
                <span className="font-medium">{record.request.promptType}</span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.optimization_level')}:
                </span>{' '}
                <span className="font-medium">
                  {record.request.optimizationLevel}
                </span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.language_style')}:
                </span>{' '}
                <span className="font-medium">
                  {record.request.languageStyle}
                </span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.output_format')}:
                </span>{' '}
                <span className="font-medium">
                  {record.request.outputFormat}
                </span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.provider')}:
                </span>{' '}
                <span className="font-medium">{record.request.provider}</span>
              </div>
              <div>
                <span className="text-slate-500">
                  {t('prompt_optimizer.language')}:
                </span>{' '}
                <span className="font-medium">{record.request.language}</span>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-slate-500 pt-2 border-t">
            {t('prompt_optimizer.metadata')}:{' '}
            {record.response.metadata.provider} ·{' '}
            {record.response.metadata.timestamp} ·{' '}
            {t('prompt_optimizer.tokens')}:{' '}
            {record.response.metadata.tokenUsage}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              handleToggleFavorite();
            }}
          >
            <StarIcon
              className={`w-4 h-4 mr-1 ${
                record.isFavorite ? 'text-yellow-500 fill-yellow-500' : ''
              }`}
            />
            {record.isFavorite
              ? t('prompt_optimizer.unfavorite')
              : t('prompt_optimizer.favorite')}
          </Button>
          <Button variant="outline" onClick={() => onRestore(record)}>
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            {t('prompt_optimizer.restore_to_editor')}
          </Button>
          <Button onClick={onClose}>{t('prompt_optimizer.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
