import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import {
  RefreshCw,
  Video,
  FileText,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({
  component: Dashboard
});

function Dashboard() {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: t('nav_convert', '文件转换'),
      desc: t('dashboard_quick_action_convert_desc', '快速转换文件格式'),
      icon: RefreshCw,
      to: '/convert',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: t('nav_media_to_docs', 'AI 转文档'),
      desc: t(
        'dashboard_quick_action_media_to_docs_desc',
        '智能视频转文档'
      ),
      icon: Video,
      to: '/media-to-docs',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  const stats = [
    {
      label: t('dashboard_stat_today', '今日转换'),
      value: '0',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: t('dashboard_stat_week', '本周转换'),
      value: '0',
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      label: t('dashboard_stat_total', '总计转换'),
      value: '0',
      icon: Zap,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('dashboard_welcome', '欢迎使用 Haibara Tools')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {currentTime.toLocaleDateString('zh-CN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            {'  '}
            {currentTime.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {isElectron && (
          <div className="text-xs text-slate-400">
            <Clock className="inline h-4 w-4" /> {t('dashboard_electron_mode', 'Electron 模式')}
          </div>
        )}
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('dashboard_quick_actions', '快速操作')}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.to} to={action.to}>
                <Card className="group cursor-pointer border-slate-200 bg-white transition-all hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-center gap-4 p-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${action.color} ${action.hoverColor} transition-colors`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-500">{action.desc}</p>
                    </div>
                    <div className="text-slate-400 transition-transform group-hover:translate-x-1">
                      →
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 统计信息 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('dashboard_stats', '使用统计')}
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-20`} />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 最近使用 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('dashboard_recent_activity', '最近使用')}
        </h2>
        <Card className="border-slate-200 bg-white p-6">
          <div className="text-center text-slate-400">
            <FileText className="mx-auto h-12 w-12 opacity-20" />
            <p className="mt-2 text-sm">{t('dashboard_no_recent_activity', '暂无使用记录')}</p>
          </div>
        </Card>
      </div>

      {/* 提示信息 */}
      {isElectron && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900">{t('dashboard_config_tip_title', '配置提示')}</p>
              <p className="mt-1 text-blue-700">
                {t('dashboard_config_tip_desc', '首次使用？请前往设置页面配置您的 API Keys，以使用 AI 相关功能。')}
              </p>
              <Link to="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {t('dashboard_go_to_settings', '前往设置')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
