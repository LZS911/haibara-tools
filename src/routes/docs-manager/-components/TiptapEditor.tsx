import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import { trpc } from '@/router';
import { EditorToolbar } from './EditorToolbar';
import { AICommandMenu, AIFloatingButton } from './AICommandMenu';
import { markdownToHtml, editorToMarkdown } from '../-lib/utils';
import { toast } from 'sonner';
import type { AIOperation } from '@/types/docs';
import type { LLMProvider } from '@/types/llm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { Button } from '@/routes/-components/ui/button';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  defaultProvider?: LLMProvider;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder,
  editable = true,
  className = '',
  defaultProvider = 'deepseek'
}: TiptapEditorProps) {
  const { t } = useTranslation();
  const [showAIMenu, setShowAIMenu] = useState(false);
  const [showAIButton, setShowAIButton] = useState(false);
  const [aiMenuPosition, setAIMenuPosition] = useState({ top: 0, left: 0 });
  const [aiResult, setAIResult] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // 获取可用的 LLM providers
  const { data: providers } = useQuery(trpc.llm.getProviders.queryOptions());

  // 获取第一个可用的 provider
  const availableProvider =
    providers?.find((p) => p.isConfigured)?.id || defaultProvider;

  // AI 处理 mutation
  const aiProcessMutation = useMutation(trpc.docs.aiProcess.mutationOptions());

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      Image.configure({
        inline: true,
        allowBase64: true
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer'
        }
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Placeholder.configure({
        placeholder: placeholder || t('docs_manager.editor_placeholder')
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableCell,
      TableHeader
    ],
    content: markdownToHtml(content),
    editable,
    onUpdate: ({ editor }) => {
      const markdown = editorToMarkdown(editor);
      onChange(markdown);
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');

      if (text.length > 0) {
        setSelectedText(text);
        // 计算选中文本的位置
        const coords = editor.view.coordsAtPos(to);
        setAIMenuPosition({
          top: coords.bottom + 10,
          left: coords.left
        });
        setShowAIButton(true);
      } else {
        setShowAIButton(false);
        setSelectedText('');
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none min-h-[400px] focus:outline-none px-4 py-3'
      }
    }
  });

  // 处理 AI 命令
  const handleAIExecute = useCallback(
    async (operation: AIOperation, language?: string) => {
      if (!selectedText && operation !== 'continue') {
        toast.error(t('docs_manager.ai_no_content'));
        return;
      }

      const contentToProcess =
        operation === 'continue' && editor
          ? editorToMarkdown(editor)
          : selectedText;

      try {
        const result = await aiProcessMutation.mutateAsync({
          content: contentToProcess,
          operation,
          provider: availableProvider,
          language
        });

        setAIResult(result.result);
      } catch (error) {
        toast.error(t('docs_manager.ai_error'));
        console.error('AI processing error:', error);
      }
    },
    [selectedText, editor, availableProvider, aiProcessMutation, t]
  );

  // 插入 AI 结果
  const handleAIInsert = useCallback(() => {
    if (!editor || !aiResult) return;

    editor.chain().focus().insertContent(aiResult).run();
    setAIResult(null);
    setShowAIMenu(false);
  }, [editor, aiResult]);

  // 替换选中内容
  const handleAIReplace = useCallback(() => {
    if (!editor || !aiResult) return;

    editor.chain().focus().deleteSelection().insertContent(aiResult).run();
    setAIResult(null);
    setShowAIMenu(false);
  }, [editor, aiResult]);

  // 复制 AI 结果
  const handleAICopy = useCallback(() => {
    if (!aiResult) return;
    navigator.clipboard.writeText(aiResult);
    toast.success(t('docs_manager.copied_to_clipboard'));
  }, [aiResult, t]);

  // 插入链接
  const handleLinkInsert = useCallback(() => {
    if (editor) {
      const previousUrl = editor.getAttributes('link').href || '';
      setLinkUrl(previousUrl);
      setShowLinkDialog(true);
    }
  }, [editor]);

  const confirmLinkInsert = useCallback(() => {
    if (editor && linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  // 插入图片
  const handleImageUpload = useCallback(() => {
    setShowImageDialog(true);
  }, []);

  const confirmImageInsert = useCallback(() => {
    if (editor && imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
    setShowImageDialog(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  // 检测斜杠命令
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !showAIMenu) {
        // 延迟检测，确保字符已插入
        setTimeout(() => {
          const { $from } = editor.state.selection;
          const textBefore = $from.parent.textContent.slice(
            0,
            $from.parentOffset
          );

          if (textBefore.endsWith('/')) {
            // 获取光标位置
            const coords = editor.view.coordsAtPos($from.pos);
            setAIMenuPosition({
              top: coords.bottom + 10,
              left: coords.left
            });
            setShowAIMenu(true);
            // 删除斜杠
            editor
              .chain()
              .focus()
              .deleteRange({
                from: $from.pos - 1,
                to: $from.pos
              })
              .run();
          }
        }, 10);
      }

      if (event.key === 'Escape' && showAIMenu) {
        setShowAIMenu(false);
        setAIResult(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, showAIMenu]);

  return (
    <div className={`relative ${className}`} ref={editorRef}>
      {editable && (
        <EditorToolbar
          editor={editor}
          onImageUpload={handleImageUpload}
          onLinkInsert={handleLinkInsert}
        />
      )}

      <EditorContent
        editor={editor}
        className="min-h-[400px] border border-t-0 border-slate-200 rounded-b-lg bg-white"
      />

      {/* AI 浮动按钮 */}
      <AIFloatingButton
        show={showAIButton && !showAIMenu}
        position={aiMenuPosition}
        onClick={() => {
          setShowAIButton(false);
          setShowAIMenu(true);
        }}
      />

      {/* AI 命令菜单 */}
      <AICommandMenu
        isOpen={showAIMenu}
        onClose={() => {
          setShowAIMenu(false);
          setAIResult(null);
        }}
        onExecute={handleAIExecute}
        isLoading={aiProcessMutation.isPending}
        result={aiResult}
        onInsert={handleAIInsert}
        onReplace={handleAIReplace}
        onCopy={handleAICopy}
        position={aiMenuPosition}
      />

      {/* 链接对话框 */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('docs_manager.toolbar_link')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmLinkInsert}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片对话框 */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('docs_manager.toolbar_image')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url">图片 URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmImageInsert}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
