import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/routes/-components/ui/dialog';
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
import { FileText, Copy, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Spinner } from '@/routes/-components/spinner';
import type { GitRepository, PRRecord } from '../-types';
import { PRCard } from './PRCard';
import { toast } from 'sonner';

interface WeeklyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repositories: GitRepository[];
  onGenerateReport: (options: {
    repositoryIds: string[];
    startTime: string;
    endTime: string;
    selectedPRIds: number[];
  }) => Promise<string>;
  onLoadPRs: (
    repositoryIds: string[],
    startTime: string,
    endTime: string
  ) => Promise<PRRecord[]>;
}

export function WeeklyReportDialog({
  open,
  onOpenChange,
  repositories,
  onGenerateReport,
  onLoadPRs
}: WeeklyReportDialogProps) {
  const { t } = useTranslation();
  const [selectedRepoIds, setSelectedRepoIds] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'custom'>(
    'week'
  );
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [prs, setPRs] = useState<PRRecord[]>([]);
  const [selectedPRIds, setSelectedPRIds] = useState<number[]>([]);
  const [loadingPRs, setLoadingPRs] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportContent, setReportContent] = useState('');

  // 初始化时间范围
  useEffect(() => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start: string;

    if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = weekAgo.toISOString().split('T')[0];
    } else if (timeRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = monthAgo.toISOString().split('T')[0];
    } else {
      // custom - 保持现有值或设置默认值
      if (!startTime) {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        start = weekAgo.toISOString().split('T')[0];
      } else {
        start = startTime;
      }
    }

    setStartTime(start);
    setEndTime(end);
  }, [timeRange]);

  // 加载 PR 记录
  useEffect(() => {
    if (selectedRepoIds.length > 0 && startTime && endTime) {
      loadPRs();
    } else {
      setPRs([]);
      setSelectedPRIds([]);
    }
  }, [selectedRepoIds, startTime, endTime]);

  const loadPRs = async () => {
    if (selectedRepoIds.length === 0 || !startTime || !endTime) return;

    setLoadingPRs(true);
    try {
      const loadedPRs = await onLoadPRs(selectedRepoIds, startTime, endTime);
      setPRs(loadedPRs);
      setSelectedPRIds([]);
    } catch (error) {
      console.error('Failed to load PRs:', error);
      toast.error(
        t('git_project_manager.operation_failed', { error: String(error) })
      );
    } finally {
      setLoadingPRs(false);
    }
  };

  const handleGenerateReport = async () => {
    if (selectedPRIds.length === 0) {
      toast.error(t('git_project_manager.no_prs_selected'));
      return;
    }

    setGeneratingReport(true);
    try {
      const report = await onGenerateReport({
        repositoryIds: selectedRepoIds,
        startTime,
        endTime,
        selectedPRIds
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

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      toast.success(t('git_project_manager.copy_success'));
    } catch (error) {
      console.error('Failed to copy report:', error);
    }
  };

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

  const handleSelectAll = () => {
    setSelectedPRIds(prs.map((pr) => pr.id));
  };

  const handleDeselectAll = () => {
    setSelectedPRIds([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('git_project_manager.weekly_report_dialog_title')}
          </DialogTitle>
          <DialogDescription>
            {t('git_project_manager.weekly_report_dialog_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 左侧：配置区域 */}
            <div className="space-y-4">
              {/* 项目选择 */}
              <div className="space-y-2">
                <Label>{t('git_project_manager.select_repositories')}</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
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
                      <Label htmlFor={repo.id} className="text-sm">
                        {repo.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 时间范围 */}
              <div className="space-y-2">
                <Label>{t('git_project_manager.time_range')}</Label>
                <Select
                  value={timeRange}
                  onValueChange={(value: any) => setTimeRange(value)}
                >
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

              {timeRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>{t('git_project_manager.start_time')}</Label>
                    <input
                      type="date"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('git_project_manager.end_time')}</Label>
                    <input
                      type="date"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* PR 选择 */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {t('git_project_manager.selected_prs')} (
                      {selectedPRIds.length})
                    </CardTitle>
                    {prs.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleSelectAll}
                          className="h-auto px-2 py-1 text-xs"
                        >
                          {t('git_project_manager.select_all')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDeselectAll}
                          className="h-auto px-2 py-1 text-xs"
                        >
                          {t('git_project_manager.deselect_all')}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="h-64">
                    {loadingPRs ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner className="h-6 w-6" />
                      </div>
                    ) : prs.length === 0 ? (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        {t('git_project_manager.no_prs_selected')}
                      </div>
                    ) : (
                      <div className="space-y-2">
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
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* 右侧：周报内容 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {t('git_project_manager.generate_weekly_report')}
                </Label>
                {reportContent && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyReport}
                      className="h-auto px-2 py-1"
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {t('git_project_manager.copy_report')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportReport}
                      className="h-auto px-2 py-1"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      {t('git_project_manager.export_report')}
                    </Button>
                  </div>
                )}
              </div>

              <Card className="flex-1">
                <CardContent className="p-0">
                  {reportContent ? (
                    <ScrollArea className="h-96">
                      <div className="p-4">
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
                          {generatingReport
                            ? t('git_project_manager.generating_report')
                            : t('git_project_manager.generate_weekly_report')}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('git_project_manager.cancel')}
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={selectedPRIds.length === 0 || generatingReport}
          >
            {generatingReport ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {t('git_project_manager.generating_report')}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {t('git_project_manager.generate_report')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
