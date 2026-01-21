import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, queryClient } from '@/router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Badge } from '@/routes/-components/ui/badge';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Cloud,
  CloudOff,
  Tag,
  X,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { TiptapEditor } from './-components/TiptapEditor';
import { formatRelativeTime } from './-lib/utils';
import { useDebounce } from '@/routes/-lib/hooks';

export const Route = createFileRoute('/docs-manager/editor/$docId')({
  component: EditorPage
});

function EditorPage() {
  const { t } = useTranslation();
  const { docId } = Route.useParams();

  // 状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [showTagInput, setShowTagInput] = useState(false);

  // Refs for auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadRef = useRef(true);

  // 获取文档
  const { data: doc, isLoading } = useQuery(
    trpc.docs.get.queryOptions({ id: docId })
  );

  // 获取同步配置
  const { data: syncConfig } = useQuery(trpc.docs.getSyncConfig.queryOptions());

  // 获取 LLM providers
  const { data: providers } = useQuery(trpc.llm.getProviders.queryOptions());

  // 更新文档
  const updateDocMutation = useMutation(trpc.docs.update.mutationOptions());

  // 同步到 GitHub
  const syncMutation = useMutation(trpc.docs.syncToGitHub.mutationOptions());

  // AI 生成标签
  const generateTagsMutation = useMutation(
    trpc.docs.aiGenerateTags.mutationOptions()
  );

  // 初始化数据
  useEffect(() => {
    if (doc && initialLoadRef.current) {
      setTitle(doc.meta.title);
      setContent(doc.content);
      setTags(doc.meta.tags || []);
      setLastSavedAt(doc.meta.updatedAt);
      initialLoadRef.current = false;
    }
  }, [doc]);

  // 防抖保存
  const debouncedContent = useDebounce(content, 2000);

  // 保存文档
  const handleSave = useCallback(
    async (isAutoSave = false) => {
      if (!doc) return;

      try {
        await updateDocMutation.mutateAsync({
          id: docId,
          title: title || t('docs_manager.editor_untitled'),
          content,
          tags
        });

        setHasUnsavedChanges(false);
        setLastSavedAt(Date.now());
        queryClient.invalidateQueries({ queryKey: ['docs', 'list'] });

        if (!isAutoSave) {
          toast.success(t('docs_manager.editor_saved'));
        }

        // 如果启用了自动同步，则同步到 GitHub
        if (syncConfig?.autoSync && syncConfig.enabled) {
          await syncMutation.mutateAsync({ docId });
        }
      } catch (error) {
        toast.error(t('docs_manager.editor_save_failed'));
        console.error('Save error:', error);
      }
    },
    [
      doc,
      docId,
      title,
      content,
      tags,
      syncConfig,
      updateDocMutation,
      syncMutation,
      t
    ]
  );

  // 自动保存
  useEffect(() => {
    if (initialLoadRef.current || !hasUnsavedChanges) return;

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // 设置新的定时器
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(true);
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [debouncedContent, title, tags, handleSave, hasUnsavedChanges]);

  // 标记为有未保存更改
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    if (!initialLoadRef.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!initialLoadRef.current) {
      setHasUnsavedChanges(true);
    }
  }, []);

  // 手动同步
  const handleSync = useCallback(async () => {
    if (!syncConfig?.enabled) {
      toast.error(t('docs_manager.sync_no_token'));
      return;
    }

    try {
      // 先保存
      await handleSave();

      const result = await syncMutation.mutateAsync({ docId });
      if (result.success) {
        toast.success(t('docs_manager.sync_success'));
        queryClient.invalidateQueries({ queryKey: ['docs', 'get', docId] });
      } else {
        toast.error(result.error || t('docs_manager.sync_failed'));
      }
    } catch (error) {
      toast.error(t('docs_manager.sync_failed'));
      console.error('Sync error:', error);
    }
  }, [docId, syncConfig, handleSave, syncMutation, t]);

  // 添加标签
  const handleAddTag = useCallback(() => {
    const tag = newTag.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setHasUnsavedChanges(true);
    }
    setNewTag('');
    setShowTagInput(false);
  }, [newTag, tags]);

  // 删除标签
  const handleRemoveTag = useCallback(
    (tagToRemove: string) => {
      setTags(tags.filter((t) => t !== tagToRemove));
      setHasUnsavedChanges(true);
    },
    [tags]
  );

  // AI 生成标签
  const handleGenerateTags = useCallback(async () => {
    if (!content) {
      toast.error('请先输入文档内容');
      return;
    }

    const provider = providers?.find((p) => p.isConfigured)?.id || 'deepseek';

    try {
      const newTags = await generateTagsMutation.mutateAsync({
        content,
        provider
      });

      // 合并标签，去重
      const mergedTags = [...new Set([...tags, ...newTags])];
      setTags(mergedTags);
      setHasUnsavedChanges(true);
      toast.success('已生成标签');
    } catch (error) {
      toast.error('生成标签失败');
      console.error('Generate tags error:', error);
    }
  }, [content, tags, providers, generateTagsMutation]);

  // 快捷键保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // 离开提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!doc) {
    return (
      <Card className="border-slate-200 bg-white p-12">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <p className="text-lg font-medium">文档不存在</p>
          <Link to="/docs-manager">
            <Button variant="outline" className="mt-4">
              返回文档列表
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/docs-manager">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('docs_manager.editor_back')}
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            {hasUnsavedChanges ? (
              <span className="text-amber-600">未保存的更改</span>
            ) : lastSavedAt ? (
              <span className="text-green-600">
                {t('docs_manager.editor_saved')} ·{' '}
                {formatRelativeTime(lastSavedAt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {syncConfig?.enabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : doc.meta.syncedAt ? (
                <Cloud className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 mr-2" />
              )}
              {t('docs_manager.sync_now')}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={updateDocMutation.isPending || !hasUnsavedChanges}
          >
            {updateDocMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('docs_manager.editor_save')}
          </Button>
        </div>
      </div>

      {/* 标题输入 */}
      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={t('docs_manager.editor_untitled')}
          className="text-2xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
        />

        {/* 标签 */}
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          {showTagInput ? (
            <div className="flex items-center gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入标签"
                className="h-7 w-24 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                  } else if (e.key === 'Escape') {
                    setShowTagInput(false);
                    setNewTag('');
                  }
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleAddTag}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  setShowTagInput(false);
                  setNewTag('');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowTagInput(true)}
              >
                <Tag className="h-3 w-3 mr-1" />
                添加标签
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleGenerateTags}
                disabled={generateTagsMutation.isPending}
              >
                {generateTagsMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                AI 生成
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 编辑器 */}
      <TiptapEditor
        content={content}
        onChange={handleContentChange}
        className="min-h-[calc(100vh-250px)]"
      />
    </div>
  );
}
