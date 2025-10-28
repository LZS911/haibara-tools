import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { RefreshCw, GitPullRequest } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PRCard } from './PRCard';
import type { PRRecord } from '../-types';
import { ScrollArea } from '../../-components/ui/scroll-area';

interface PRListProps {
  prs: PRRecord[];
  loading?: boolean;
  onRefresh: () => void;
  selectable?: boolean;
  selectedPRIds?: number[];
  onSelectionChange?: (prIds: number[]) => void;
}

export function PRList({
  prs,
  loading,
  onRefresh,
  selectable,
  selectedPRIds = [],
  onSelectionChange
}: PRListProps) {
  const { t } = useTranslation();

  const handlePRSelect = (prId: number, selected: boolean) => {
    if (!onSelectionChange) return;
    if (selected) {
      onSelectionChange([...selectedPRIds, prId]);
    } else {
      onSelectionChange(selectedPRIds.filter((id) => id !== prId));
    }
  };

  if (prs.length === 0 && !loading) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-12 text-center">
          <GitPullRequest className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-medium text-slate-900">
            {t('git_project_manager.no_pr_records')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('git_project_manager.no_pr_records_desc')}
          </p>
          <Button onClick={onRefresh} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('git_project_manager.sync_pr_records')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-slate-900">
            {t('git_project_manager.pr_records')} ({prs.length})
          </CardTitle>
          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <>{t('git_project_manager.syncing_pr_records')}</>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('git_project_manager.sync_pr_records')}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <ScrollArea className="h-[60vh]">
        <CardContent className="space-y-3">
          {prs.map((pr) => (
            <PRCard
              key={`${pr.repositoryId}-${pr.id}`}
              pr={pr}
              selectable={selectable}
              selected={selectedPRIds.includes(pr.id)}
              onSelect={(selected) => handlePRSelect(pr.id, selected)}
            />
          ))}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
