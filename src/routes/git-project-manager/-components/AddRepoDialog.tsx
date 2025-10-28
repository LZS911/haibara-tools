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
import { executeGitCommand } from '../-lib/git-commands';

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

interface ParsedRemoteInfo {
  host: string;
  owner: string;
  repo: string;
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
  const [detecting, setDetecting] = useState(false);
  const [detectMessage, setDetectMessage] = useState<string | null>(null);

  const parseGitRemoteUrl = (url: string): ParsedRemoteInfo | null => {
    // https://github.com/owner/repo(.git)
    const httpsMatch = url.match(
      /^https?:\/\/([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/
    );
    if (httpsMatch) {
      return { host: httpsMatch[1], owner: httpsMatch[2], repo: httpsMatch[3] };
    }

    // ssh://git@github.com/owner/repo(.git)
    const sshProtoMatch = url.match(
      /^ssh:\/\/git@([^/]+)\/([^/]+)\/([^/]+?)(?:\.git)?$/
    );
    if (sshProtoMatch) {
      return {
        host: sshProtoMatch[1],
        owner: sshProtoMatch[2],
        repo: sshProtoMatch[3]
      };
    }

    // git@github.com:owner/repo(.git)
    const scpLikeMatch = url.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (scpLikeMatch) {
      return {
        host: scpLikeMatch[1],
        owner: scpLikeMatch[2],
        repo: scpLikeMatch[3]
      };
    }

    return null;
  };

  const detectFromLocalGit = async (path: string) => {
    setDetecting(true);
    setDetectMessage(null);
    try {
      // 读取 origin 远程 URL
      const remoteUrlResult = await executeGitCommand(
        'git config --get remote.origin.url',
        path
      );
      if (!remoteUrlResult.success || !remoteUrlResult.output?.trim()) {
        setDetectMessage(t('git_project_manager.remote_not_found'));
        return;
      }
      const remoteUrl = remoteUrlResult.output.trim();
      const parsed = parseGitRemoteUrl(remoteUrl);
      if (!parsed) {
        setDetectMessage(t('git_project_manager.unsupported_remote_host'));
      } else {
        if (parsed.host === 'github.com') {
          setGithubOwner(parsed.owner);
          setGithubRepo(parsed.repo);
        } else {
          // 非 GitHub 主机，给出提示但仍允许手动填写
          setDetectMessage(
            t('git_project_manager.only_github_fully_supported')
          );
        }
      }

      // 获取默认分支：symbolic-ref
      const headRefResult = await executeGitCommand(
        'git symbolic-ref --short refs/remotes/origin/HEAD',
        path
      );
      if (headRefResult.success && headRefResult.output?.trim()) {
        const ref = headRefResult.output.trim(); // e.g. origin/main
        const parts = ref.split('/');
        const branch = parts[parts.length - 1];
        if (branch) {
          setDefaultBranch(branch);
          return;
        }
      }

      // 备选：remote show origin
      const remoteShowResult = await executeGitCommand(
        'git remote show origin',
        path
      );
      if (remoteShowResult.success && remoteShowResult.output) {
        const match = remoteShowResult.output.match(/HEAD branch:\s*(\S+)/);
        if (match && match[1]) {
          setDefaultBranch(match[1]);
          return;
        }
      }

      // 回退
      setDetectMessage(
        t('git_project_manager.default_branch_detect_failed', {
          fallback: 'main'
        })
      );
      if (!defaultBranch) setDefaultBranch('main');
    } catch (_err) {
      setDetectMessage(t('git_project_manager.add_repo_failed'));
    } finally {
      setDetecting(false);
    }
  };

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
      detectFromLocalGit(path);
    }
  };

  const handleReset = () => {
    setName('');
    setLocalPath('');
    setGithubOwner('');
    setGithubRepo('');
    setDefaultBranch('main');
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
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add repository:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleReset();
        }
        onOpenChange(open);
      }}
    >
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
            {detecting ? (
              <p className="text-xs text-slate-500">
                {t('git_project_manager.auto_detecting_remote')}
              </p>
            ) : detectMessage ? (
              <p className="text-xs text-amber-600">{detectMessage}</p>
            ) : null}
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
          <Button variant="outline" onClick={closeDialog} disabled={loading}>
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
