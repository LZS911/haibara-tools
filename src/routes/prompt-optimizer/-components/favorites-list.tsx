import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import { Card, CardContent } from '@/routes/-components/ui/card';
import { Spinner } from '@/routes/-components/spinner';
import { toast } from 'sonner';
import { EyeIcon, StarIcon, ArrowLeftIcon } from 'lucide-react';
import { OptimizationDetailDialog } from './optimization-detail-dialog';
import type {
  OptimizationRecord,
  OptimizationRequest
} from '@/types/prompt-optimizer';

interface FavoritesListProps {
  onRestore?: (request: OptimizationRequest) => void;
}

export function FavoritesList({ onRestore }: FavoritesListProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: favorites, isLoading } = useQuery(
    trpc.promptOptimizer.getFavorites.queryOptions()
  );

  const toggleFavoriteMutation = useMutation(
    trpc.promptOptimizer.toggleFavorite.mutationOptions()
  );

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleFavoriteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({
        queryKey: [['promptOptimizer', 'getHistory']]
      });
      queryClient.invalidateQueries({
        queryKey: [['promptOptimizer', 'getFavorites']]
      });
    } catch (error) {
      toast.error(
        t('prompt_optimizer.error_title') + ': ' + (error ?? String(error))
      );
    }
  };

  const handleRestore = (record: OptimizationRecord) => {
    onRestore?.(record.request);
    toast.success(t('prompt_optimizer.restore_success') || '已恢复到编辑器');
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6 mr-2" />
        <span className="text-sm text-slate-600">
          {t('prompt_optimizer.loading')}
        </span>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-slate-500">
            {t('prompt_optimizer.no_favorites')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {favorites.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        {formatTimestamp(record.timestamp)}
                      </span>
                      <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setSelectedId(record.id)}
                        title={t('prompt_optimizer.view_details')}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleToggleFavorite(record.id)}
                        title={t('prompt_optimizer.toggle_favorite')}
                      >
                        <StarIcon
                          className={`w-4 h-4 ${
                            record.isFavorite
                              ? 'text-yellow-500 fill-yellow-500'
                              : ''
                          }`}
                        />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div>
                      <span className="text-xs font-medium text-slate-400">
                        {t('prompt_optimizer.original_prompt')}:{' '}
                      </span>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {truncate(record.originalPrompt, 100)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-400">
                        {t('prompt_optimizer.optimized_prompt')}:{' '}
                      </span>
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {truncate(record.optimizedPrompt, 100)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(record)}
                    >
                      <ArrowLeftIcon className="w-3 h-3 mr-1" />
                      {t('prompt_optimizer.restore_to_editor')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedId && (
        <OptimizationDetailDialog
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onRestore={(record) => {
            setSelectedId(null);
            handleRestore(record);
          }}
        />
      )}
    </>
  );
}
