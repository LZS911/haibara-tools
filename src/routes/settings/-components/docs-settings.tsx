import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc, queryClient } from '@/router';
import { Card } from '@/routes/-components/ui/card';
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
import { Github, Loader2, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { GitHubSyncConfig } from '@/types/docs';

export function DocsSettings() {
  const { t } = useTranslation();

  // 获取当前配置
  const { data: config, isLoading: configLoading } = useQuery(
    trpc.docs.getSyncConfig.queryOptions()
  );

  // 获取仓库列表
  const { data: repos, isLoading: reposLoading } = useQuery(
    trpc.docs.listGitHubRepos.queryOptions()
  );

  // 获取 LLM providers
  const { data: providers } = useQuery(trpc.llm.getProviders.queryOptions());

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
      toast.success('配置已保存');
    } catch (error) {
      toast.error('保存失败');
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
    return (
      <Card className="mt-6 border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {/* GitHub 同步配置 */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-base font-medium text-slate-900 flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub 同步配置
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            将文档同步到 GitHub 仓库进行备份和版本管理
          </p>
        </div>

        <div className="space-y-4">
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
                <Label>仓库</Label>
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
                        <SelectValue placeholder="选择仓库" />
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
                      创建新仓库
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    请先在 Git 设置中配置 GitHub Token
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
                <Label htmlFor="sync-branch">分支</Label>
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
                <Label htmlFor="sync-directory">文档目录</Label>
                <Input
                  id="sync-directory"
                  placeholder="docs"
                  value={formData.directory}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      directory: e.target.value
                    }))
                  }
                />
                <p className="text-xs text-slate-500">
                  文档将保存到仓库的这个目录下
                </p>
              </div>

              {/* 自动同步 */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">自动同步</Label>
                  <p className="text-xs text-slate-500">
                    保存文档时自动同步到 GitHub
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

          <Button
            onClick={handleSave}
            disabled={updateConfigMutation.isPending}
            className="mt-4"
          >
            {updateConfigMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            保存同步配置
          </Button>
        </div>
      </Card>

      {/* 默认 AI 提供商 */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="mb-4">
          <h3 className="text-base font-medium text-slate-900">
            {t('docs_manager.settings_default_provider')}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {t('docs_manager.settings_default_provider_desc')}
          </p>
        </div>

        <div className="space-y-2">
          <Label>AI 提供商</Label>
          {providers && providers.length > 0 ? (
            <div className="space-y-2">
              {providers
                .filter((p) => p.isConfigured)
                .map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{provider.name}</span>
                    <span className="text-slate-500">
                      - {provider.description}
                    </span>
                  </div>
                ))}
              {providers.filter((p) => p.isConfigured).length === 0 && (
                <p className="text-sm text-slate-500">
                  暂无已配置的 AI 提供商，请先在 LLM 设置中配置
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">加载中...</p>
          )}
        </div>
      </Card>
    </div>
  );
}
