import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, queryClient } from '@/router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
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
import { Label } from '@/routes/-components/ui/label';
import {
  Plus,
  Search,
  FileText,
  RefreshCw,
  LayoutTemplate,
  Cloud
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmationDialog } from '@/routes/-components/ui/use-confirm-dialog';
import { DocCard } from './-components/DocCard';
import { TemplateCard } from './-components/TemplateCard';
import { GitHubSyncDialog } from './-components/GitHubSyncDialog';
import type { DocTemplate } from '@/types/docs';

export const Route = createFileRoute('/docs-manager/')({
  component: DocsManagerPage
});

type SortBy = 'updatedAt' | 'createdAt' | 'title';

function DocsManagerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();

  // 状态
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  // 获取文档列表
  const {
    data: docs,
    isLoading: docsLoading,
    refetch: refetchDocs
  } = useQuery(trpc.docs.list.queryOptions());

  // 获取模板列表
  const { data: templates } = useQuery(trpc.docs.listTemplates.queryOptions());

  // 获取同步配置
  const { data: syncConfig } = useQuery(trpc.docs.getSyncConfig.queryOptions());

  // 创建文档
  const createDocMutation = useMutation(trpc.docs.create.mutationOptions());

  // 删除文档
  const deleteDocMutation = useMutation(trpc.docs.delete.mutationOptions());

  // 同步文档
  const syncDocMutation = useMutation(trpc.docs.syncToGitHub.mutationOptions());

  // 过滤和排序文档
  const filteredDocs = docs
    ?.filter((doc) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'updatedAt':
          return b.updatedAt - a.updatedAt;
        case 'createdAt':
          return b.createdAt - a.createdAt;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // 创建新文档
  const handleCreateDoc = async (templateId?: string) => {
    const title = newDocTitle.trim() || t('docs_manager.editor_untitled');

    try {
      const doc = await createDocMutation.mutateAsync({
        title,
        templateId
      });

      queryClient.invalidateQueries({ queryKey: ['docs', 'list'] });
      toast.success(t('docs_manager.doc_created'));
      setShowCreateDialog(false);
      setShowTemplatesDialog(false);
      setNewDocTitle('');

      // 跳转到编辑页面
      navigate({
        to: '/docs-manager/editor/$docId',
        params: { docId: doc.meta.id }
      });
    } catch (error) {
      toast.error('创建文档失败');
      console.error('Create doc error:', error);
    }
  };

  // 使用模板创建文档
  const handleUseTemplate = (template: DocTemplate) => {
    setNewDocTitle(template.name);
    handleCreateDoc(template.id);
  };

  // 删除文档
  const handleDeleteDoc = async (id: string) => {
    const doc = docs?.find((d) => d.id === id);
    const confirmed = await confirm({
      title: t('docs_manager.delete_doc_title'),
      description: t('docs_manager.delete_doc_desc', {
        title: doc?.title || ''
      })
    });

    if (!confirmed) return;

    try {
      await deleteDocMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: ['docs', 'list'] });
      toast.success(t('docs_manager.doc_deleted'));
    } catch (error) {
      toast.error('删除文档失败');
      console.error('Delete doc error:', error);
    }
  };

  // 同步文档到 GitHub
  const handleSyncDoc = async (id: string) => {
    if (!syncConfig?.enabled) {
      setShowSyncDialog(true);
      return;
    }

    try {
      const result = await syncDocMutation.mutateAsync({ docId: id });
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['docs', 'list'] });
        toast.success(t('docs_manager.sync_success'));
      } else {
        toast.error(result.error || t('docs_manager.sync_failed'));
      }
    } catch (error) {
      toast.error(t('docs_manager.sync_failed'));
      console.error('Sync doc error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('docs_manager.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('docs_manager.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSyncDialog(true)}
          >
            <Cloud className="h-4 w-4 mr-2" />
            {syncConfig?.enabled ? (
              <span className="text-green-600">GitHub 已连接</span>
            ) : (
              'GitHub 同步'
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplatesDialog(true)}
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            {t('docs_manager.create_from_template')}
          </Button>
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('docs_manager.create_doc')}
          </Button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 w-[120px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t('docs_manager.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortBy)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">
              {t('docs_manager.sort_by_updated')}
            </SelectItem>
            <SelectItem value="createdAt">
              {t('docs_manager.sort_by_created')}
            </SelectItem>
            <SelectItem value="title">
              {t('docs_manager.sort_by_title')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetchDocs()}
          disabled={docsLoading}
        >
          <RefreshCw
            className={`h-4 w-4 ${docsLoading ? 'animate-spin' : ''}`}
          />
        </Button>
      </div>

      {/* 文档列表 */}
      {docsLoading ? (
        <Card className="border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="h-12 w-12 animate-spin" />
            <p className="mt-4">加载中...</p>
          </div>
        </Card>
      ) : !filteredDocs || filteredDocs.length === 0 ? (
        <Card className="border-slate-200 bg-white p-12">
          <div className="flex flex-col items-center justify-center text-slate-400">
            <FileText className="h-12 w-12 opacity-20" />
            <p className="mt-4 text-lg font-medium">
              {t('docs_manager.doc_list_empty')}
            </p>
            <p className="mt-2 text-sm">
              {t('docs_manager.doc_list_empty_desc')}
            </p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('docs_manager.create_doc')}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onDelete={handleDeleteDoc}
              onSync={syncConfig?.enabled ? handleSyncDoc : undefined}
              isDeleting={deleteDocMutation.isPending}
              isSyncing={syncDocMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* 创建文档对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('docs_manager.create_doc')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">文档标题</Label>
              <Input
                id="doc-title"
                placeholder={t('docs_manager.editor_untitled')}
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateDoc();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => handleCreateDoc()}
              disabled={createDocMutation.isPending}
            >
              {createDocMutation.isPending && (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              )}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 模板选择对话框 */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('docs_manager.templates_title')}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {templates && templates.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={handleUseTemplate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8">
                暂无可用模板
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* GitHub 同步配置对话框 */}
      <GitHubSyncDialog
        open={showSyncDialog}
        onOpenChange={setShowSyncDialog}
      />

      {ConfirmationDialog}
    </div>
  );
}
