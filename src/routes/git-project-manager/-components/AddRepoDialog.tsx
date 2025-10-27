import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/routes/-components/spinner';

interface AddRepoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (repo: {
    name: string;
    localPath: string;
    githubOwner: string;
    githubRepo: string;
    defaultBranch: string;
  }) => Promise<void>;
}

export function AddRepoDialog({
  open,
  onOpenChange,
  onAdd
}: AddRepoDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [githubOwner, setGithubOwner] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [loading, setLoading] = useState(false);

  const handleSelectFolder = async () => {
    if (!window.electronAPI) return;
    const path = await window.electronAPI.selectFolder();
    if (path) {
      setLocalPath(path);
      // 尝试从路径提取仓库名称
      const parts = path.split(/[/\\]/);
      const folderName = parts[parts.length - 1];
      if (!name) {
        setName(folderName);
      }
    }
  };

  const handleAdd = async () => {
    if (!name || !localPath || !githubOwner || !githubRepo || !defaultBranch) {
      return;
    }

    setLoading(true);
    try {
      await onAdd({
        name,
        localPath,
        githubOwner,
        githubRepo,
        defaultBranch
      });
      // 重置表单
      setName('');
      setLocalPath('');
      setGithubOwner('');
      setGithubRepo('');
      setDefaultBranch('main');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add repository:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t('git_project_manager.add_repo_dialog_title')}
          </DialogTitle>
          <DialogDescription>
            {t('git_project_manager.add_repo_dialog_desc')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('git_project_manager.repo_name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('git_project_manager.repo_name_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="localPath">
              {t('git_project_manager.local_path')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="localPath"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/path/to/repository"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSelectFolder}
              >
                <FolderOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubOwner">
              {t('git_project_manager.github_owner')}
            </Label>
            <Input
              id="githubOwner"
              value={githubOwner}
              onChange={(e) => setGithubOwner(e.target.value)}
              placeholder={t('git_project_manager.github_owner_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubRepo">
              {t('git_project_manager.github_repo')}
            </Label>
            <Input
              id="githubRepo"
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder={t('git_project_manager.github_repo_placeholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultBranch">
              {t('git_project_manager.default_branch')}
            </Label>
            <Input
              id="defaultBranch"
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
              placeholder={t('git_project_manager.default_branch_placeholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t('git_project_manager.cancel')}
          </Button>
          <Button
            onClick={handleAdd}
            disabled={
              !name ||
              !localPath ||
              !githubOwner ||
              !githubRepo ||
              !defaultBranch ||
              loading
            }
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('git_project_manager.verifying_repo')}
              </>
            ) : (
              t('git_project_manager.add_repository')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
