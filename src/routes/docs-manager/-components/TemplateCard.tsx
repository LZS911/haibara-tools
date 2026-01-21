import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Badge } from '@/routes/-components/ui/badge';
import { FileText, Trash2, Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DocTemplate } from '@/types/docs';

interface TemplateCardProps {
  template: DocTemplate;
  onUse: (template: DocTemplate) => void;
  onEdit?: (template: DocTemplate) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete,
  isDeleting
}: TemplateCardProps) {
  const { t } = useTranslation();

  const categoryLabels: Record<string, string> = {
    general: t('docs_manager.category_general'),
    work: t('docs_manager.category_work'),
    study: t('docs_manager.category_study'),
    personal: t('docs_manager.category_personal')
  };

  return (
    <Card className="group border-slate-200 bg-white transition-all hover:shadow-md hover:border-slate-300">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">{template.name}</h3>
              <Badge variant="secondary" className="text-xs mt-1">
                {categoryLabels[template.category]}
              </Badge>
            </div>
          </div>

          {template.isBuiltIn && (
            <Badge variant="outline" className="text-xs">
              内置
            </Badge>
          )}
        </div>

        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onUse(template)}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('docs_manager.templates_use')}
          </Button>

          {!template.isBuiltIn && (
            <>
              {onEdit && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(template)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(template.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
