import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { FolderGit2, Github, Calendar, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GitRepository } from '../-types';
import { formatDistanceToNow } from 'date-fns';
import { zhCN, enUS } from 'date-fns/locale';

interface RepoCardProps {
  repository: GitRepository;
  onClick: () => void;
  onDelete: () => void;
}

export function RepoCard({ repository, onClick, onDelete }: RepoCardProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'zh-CN' ? zhCN : enUS;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Card
      className="group cursor-pointer border-slate-200 bg-white transition-all hover:border-blue-300 hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-slate-900">
            <FolderGit2 className="h-5 w-5 text-blue-500" />
            {repository.name}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FolderGit2 className="h-4 w-4" />
          <span className="truncate">{repository.localPath}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Github className="h-4 w-4" />
          <span>
            {repository.githubOwner}/{repository.githubRepo}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {t('git_project_manager.repository_card_updated', {
              time: formatDistanceToNow(repository.updatedAt, {
                addSuffix: true,
                locale
              })
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
