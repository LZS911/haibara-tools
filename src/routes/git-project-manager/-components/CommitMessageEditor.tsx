import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Textarea } from '@/routes/-components/ui/textarea';
import { Label } from '@/routes/-components/ui/label';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CommitMessageEditorProps {
  changeDescription: string;
  onChangeDescriptionChange: (value: string) => void;
  commitMessage: string;
  onCommitMessageChange: (value: string) => void;
  onGenerateCommitMessage: () => void;
  isGenerating: boolean;
}

export function CommitMessageEditor({
  changeDescription,
  onChangeDescriptionChange,
  commitMessage,
  onCommitMessageChange,
  onGenerateCommitMessage,
  isGenerating
}: CommitMessageEditorProps) {
  const { t } = useTranslation();

  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base font-medium text-slate-900">
          {t('git_project_manager.change_description')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="changeDescription">
            {t('git_project_manager.change_description')}
          </Label>
          <Textarea
            id="changeDescription"
            value={changeDescription}
            onChange={(e) => onChangeDescriptionChange(e.target.value)}
            placeholder={t(
              'git_project_manager.change_description_placeholder'
            )}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          onClick={onGenerateCommitMessage}
          disabled={!changeDescription.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>{t('git_project_manager.generating_commit_message')}</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('git_project_manager.generate_commit_message')}
            </>
          )}
        </Button>

        {commitMessage && (
          <div className="space-y-2">
            <Label htmlFor="commitMessage">
              {t('git_project_manager.commit_message')}
            </Label>
            <Textarea
              id="commitMessage"
              value={commitMessage}
              onChange={(e) => onCommitMessageChange(e.target.value)}
              rows={3}
              className="resize-none font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              {t('git_project_manager.edit_commit_message')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
