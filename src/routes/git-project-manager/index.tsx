import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/routes/-components/ui/button';
import { Plus, Settings, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import { toast } from 'sonner';
import { RepoCard } from './-components/RepoCard';
import { AddRepoDialog } from './-components/AddRepoDialog';
import { WeeklyReportDialog } from './-components/WeeklyReportDialog';
import type { GitRepository, PRRecord } from './-types';
import { useConfirmationDialog } from '../-components/ui/use-confirm-dialog';
import { CONSTANT } from '../../data/constant';

export const Route = createFileRoute('/git-project-manager/')({
  component: GitProjectManager,
  staticData: { keepAlive: true }
});

function GitProjectManager() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [addRepoDialogOpen, setAddRepoDialogOpen] = useState(false);
  const [weeklyReportDialogOpen, setWeeklyReportDialogOpen] = useState(false);
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const [queryPRRecordsParams, setQueryPRRecordsParams] = useState<{
    repositoryIds: string[];
    startTime: string;
    endTime: string;
  }>({
    repositoryIds: [],
    startTime: '',
    endTime: ''
  });

  // 检查是否在 Electron 环境
  useEffect(() => {
    if (!CONSTANT.IS_ELECTRON) {
      navigate({ to: '/' });
      return;
    }
  }, [navigate]);

  // 获取本地仓库列表
  const {
    data: repositories = [],
    refetch: refetchRepositories,
    isLoading: loadingRepositories
  } = useQuery(trpc.git.getLocalRepositories.queryOptions());

  // 添加仓库
  const addRepositoryMutation = useMutation(
    trpc.git.addLocalRepository.mutationOptions()
  );

  // 删除仓库
  const deleteRepositoryMutation = useMutation(
    trpc.git.deleteLocalRepository.mutationOptions()
  );

  const { refetch: getPRRecords } = useQuery({
    ...trpc.git.getPRRecordsByTimeRange.queryOptions(queryPRRecordsParams),
    enabled: false
  });

  // 生成周报
  const generateWeeklyReportMutation = useMutation(
    trpc.git.generateWeeklyReport.mutationOptions()
  );

  const handleAddRepository = async (repoData: {
    name: string;
    localPath: string;
    githubOwner: string;
    githubRepo: string;
    defaultBranch: string;
  }) => {
    try {
      // 验证是否为 Git 仓库
      if (!window.electronAPI) {
        throw new Error('Electron API not available');
      }

      const gitStatusResult = await window.electronAPI.executeGitCommand(
        'git status',
        repoData.localPath
      );

      if (!gitStatusResult.success) {
        throw new Error(t('git_project_manager.not_a_git_repo'));
      }

      // 添加仓库
      await addRepositoryMutation.mutateAsync(repoData);

      toast.success(t('git_project_manager.add_repo_success'));
      refetchRepositories();
    } catch (error) {
      console.error('Failed to add repository:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('git_project_manager.add_repo_failed')
      );
      throw error;
    }
  };

  const handleDeleteRepository = async (repository: GitRepository) => {
    const confirmed = await confirm({
      title: t('git_project_manager.confirm'),
      description: `确定要删除仓库 "${repository.name}" 吗？这将同时删除相关的 PR 记录。`,
      confirmText: t('git_project_manager.delete')
    });

    if (!confirmed) return;

    try {
      await deleteRepositoryMutation.mutateAsync({ id: repository.id });
      toast.success('仓库删除成功');
      refetchRepositories();
    } catch (error) {
      console.error('Failed to delete repository:', error);
      toast.error(error instanceof Error ? error.message : '删除仓库失败');
    }
  };

  const handleRepositoryClick = (repository: GitRepository) => {
    navigate({
      to: '/git-project-manager/project/$id',
      params: { id: repository.id }
    });
  };

  const handleLoadPRsForReport = async (
    repositoryIds: string[],
    startTime: string,
    endTime: string
  ): Promise<PRRecord[]> => {
    setQueryPRRecordsParams({ repositoryIds, startTime, endTime });
    try {
      const result = await getPRRecords();
      return result.data ?? [];
    } catch (error) {
      console.error('Failed to load PRs:', error);
      throw error;
    }
  };

  const handleGenerateWeeklyReport = async (options: {
    repositoryIds: string[];
    startTime: string;
    endTime: string;
    selectedPRIds: number[];
  }): Promise<string> => {
    try {
      // 获取选中的 PR 记录
      const allPRs = await getPRRecords();

      const selectedPRs = allPRs.data?.filter((pr) =>
        options.selectedPRIds.includes(pr.id)
      );

      // 转换为 LLM 需要的格式
      const prActivities =
        selectedPRs?.map((pr) => ({
          id: pr.id,
          title: pr.title,
          html_url: pr.htmlUrl,
          user: {
            login: pr.author
          },
          created_at: pr.createdAt,
          closed_at: pr.closedAt || null
        })) ?? [];

      // 获取 LLM 配置（这里需要从设置中获取）
      const config = await window.electronAPI?.getConfig();
      if (
        !config?.OPENAI_API_KEY &&
        !config?.DEEPSEEK_API_KEY &&
        !config?.GEMINI_API_KEY
      ) {
        throw new Error(t('git_project_manager.llm_not_configured'));
      }

      const result = await generateWeeklyReportMutation.mutateAsync({
        prActivities,
        llmProvider: 'gemini'
      });

      return result;
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw error;
    }
  };

  const handleGoToSettings = () => {
    navigate({ to: '/settings' });
  };

  if (!CONSTANT.IS_ELECTRON) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('git_project_manager.title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('git_project_manager.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setWeeklyReportDialogOpen(true)}
            variant="outline"
            disabled={repositories.length === 0}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('git_project_manager.generate_weekly_report')}
          </Button>
          <Button onClick={() => setAddRepoDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('git_project_manager.add_repository')}
          </Button>
        </div>
      </div>

      {/* 仓库列表 */}
      {loadingRepositories ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg border border-slate-200 bg-slate-50 animate-pulse"
            />
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center">
            <Plus className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {t('git_project_manager.no_repositories')}
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            {t('git_project_manager.no_repositories_desc')}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Button onClick={() => setAddRepoDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('git_project_manager.add_repository')}
            </Button>
            <Button variant="outline" onClick={handleGoToSettings}>
              <Settings className="mr-2 h-4 w-4" />
              {t('git_project_manager.go_to_settings')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.map((repository) => (
            <RepoCard
              key={repository.id}
              repository={repository}
              onClick={() => handleRepositoryClick(repository)}
              onDelete={() => handleDeleteRepository(repository)}
            />
          ))}
        </div>
      )}

      {/* 添加仓库对话框 */}
      <AddRepoDialog
        open={addRepoDialogOpen}
        onOpenChange={setAddRepoDialogOpen}
        onAdd={handleAddRepository}
      />

      {/* 周报生成对话框 */}
      <WeeklyReportDialog
        open={weeklyReportDialogOpen}
        onOpenChange={setWeeklyReportDialogOpen}
        repositories={repositories}
        onGenerateReport={handleGenerateWeeklyReport}
        onLoadPRs={handleLoadPRsForReport}
      />

      {ConfirmationDialog}
    </div>
  );
}
