import {
  executeGitCommand,
  getRepoStatus,
  getCurrentBranch
} from './-lib/git-commands';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button } from '@/routes/-components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/routes/-components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { Label } from '@/routes/-components/ui/label';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import { toast } from 'sonner';
import { FileChangeList } from './-components/FileChangeList';
import { CommitMessageEditor } from './-components/CommitMessageEditor';
import { PRList } from './-components/PRList';
import type { FileChange } from './-types';
import { useConfirmationDialog } from '../-components/ui/use-confirm-dialog';
import { CONSTANT } from '../../data/constant';
import { Spinner } from '../-components/spinner';
import { Input } from '../-components/ui/input';

export const Route = createFileRoute('/git-project-manager/project/$id')({
  component: ProjectDetail,
  staticData: { keepAlive: true }
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('changes');
  const [changeDescription, setChangeDescription] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [targetBranch, setTargetBranch] = useState('');
  const [currentBranch, setCurrentBranch] = useState('');
  const [prTitle, setPrTitle] = useState(''); // New state for PR title
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const [githubToken, setGithubToken] = useState('');
  const [isAddingFiles, setIsAddingFiles] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [isSyncingPRs, setIsSyncingPRs] = useState(false);
  const [isProcessingPR, setIsProcessingPR] = useState(false); // 新增状态，用于追踪 PR 处理流程

  useEffect(() => {
    if (CONSTANT.IS_ELECTRON) {
      window.electronAPI?.getConfig().then((config) => {
        setGithubToken(config?.GITHUB_TOKEN || '');
      });
    }
  }, []);

  // 检查是否在 Electron 环境
  useEffect(() => {
    if (!CONSTANT.IS_ELECTRON) {
      navigate({ to: '/' });
      return;
    }
  }, [navigate]);

  // 获取仓库信息
  const { data: repository, isLoading: loadingRepository } = useQuery({
    ...trpc.git.getLocalRepositoryById.queryOptions({ id }),
    enabled: !!id
  });

  // 获取文件变更
  const { data: repoStatus, refetch: refetchRepoStatus } = useQuery({
    queryKey: ['repoStatus', id],
    queryFn: async () => {
      if (!repository?.localPath) return { changes: [] };
      return getRepoStatus(repository.localPath);
    },
    enabled: !!repository?.localPath,
    refetchInterval: 5000
  });

  // 获取当前分支
  const { data: currentBranchData } = useQuery({
    queryKey: ['currentBranch', id],
    queryFn: async () => {
      if (!repository?.localPath) return { branch: '' };
      return getCurrentBranch(repository.localPath);
    },
    enabled: !!repository?.localPath
  });

  const { data: remoteBranchesData } = useQuery(
    trpc.git.getRemoteBranches.queryOptions(
      {
        token: githubToken,
        owner: repository?.githubOwner || '',
        repo: repository?.githubRepo || ''
      },
      {
        enabled:
          !!repository?.githubOwner && !!repository?.githubRepo && !!githubToken
      }
    )
  );

  // 获取 PR 记录
  const {
    data: prRecords = [],
    refetch: refetchPRRecords,
    isLoading: loadingPRs
  } = useQuery(
    trpc.git.getPRRecords.queryOptions(
      { repositoryId: id },
      {
        enabled: !!id
      }
    )
  );

  // 生成提交信息
  const generateCommitMessageMutation = useMutation(
    trpc.git.generateCommitMessage.mutationOptions()
  );

  // 执行 Git 命令
  const executeGitCommandMutation = useMutation({
    mutationFn: async ({
      command,
      repoPath,
      token
    }: {
      command: string;
      repoPath: string;
      token?: string;
    }) => {
      return executeGitCommand(command, repoPath, token);
    }
  });

  // 创建 PR
  const createPullRequestMutation = useMutation(
    trpc.git.createPullRequest.mutationOptions()
  );

  // 同步 PR 记录
  const syncPRRecordsMutation = useMutation(
    trpc.git.syncPRRecords.mutationOptions()
  );

  // 更新状态
  useEffect(() => {
    if (currentBranchData?.branch) {
      setCurrentBranch(currentBranchData.branch);
      if (!targetBranch) {
        setTargetBranch(repository?.defaultBranch || 'main');
      }
    }
  }, [currentBranchData, repository, targetBranch]);

  const handleGenerateCommitMessage = async () => {
    if (!changeDescription.trim()) {
      toast.error(t('git_project_manager.please_input_description'));
      return;
    }

    try {
      const result = await generateCommitMessageMutation.mutateAsync({
        changeDescription,
        llmProvider: 'gemini'
      });

      setCommitMessage(result);
      setPrTitle(result);
    } catch (error) {
      console.error('Failed to generate commit message:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('git_project_manager.operation_failed', { error: String(error) })
      );
    }
  };

  const handleCommitAndCreatePR = async () => {
    if (!repository) return;

    if (!changeDescription.trim()) {
      toast.error(t('git_project_manager.please_input_description'));
      return;
    }

    if (!commitMessage.trim()) {
      toast.error(t('git_project_manager.please_generate_commit_message'));
      return;
    }

    if (!targetBranch) {
      toast.error(t('git_project_manager.please_select_target_branch'));
      return;
    }

    if (!githubToken) {
      toast.error(t('git_project_manager.github_token_not_configured'));
      return;
    }

    const confirmed = await confirm({
      title: t('git_project_manager.confirm_commit_title'),
      description: t('git_project_manager.confirm_commit_desc'),
      content: (
        <div className="space-y-2">
          <pre className="text-xs bg-slate-50 p-2 rounded whitespace-pre-wrap">
            {t('git_project_manager.confirm_commit_steps', {
              message: commitMessage,
              branch: currentBranch
            })}
          </pre>
          <p className="text-xs text-slate-600">
            {t('git_project_manager.confirm_commit_warning')}
          </p>
        </div>
      ),
      confirmText: t('git_project_manager.confirm')
    });

    if (!confirmed) return;

    // 开始处理 PR，设置标志以避免页面状态被清空
    setIsProcessingPR(true);

    try {
      setIsAddingFiles(true);
      // 1. git add .
      await executeGitCommandMutation.mutateAsync({
        command: 'git add .',
        repoPath: repository.localPath
      });
      setIsAddingFiles(false);

      setIsCommitting(true);
      // 2. git commit
      await executeGitCommandMutation.mutateAsync({
        command: `git commit -m "${commitMessage}"`,
        repoPath: repository.localPath
      });
      setIsCommitting(false);

      setIsPushing(true);
      // 3. git push
      await executeGitCommandMutation.mutateAsync({
        command: `git push origin ${currentBranch}`,
        repoPath: repository.localPath,
        token: githubToken
      });
      setIsPushing(false);

      setIsCreatingPR(true);
      // 4. 创建 PR
      await createPullRequestMutation.mutateAsync({
        token: githubToken,
        owner: repository.githubOwner,
        repo: repository.githubRepo,
        head: currentBranch,
        base: targetBranch,
        changeDescription,
        llmProvider: 'gemini',
        prTitle: prTitle.trim() === '' ? undefined : prTitle // Pass prTitle if not empty
      });
      setIsCreatingPR(false);

      setIsSyncingPRs(true);
      // 同步 PR 记录
      await syncPRRecordsMutation.mutateAsync({
        token: githubToken,
        repositoryId: repository.id,
        owner: repository.githubOwner,
        repo: repository.githubRepo
      });
      setIsSyncingPRs(false);

      toast.success(t('git_project_manager.commit_success'));

      // 清空表单
      setChangeDescription('');
      setCommitMessage('');
      setPrTitle(''); // Clear PR title as well

      // 刷新数据
      refetchRepoStatus();
      refetchPRRecords();

      // 切换到 PR 记录标签页
      setActiveTab('pr-records');
    } catch (error) {
      console.error('Failed to commit and create PR:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('git_project_manager.commit_failed')
      );
    } finally {
      setIsAddingFiles(false);
      setIsCommitting(false);
      setIsPushing(false);
      setIsCreatingPR(false);
      setIsSyncingPRs(false);
      setIsProcessingPR(false); // 重置处理标志
    }
  };

  const handleSyncPRRecords = async () => {
    if (!repository) return;

    try {
      if (!githubToken) {
        toast.error(t('git_project_manager.github_token_not_configured'));
        return;
      }

      const result = await syncPRRecordsMutation.mutateAsync({
        token: githubToken,
        repositoryId: repository.id,
        owner: repository.githubOwner,
        repo: repository.githubRepo
      });

      toast.success(
        t('git_project_manager.sync_success', { count: result.count })
      );
      refetchPRRecords();
    } catch (error) {
      console.error('Failed to sync PR records:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('git_project_manager.sync_failed')
      );
    }
  };

  if (!CONSTANT.IS_ELECTRON) {
    return null;
  }

  if (loadingRepository) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-slate-900">仓库未找到</h3>
        <p className="mt-2 text-sm text-slate-500">
          请检查仓库是否存在或返回列表页面
        </p>
        <Button
          onClick={() => navigate({ to: '/git-project-manager' })}
          className="mt-4"
        >
          返回列表
        </Button>
      </div>
    );
  }

  const fileChanges: FileChange[] = repoStatus?.changes || [];

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: '/git-project-manager' })}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('git_project_manager.back_to_list')}
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {repository.name}
          </h1>
          <p className="text-sm text-slate-500">
            {repository.githubOwner}/{repository.githubRepo}
          </p>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="changes">
            {t('git_project_manager.tab_changes')}
          </TabsTrigger>
          <TabsTrigger value="pr-records">
            {t('git_project_manager.tab_pr_records')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-6">
          {/* 文件变更列表 */}
          <FileChangeList changes={fileChanges} />

          {(fileChanges.length > 0 || isProcessingPR) && (
            <>
              {/* 提交信息编辑器 */}
              <CommitMessageEditor
                changeDescription={changeDescription}
                onChangeDescriptionChange={setChangeDescription}
                commitMessage={commitMessage}
                onCommitMessageChange={setCommitMessage}
                onGenerateCommitMessage={handleGenerateCommitMessage}
                isGenerating={generateCommitMessageMutation.isPending}
              />

              {/* 目标分支选择和提交按钮 */}
              <Card className="border-slate-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-slate-900">
                    {t('git_project_manager.target_branch')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pr-title">
                      {t('git_project_manager.pr_title')}
                    </Label>
                    <Input
                      id="pr-title"
                      placeholder={t(
                        'git_project_manager.pr_title_placeholder'
                      )}
                      value={prTitle}
                      onChange={(e) => setPrTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('git_project_manager.current_branch', {
                        branch: currentBranch
                      })}
                    </Label>
                    <Select
                      value={targetBranch}
                      onValueChange={setTargetBranch}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t(
                            'git_project_manager.select_target_branch'
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {remoteBranchesData
                          ?.filter((branch) => branch !== currentBranch)
                          .map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleCommitAndCreatePR}
                    disabled={
                      !changeDescription.trim() ||
                      !commitMessage.trim() ||
                      !targetBranch ||
                      isAddingFiles ||
                      isCommitting ||
                      isPushing ||
                      isCreatingPR ||
                      isSyncingPRs
                    }
                    className="w-full"
                  >
                    {isAddingFiles ? (
                      <>{t('git_project_manager.adding_files')}</>
                    ) : isCommitting ? (
                      <>{t('git_project_manager.committing_changes')}</>
                    ) : isPushing ? (
                      <>{t('git_project_manager.pushing_changes')}</>
                    ) : isCreatingPR ? (
                      <>{t('git_project_manager.creating_pr')}</>
                    ) : isSyncingPRs ? (
                      <>{t('git_project_manager.syncing_prs')}</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('git_project_manager.commit_and_create_pr')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="pr-records">
          <PRList
            prs={prRecords}
            loading={loadingPRs || syncPRRecordsMutation.isPending}
            onRefresh={handleSyncPRRecords}
          />
        </TabsContent>
      </Tabs>

      {ConfirmationDialog}
    </div>
  );
}
