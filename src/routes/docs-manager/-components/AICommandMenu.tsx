import { useState, useCallback } from 'react';
import { Button } from '@/routes/-components/ui/button';
import { Card } from '@/routes/-components/ui/card';
import {
  Sparkles,
  PenLine,
  FileText,
  RefreshCw,
  Expand,
  Minimize,
  Languages,
  Search,
  X,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AIOperation } from '@/types/docs';

interface AICommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (operation: AIOperation, language?: string) => void;
  isLoading: boolean;
  result: string | null;
  onInsert: () => void;
  onReplace: () => void;
  onCopy: () => void;
  position?: { top: number; left: number };
}

interface AICommandItem {
  operation: AIOperation;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  descKey: string;
}

const AI_COMMANDS: AICommandItem[] = [
  {
    operation: 'polish',
    icon: Sparkles,
    labelKey: 'docs_manager.ai_polish',
    descKey: 'docs_manager.ai_polish_desc'
  },
  {
    operation: 'continue',
    icon: PenLine,
    labelKey: 'docs_manager.ai_continue',
    descKey: 'docs_manager.ai_continue_desc'
  },
  {
    operation: 'summarize',
    icon: FileText,
    labelKey: 'docs_manager.ai_summarize',
    descKey: 'docs_manager.ai_summarize_desc'
  },
  {
    operation: 'rewrite',
    icon: RefreshCw,
    labelKey: 'docs_manager.ai_rewrite',
    descKey: 'docs_manager.ai_rewrite_desc'
  },
  {
    operation: 'expand',
    icon: Expand,
    labelKey: 'docs_manager.ai_expand',
    descKey: 'docs_manager.ai_expand_desc'
  },
  {
    operation: 'simplify',
    icon: Minimize,
    labelKey: 'docs_manager.ai_simplify',
    descKey: 'docs_manager.ai_simplify_desc'
  },
  {
    operation: 'translate',
    icon: Languages,
    labelKey: 'docs_manager.ai_translate',
    descKey: 'docs_manager.ai_translate_desc'
  }
];

const LANGUAGES = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' }
];

export function AICommandMenu({
  isOpen,
  onClose,
  onExecute,
  isLoading,
  result,
  onInsert,
  onReplace,
  onCopy,
  position
}: AICommandMenuProps) {
  const { t } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  const handleCommandClick = (operation: AIOperation) => {
    if (operation === 'translate') {
      setShowLanguages(true);
    } else {
      onExecute(operation);
    }
  };

  const handleLanguageSelect = (langCode: string) => {
    setShowLanguages(false);
    onExecute('translate', langCode);
  };

  if (!isOpen) return null;

  const menuStyle = position ? { top: position.top, left: position.left } : {};

  return (
    <Card
      className="fixed z-50 w-80 shadow-lg border-slate-200 bg-white overflow-hidden"
      style={menuStyle}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700">
            {t('docs_manager.ai_menu_title')}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 内容区域 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-slate-500">
              {t('docs_manager.ai_processing')}
            </p>
          </div>
        ) : result ? (
          <div className="p-3">
            <div className="rounded-lg bg-slate-50 p-3 mb-3">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {result}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={onInsert}
              >
                {t('docs_manager.ai_insert')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={onReplace}
              >
                {t('docs_manager.ai_replace')}
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : showLanguages ? (
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => setShowLanguages(false)}
            >
              ← 返回
            </Button>
            <div className="space-y-1">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-slate-100 transition-colors"
                  onClick={() => handleLanguageSelect(lang.name)}
                >
                  <span className="text-sm text-slate-700">{lang.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {AI_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.operation}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-slate-100 transition-colors"
                  onClick={() => handleCommandClick(cmd.operation)}
                >
                  <Icon className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {t(cmd.labelKey)}
                    </p>
                    <p className="text-xs text-slate-400">{t(cmd.descKey)}</p>
                  </div>
                </button>
              );
            })}

            {/* 知识库搜索 */}
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-slate-100 transition-colors"
                onClick={onClose}
              >
                <Search className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {t('docs_manager.ai_search_knowledge')}
                  </p>
                  <p className="text-xs text-slate-400">
                    {t('docs_manager.ai_search_knowledge_desc')}
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// AI 浮动按钮组件（在选中文本时显示）
interface AIFloatingButtonProps {
  show: boolean;
  position: { top: number; left: number };
  onClick: () => void;
}

export function AIFloatingButton({
  show,
  position,
  onClick
}: AIFloatingButtonProps) {
  if (!show) return null;

  return (
    <Button
      variant="default"
      size="sm"
      className="fixed z-50 shadow-lg"
      style={{ top: position.top, left: position.left }}
      onClick={onClick}
    >
      <Sparkles className="h-4 w-4 mr-1" />
      AI
    </Button>
  );
}
