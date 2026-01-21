import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
import { Button } from '@/routes/-components/ui/button';
import { Input } from '@/routes/-components/ui/input';
import { Label } from '@/routes/-components/ui/label';
import { Switch } from '@/routes/-components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, queryClient } from '@/router';
import { toast } from 'sonner';
import { Loader2, Plus, Github } from 'lucide-react';
import type { GitHubSyncConfig } from '@/types/docs';

interface GitHubSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubSyncDialog({
  open,
  onOpenChange
}: GitHubSyncDialogProps) {
  const { t } = useTranslation();

  // 获取当前配置
  const { data: config, isLoading: configLoading } = useQuery(
    trpc.docs.getSyncConfig.queryOptions()
  );

  // 获取仓库列表
  const { data: repos, isLoading: reposLoading } = useQuery({
    ...trpc.docs.listGitHubRepos.queryOptions(),
    enabled: open
  });

  // 本地状态
  const [formData, setFormData] = useState<Partial<GitHubSyncConfig>>({
    enabled: false,
    owner: '',
    repo: '',
    branch: 'main',
    directory: 'docs',
    imageDirectory: 'docs/assets',
    autoSync: false
  });

  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);

  // 同步配置到表单
  useEffect(() => {
    if (config) {
      setFormData({
        enabled: config.enabled,
        owner: config.owner || '',
        repo: config.repo || '',
        branch: config.branch || 'main',
        directory: config.directory || 'docs',
        imageDirectory: config.imageDirectory || 'docs/assets',
        autoSync: config.autoSync || false
      });
    }
  }, [config]);

  // 更新配置
  const updateConfigMutation = useMutation(
    trpc.docs.updateSyncConfig.mutationOptions()
  );

  // 创建仓库
  const createRepoMutation = useMutation(
    trpc.docs.createGitHubRepo.mutationOptions()
  );

  const handleSave = async () => {
    try {
      await updateConfigMutation.mutateAsync(formData);
      queryClient.invalidateQueries({ queryKey: ['docs', 'getSyncConfig'] });
      toast.success(t('docs_manager.sync_success'));
      onOpenChange(false);
    } catch (error) {
      toast.error(t('docs_manager.sync_failed'));
      console.error('Save config error:', error);
    }
  };

  const handleCreateRepo = async () => {
    if (!newRepoName) return;

    try {
      const result = await createRepoMutation.mutateAsync({
        name: newRepoName,
        description: 'Personal knowledge base documents',
        private: newRepoPrivate
      });

      // 更新表单数据
      const [owner, repo] = result.fullName.split('/');
      setFormData((prev) => ({
        ...prev,
        owner,
        repo,
        branch: result.defaultBranch
      }));

      setShowCreateRepo(false);
      setNewRepoName('');
      queryClient.invalidateQueries({ queryKey: ['docs', 'listGitHubRepos'] });
      toast.success('仓库创建成功');
    } catch (error) {
      toast.error('创建仓库失败');
      console.error('Create repo error:', error);
    }
  };

  const handleRepoSelect = (fullName: string) => {
    const [owner, repo] = fullName.split('/');
    const selectedRepo = repos?.find((r) => r.fullName === fullName);
    setFormData((prev) => ({
      ...prev,
      owner,
      repo,
      branch: selectedRepo?.defaultBranch || 'main'
    }));
  };

  if (configLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {t('docs_manager.sync_title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 启用同步 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="sync-enabled">启用 GitHub 同步</Label>
            <Switch
              id="sync-enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {formData.enabled && (
            <>
              {/* 选择仓库 */}
              <div className="space-y-2">
                <Label>{t('docs_manager.sync_repo')}</Label>
                {reposLoading ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载仓库列表...
                  </div>
                ) : repos && repos.length > 0 ? (
                  <div className="space-y-2">
                    <Select
                      value={
                        formData.owner && formData.repo
                          ? `${formData.owner}/${formData.repo}`
                          : ''
                      }
                      onValueChange={handleRepoSelect}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('docs_manager.sync_repo_placeholder')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {repos.map((repo) => (
                          <SelectItem key={repo.fullName} value={repo.fullName}>
                            {repo.fullName}
                            {repo.private && ' 🔒'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateRepo(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('docs_manager.sync_create_repo')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    {t('docs_manager.sync_no_token')}
                  </div>
                )}
              </div>

              {/* 创建仓库表单 */}
              {showCreateRepo && (
                <div className="space-y-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
                  <div className="space-y-2">
                    <Label>仓库名称</Label>
                    <Input
                      placeholder="my-knowledge-base"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>私有仓库</Label>
                    <Switch
                      checked={newRepoPrivate}
                      onCheckedChange={setNewRepoPrivate}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateRepo}
                      disabled={!newRepoName || createRepoMutation.isPending}
                    >
                      {createRepoMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      创建
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCreateRepo(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* 分支 */}
              <div className="space-y-2">
                <Label htmlFor="sync-branch">
                  {t('docs_manager.sync_branch')}
                </Label>
                <Input
                  id="sync-branch"
                  value={formData.branch}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, branch: e.target.value }))
                  }
                />
              </div>

              {/* 文档目录 */}
              <div className="space-y-2">
                <Label htmlFor="sync-directory">
                  {t('docs_manager.sync_directory')}
                </Label>
                <Input
                  id="sync-directory"
                  placeholder={t('docs_manager.sync_directory_placeholder')}
                  value={formData.directory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      directory: e.target.value
                    }))
                  }
                />
              </div>

              {/* 自动同步 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">
                    {t('docs_manager.sync_auto_sync')}
                  </Label>
                  <p className="text-xs text-slate-500">
                    {t('docs_manager.sync_auto_sync_desc')}
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={formData.autoSync}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, autoSync: checked }))
                  }
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
          >
            {updateConfigMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            保存配置
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
