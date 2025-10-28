import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/routes/-components/ui/button';
import { Label } from '@/routes/-components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/routes/-components/ui/select';
import { Checkbox } from '@/routes/-components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/routes/-components/ui/card';
import { ScrollArea } from '@/routes/-components/ui/scroll-area';
import {
  FileText,
  Copy,
  Download,
  Sparkles,
  ArrowLeft,
  Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/router';
import { Spinner } from '@/routes/-components/spinner';
import type { PRRecord } from '../-types';
import { PRCard } from '../-components/PRCard';
import { toast } from 'sonner';
import { CONSTANT } from '../../../data/constant';
import type { LLMProvider } from '@/types/llm';

export const Route = createFileRoute('/git-project-manager/weekly-report/')({
  component: WeeklyReportPage,
  staticData: { keepAlive: true }
});

function WeeklyReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 状态管理
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'custom'>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [selectedPRIds, setSelectedPRIds] = useState<number[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>();

  const llmProvidersQuery = useQuery(trpc.llm.getProviders.queryOptions());
  const { data: llmProviders } = llmProvidersQuery;

  // 当时间范围类型改变时初始化时间
  const handleTimeRangeChange = (value: 'week' | 'month' | 'custom') => {
    setTimeRange(value);
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start: string;

    if (value === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = weekAgo.toISOString().split('T')[0];
    } else if (value === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = monthAgo.toISOString().split('T')[0];
    } else {
      // custom - 保持现有值或设置默认值
      if (!startTime) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = weekAgo.toISOString().split('T')[0];
      } else {
        return; // 自定义模式下不自动更新时间
      }
    }

    setStartTime(start);
    setEndTime(end);
  };

  // 获取本地仓库列表
  const { data: repositories = [], isLoading: loadingRepositories } = useQuery(
    trpc.git.getLocalRepositories.queryOptions()
  );

  // PR 查询（手动触发）
  const { refetch: getPRRecords } = useQuery({
    ...trpc.git.getPRRecordsByTimeRange.queryOptions({
      repositoryIds: selectedRepoIds,
      startTime,
      endTime
    }),
    enabled: false
  });

  // 生成周报
  const generateWeeklyReportMutation = useMutation(
    trpc.git.generateWeeklyReport.mutationOptions()
  );

  // 搜索 PR
  const handleSearchPRs = async () => {
    if (selectedRepoIds.length === 0) {
      toast.error(t('git_project_manager.select_repositories_first'));
      return;
    }

    if (!startTime || !endTime) {
      toast.error(t('git_project_manager.select_time_range_first'));
      return;
    }

    setLoadingPRs(true);
    setHasSearched(true);
    try {
      const result = await getPRRecords();
      setPRs(result.data ?? []);
      setSelectedPRIds([]);
      setReportContent(''); // 清空之前的报告

      if (result.data?.length === 0) {
        toast.info(t('git_project_manager.no_prs_found'));
      } else {
        toast.success(
          t('git_project_manager.prs_loaded', {
            count: result.data?.length || 0
          })
        );
      }
    } catch (error) {
      console.error('Failed to load PRs:', error);
      toast.error(
        t('git_project_manager.operation_failed', { error: String(error) })
      );
    } finally {
      setLoadingPRs(false);
    }
  };

  // 生成报告
  const handleGenerateReport = async () => {
    if (selectedPRIds.length === 0) {
      toast.error(t('git_project_manager.no_prs_selected'));
      return;
    }

    if (!selectedProvider) {
      toast.error(t('git_project_manager.please_select_llm_provider'));
      return;
    }

    setGeneratingReport(true);
    try {
      // 获取选中的 PR 记录
      const selectedPRs = prs.filter((pr) => selectedPRIds.includes(pr.id));

      // 转换为 LLM 需要的格式
      const prActivities = selectedPRs.map((pr) => ({
        id: pr.id,
        title: pr.title,
        html_url: pr.htmlUrl,
        user: {
          login: pr.author
        },
        created_at: pr.createdAt,
        closed_at: pr.closedAt || null
      }));

      // 获取 LLM 配置
      const config = await window.electronAPI?.getConfig();
      if (
        !config?.OPENAI_API_KEY &&
        !config?.DEEPSEEK_API_KEY &&
        !config?.GEMINI_API_KEY
      ) {
        throw new Error(t('git_project_manager.llm_not_configured'));
      }

      const report = await generateWeeklyReportMutation.mutateAsync({
        prActivities,
        llmProvider: selectedProvider
      });

      setReportContent(report);
      toast.success(t('git_project_manager.report_generated'));
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error(
        t('git_project_manager.operation_failed', { error: String(error) })
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // 复制报告
  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      toast.success(t('git_project_manager.copy_success'));
    } catch (error) {
      console.error('Failed to copy report:', error);
    }
  };

  // 导出报告
  const handleExportReport = () => {
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 全选/取消全选 PR
  const handleSelectAll = () => {
    setSelectedPRIds(prs.map((pr) => pr.id));
  };

  const handleDeselectAll = () => {
    setSelectedPRIds([]);
  };

  // 返回主页
  const handleGoBack = () => {
    navigate({ to: '/git-project-manager' });
  };

  // 检查是否在 Electron 环境
  if (!CONSTANT.IS_ELECTRON) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('git_project_manager.weekly_report_title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t('git_project_manager.weekly_report_description')}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('git_project_manager.back')}
        </Button>
      </div>

      {/* 配置区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t('git_project_manager.report_configuration')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LLM 提供商选择 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              {t('git_project_manager.select_llm_provider_title')}
            </Label>
            <div className="w-64">
              <Select
                value={selectedProvider}
                onValueChange={(value) =>
                  setSelectedProvider(value as LLMProvider)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      'git_project_manager.select_llm_provider_placeholder'
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {llmProviders
                    ?.filter((p) => p.isConfigured)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 项目选择 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('git_project_manager.select_repositories')}
            </Label>
            {loadingRepositories ? (
              <div className="flex items-center gap-2">
                <Spinner className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">
                  {t('git_project_manager.loading_repositories')}
                </span>
              </div>
            ) : repositories.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {t('git_project_manager.no_repositories_available')}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {repositories.map((repo) => (
                  <div key={repo.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={repo.id}
                      checked={selectedRepoIds.includes(repo.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRepoIds([...selectedRepoIds, repo.id]);
                        } else {
                          setSelectedRepoIds(
                            selectedRepoIds.filter((id) => id !== repo.id)
                          );
                        }
                      }}
                    />
                    <Label htmlFor={repo.id} className="text-sm cursor-pointer">
                      {repo.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 时间范围选择 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{t('git_project_manager.time_range')}</Label>
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">
                    {t('git_project_manager.last_week')}
                  </SelectItem>
                  <SelectItem value="month">
                    {t('git_project_manager.last_month')}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t('git_project_manager.custom_range')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('git_project_manager.start_time')}</Label>
              <input
                type="date"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={timeRange !== 'custom'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('git_project_manager.end_time')}</Label>
              <input
                type="date"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={timeRange !== 'custom'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* 搜索按钮 */}
          <div className="flex justify-end">
            <Button
              onClick={handleSearchPRs}
              disabled={
                selectedRepoIds.length === 0 ||
                !startTime ||
                !endTime ||
                loadingPRs
              }
              className="flex items-center gap-2"
            >
              {loadingPRs ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loadingPRs
                ? t('git_project_manager.searching')
                : t('git_project_manager.search_prs')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PR 列表区域 */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {t('git_project_manager.pr_list')} ({prs.length})
              </CardTitle>
              {prs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedPRIds.length === prs.length}
                  >
                    {t('git_project_manager.select_all')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedPRIds.length === 0}
                  >
                    {t('git_project_manager.deselect_all')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {prs.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {t('git_project_manager.no_prs_found')}
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {prs.map((pr) => (
                    <PRCard
                      key={`${pr.repositoryId}-${pr.id}`}
                      pr={pr}
                      selectable
                      selected={selectedPRIds.includes(pr.id)}
                      onSelect={(selected) => {
                        if (selected) {
                          setSelectedPRIds([...selectedPRIds, pr.id]);
                        } else {
                          setSelectedPRIds(
                            selectedPRIds.filter((id) => id !== pr.id)
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* 报告生成和显示区域 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t('git_project_manager.weekly_report')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateReport}
                disabled={selectedPRIds.length === 0 || generatingReport}
                className="flex items-center gap-2"
              >
                {generatingReport ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {generatingReport
                  ? t('git_project_manager.generating_report')
                  : t('git_project_manager.generate_report')}
              </Button>
              {reportContent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyReport}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {t('git_project_manager.copy_report')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportReport}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t('git_project_manager.export_report')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportContent ? (
            <ScrollArea className="h-96">
              <div className="p-4 bg-slate-50 rounded-md">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {reportContent}
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {selectedPRIds.length === 0
                    ? t('git_project_manager.select_prs_to_generate')
                    : t('git_project_manager.click_generate_report')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
