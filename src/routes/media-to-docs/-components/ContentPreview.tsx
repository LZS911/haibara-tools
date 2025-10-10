import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/routes/-components/ui/card';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Spinner } from '@/routes/-components/spinner';

interface ContentPreviewProps {
  onReset: () => void;
  content: string | null;
  title: string;
}

export function ContentPreview({ onReset, content, title }: ContentPreviewProps) {
  const { t } = useTranslation();
  const [renderedContent, setRenderedContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (content) {
      const sanitizedHtml = DOMPurify.sanitize(marked.parse(content) as string);
      setRenderedContent(sanitizedHtml);
    } else {
      setRenderedContent('');
    }
  }, [content]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const renderContent = () => {
    if (content === null) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner className="text-4xl" />
          <p className="mt-4 text-muted-foreground">{t('generating_content', '内容生成中...')}</p>
        </div>
      );
    }

    if (content === '') {
      return <p className="text-muted-foreground">{t('content_placeholder', '这里是AI生成的文档内容...')}</p>;
    }

    return (
      <div
        className="prose prose-lg dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {content && (
            <Button onClick={handleCopy} variant="ghost" size="icon">
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">{t('copy_button', 'Copy')}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-96 overflow-y-auto bg-muted/30 p-4 rounded-md border">
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onReset} size="lg" variant="outline">
          {t('try_again_button', '再试一次')}
        </Button>
      </div>
    </div>
  );
}
