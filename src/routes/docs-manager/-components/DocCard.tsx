import { Link } from '@tanstack/react-router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Badge } from '@/routes/-components/ui/badge';
import {
  FileText,
  Clock,
  Trash2,
  Edit,
  Cloud,
  CloudOff,
  MoreVertical
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatRelativeTime, extractSummary } from '../-lib/utils';
import type { DocListItem } from '@/types/docs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/routes/-components/ui/popover';

interface DocCardProps {
  doc: DocListItem;
  onDelete: (id: string) => void;
  onSync?: (id: string) => void;
  isDeleting?: boolean;
  isSyncing?: boolean;
  content?: string;
}

export function DocCard({
  doc,
  onDelete,
  onSync,
  isDeleting,
  isSyncing,
  content
}: DocCardProps) {
  const { t } = useTranslation();

  const summary = content ? extractSummary(content) : doc.description || '';

  return (
    <Card className="group border-slate-200 bg-white transition-all hover:shadow-md hover:border-slate-300">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <Link
            to="/docs-manager/editor/$docId"
            params={{ docId: doc.id }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <h3 className="font-medium text-slate-900 truncate">
                {doc.title || t('docs_manager.editor_untitled')}
              </h3>
            </div>

            {summary && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                {summary}
              </p>
            )}
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 p-1">
              <Link to="/docs-manager/editor/$docId" params={{ docId: doc.id }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('docs_manager.doc_card_edit')}
                </Button>
              </Link>
              {onSync && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onSync(doc.id)}
                  disabled={isSyncing}
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  {t('docs_manager.doc_card_sync')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(doc.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('docs_manager.doc_card_delete')}
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* 标签 */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs px-2 py-0"
              >
                {tag}
              </Badge>
            ))}
            {doc.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0">
                +{doc.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {t('docs_manager.doc_card_updated')}{' '}
              {formatRelativeTime(doc.updatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {doc.syncedAt ? (
              <>
                <Cloud className="h-3 w-3 text-green-500" />
                <span className="text-green-600">
                  {t('docs_manager.doc_card_synced')}
                </span>
              </>
            ) : (
              <>
                <CloudOff className="h-3 w-3" />
                <span>{t('docs_manager.doc_card_not_synced')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
