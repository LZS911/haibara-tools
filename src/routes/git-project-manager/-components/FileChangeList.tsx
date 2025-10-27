import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { FileIcon, FilePlus, FileMinus, FileEdit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { FileChange } from '../-types';
import { cn } from '@/routes/-lib/utils';

interface FileChangeListProps {
  changes: FileChange[];
}

export function FileChangeList({ changes }: FileChangeListProps) {
  const { t } = useTranslation();

  const getStatusIcon = (status: FileChange['status']) => {
    switch (status) {
      case 'added':
        return <FilePlus className="h-4 w-4 text-green-500" />;
      case 'modified':
        return <FileEdit className="h-4 w-4 text-blue-500" />;
      case 'deleted':
        return <FileMinus className="h-4 w-4 text-red-500" />;
      case 'renamed':
        return <FileIcon className="h-4 w-4 text-orange-500" />;
      default:
        return <FileIcon className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusText = (status: FileChange['status']) => {
    return t(`git_project_manager.file_status_${status}`);
  };

  const getStatusBadgeClass = (status: FileChange['status']) => {
    switch (status) {
      case 'added':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'modified':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'deleted':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'renamed':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (changes.length === 0) {
    return (
      <Card className="border-slate-200 bg-white">
        <CardContent className="py-12 text-center">
          <FileIcon className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-medium text-slate-900">
            {t('git_project_manager.no_changes')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('git_project_manager.no_changes_desc')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-medium text-slate-900">
          {t('git_project_manager.file_changes')} (
          {t('git_project_manager.changes_count', { count: changes.length })})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {changes.map((change, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-6 py-3 hover:bg-slate-50"
            >
              {getStatusIcon(change.status)}
              <div className="flex-1 truncate">
                <code className="text-sm text-slate-700">{change.path}</code>
                {change.oldPath && (
                  <span className="text-xs text-slate-500">
                    {' ← '}
                    {change.oldPath}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  getStatusBadgeClass(change.status)
                )}
              >
                {getStatusText(change.status)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
