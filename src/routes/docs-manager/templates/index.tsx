import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, queryClient } from '@/router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { Textarea } from '@/routes/-components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/routes/-components/ui/tabs';
import { ArrowLeft, Plus, RefreshCw, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/routes/-components/ui/use-confirm-dialog';
import { TemplateCard } from '../-components/TemplateCard';
import type { DocTemplate, TemplateCategory } from '@/types/docs';

export const Route = createFileRoute('/docs-manager/templates/')({
  component: TemplatesPage
});

function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();

  // 状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocTemplate | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'general' as TemplateCategory
  });

  // 获取模板列表
  const { data: templates, isLoading } = useQuery(
    trpc.docs.listTemplates.queryOptions()
  );

  // 创建文档
  const createDocMutation = useMutation(trpc.docs.create.mutationOptions());

  // 创建模板
  const createTemplateMutation = useMutation(
    trpc.docs.createTemplate.mutationOptions()
  );

  // 更新模板
  const updateTemplateMutation = useMutation(
    trpc.docs.updateTemplate.mutationOptions()
  );

  // 删除模板
  const deleteTemplateMutation = useMutation(
    trpc.docs.deleteTemplate.mutationOptions()
  );

  // 内置模板和自定义模板
  const builtInTemplates = templates?.filter((t) => t.isBuiltIn) || [];
  const customTemplates = templates?.filter((t) => !t.isBuiltIn) || [];

  // 使用模板创建文档
  const handleUseTemplate = async (template: DocTemplate) => {
    try {
      const doc = await createDocMutation.mutateAsync({
        title: template.name,
        templateId: template.id
      });

      queryClient.invalidateQueries({ queryKey: ['docs', 'list'] });
      toast.success(t('docs_manager.doc_created'));

      navigate({
        to: '/docs-manager/editor/$docId',
        params: { docId: doc.meta.id }
      });
    } catch (error) {
      toast.error('创建文档失败');
      console.error('Create doc error:', error);
    }
  };

  // 编辑模板
  const handleEditTemplate = (template: DocTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category
    });
    setShowCreateDialog(true);
  };

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    const template = templates?.find((t) => t.id === id);
    const confirmed = await confirm({
      title: t('docs_manager.delete_template_title'),
      description: t('docs_manager.delete_template_desc', {
        name: template?.name || ''
      })
    });

    if (!confirmed) return;

    try {
      await deleteTemplateMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ['docs', 'listTemplates'] });
      toast.success(t('docs_manager.template_deleted'));
    } catch (error) {
      toast.error('删除模板失败');
      console.error('Delete template error:', error);
    }
  };

  // 保存模板
  const handleSaveTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入模板名称');
      return;
    }

    try {
      if (editingTemplate) {
        // 更新模板
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          updates: {
            name: formData.name,
            description: formData.description,
            content: formData.content,
            category: formData.category
          }
        });
        toast.success('模板已更新');
      } else {
        // 创建模板
        await createTemplateMutation.mutateAsync({
          name: formData.name,
          description: formData.description,
          content: formData.content,
          category: formData.category
        });
        toast.success(t('docs_manager.template_created'));
      }

      queryClient.invalidateQueries({ queryKey: ['docs', 'listTemplates'] });
      setShowCreateDialog(false);
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        content: '',
        category: 'general'
      });
    } catch (error) {
      toast.error('保存模板失败');
      console.error('Save template error:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'general'
    });
    setEditingTemplate(null);
  };

  const categoryLabels: Record<TemplateCategory, string> = {
    general: t('docs_manager.category_general'),
    work: t('docs_manager.category_work'),
    study: t('docs_manager.category_study'),
    personal: t('docs_manager.category_personal')
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/docs-manager">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {t('docs_manager.templates_title')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t('docs_manager.templates_desc')}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('docs_manager.templates_create')}
        </Button>
      </div>

      {/* 模板列表 */}
      {isLoading ? (
        <Card className="border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-12 w-12 animate-spin" />
            <p className="mt-4">加载中...</p>
          </div>
        </Card>
      ) : (
        <Tabs defaultValue="builtin">
          <TabsList>
            <TabsTrigger value="builtin">
              {t('docs_manager.templates_builtin')} ({builtInTemplates.length})
            </TabsTrigger>
            <TabsTrigger value="custom">
              {t('docs_manager.templates_custom')} ({customTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builtin" className="mt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {builtInTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onUse={handleUseTemplate}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            {customTemplates.length === 0 ? (
              <Card className="border-slate-200 bg-white p-12">
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <LayoutTemplate className="h-12 w-12 opacity-20" />
                  <p className="mt-4 text-lg font-medium">
                    {t('docs_manager.templates_empty')}
                  </p>
                  <p className="mt-2 text-sm">
                    {t('docs_manager.templates_empty_desc')}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      resetForm();
                      setShowCreateDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('docs_manager.templates_create')}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {customTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={handleUseTemplate}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    isDeleting={deleteTemplateMutation.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* 创建/编辑模板对话框 */}
      <Dialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate
                ? t('docs_manager.templates_edit')
                : t('docs_manager.templates_create')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">
                  {t('docs_manager.template_name')}
                </Label>
                <Input
                  id="template-name"
                  placeholder={t('docs_manager.template_name_placeholder')}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">
                  {t('docs_manager.template_category')}
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value as TemplateCategory
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">
                {t('docs_manager.template_description')}
              </Label>
              <Input
                id="template-description"
                placeholder={t('docs_manager.template_description_placeholder')}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-content">
                {t('docs_manager.template_content')}
              </Label>
              <Textarea
                id="template-content"
                placeholder="输入模板内容（支持 Markdown 格式）..."
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-slate-500">
                提示：可以使用 {'{{date}}'}{' '}
                作为日期占位符，创建文档时会自动替换为当前日期
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={
                createTemplateMutation.isPending ||
                updateTemplateMutation.isPending
              }
            >
              {(createTemplateMutation.isPending ||
                updateTemplateMutation.isPending) && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('docs_manager.template_save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {ConfirmationDialog}
    </div>
  );
}
