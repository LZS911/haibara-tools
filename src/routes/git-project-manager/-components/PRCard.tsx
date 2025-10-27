import { Card, CardContent } from '@/routes/-components/ui/card';
import { Badge } from '@/routes/-components/ui/badge';
import { Button } from '@/routes/-components/ui/button';
import { Checkbox } from '@/routes/-components/ui/checkbox';
import {
  ExternalLink,
  GitPullRequest,
  Calendar,
  User,
  GitBranch
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PRRecord } from '../-types';
import { cn } from '@/routes/-lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface PRCardProps {
  pr: PRRecord;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function PRCard({ pr, selectable, selected, onSelect }: PRCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

  const getStateBadgeClass = (state: PRRecord['state']) => {
    switch (state) {
      case 'open':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'merged':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'closed':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStateText = (state: PRRecord['state']) => {
    return t(`git_project_manager.pr_state_${state}`);
  };

  return (
    <Card
      className={cn(
        'border-slate-200 bg-white transition-all',
        selectable && 'cursor-pointer hover:border-blue-300',
        selected && 'border-blue-400 bg-blue-50/30'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {selectable && (
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-slate-500" />
                <h3 className="font-medium text-slate-900">{pr.title}</h3>
              </div>
              <Badge
                variant="outline"
                className={cn('shrink-0', getStateBadgeClass(pr.state))}
              >
                {getStateText(pr.state)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <span className="font-mono text-slate-500">
                  {t('git_project_manager.pr_number', { number: pr.number })}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {pr.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDistanceToNow(new Date(pr.createdAt), {
                  addSuffix: true,
                  locale
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <GitBranch className="h-3.5 w-3.5" />
                <span className="font-mono">{pr.headBranch}</span>
                <span>→</span>
                <span className="font-mono">{pr.baseBranch}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={() => window.open(pr.htmlUrl, '_blank')}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {t('git_project_manager.view_on_github')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
