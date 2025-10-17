import { useTranslation } from 'react-i18next';
import { Button } from '@/routes/-components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
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

export function ContentPreview({
  onReset,
  content,
  title
}: ContentPreviewProps) {
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
          <Spinner className="text-3xl" />
          <p className="mt-2 text-muted-foreground">
            {t('media_to_docs.generating_content')}
          </p>
        </div>
      );
    }

    if (content === '') {
      return (
        <p className="text-muted-foreground">
          {t('media_to_docs.content_placeholder')}
        </p>
      );
    }

    return (
      <div
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    );
  };

  return (
    <div className="space-y-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {content && (
            <Button onClick={handleCopy} variant="ghost" size="icon">
              {isCopied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">{t('media_to_docs.copy_button')}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="h-80 overflow-y-auto bg-muted/30 p-2 rounded-md border">
            {renderContent()}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button onClick={onReset} variant="outline">
          {t('media_to_docs.try_again_button')}
        </Button>
      </div>
    </div>
  );
}
