import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '@/routes/-components/ui/card';
import { Button } from '@/routes/-components/ui/button';
import { Download, Video, Clock, Zap, Mic, AudioLines, GitBranch } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CONSTANT } from '../data/constant';

export const Route = createFileRoute('/')({
  component: Dashboard
});

function Dashboard() {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const quickActions = [
    {
      title: t('common.nav_bilibili_downloader'),
      desc: t('home.dashboard_quick_action_bilibili_downloader_desc'),
      icon: Download,
      to: '/bilibili-downloader',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      title: t('common.nav_media_to_docs'),
      desc: t('home.dashboard_quick_action_media_to_docs_desc'),
      icon: Video,
      to: '/media-to-docs',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    },
    {
      title: t('common.nav_voice_training'),
      desc: t('home.dashboard_quick_action_voice_training_desc'),
      icon: Mic,
      to: '/voice-cloning/training',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      title: t('common.nav_voice_synthesis'),
      desc: t('home.dashboard_quick_action_voice_synthesis_desc'),
      icon: AudioLines,
      to: '/voice-cloning/synthesis',
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600'
    },
    {
      title: t('common.nav_git_project_manager'),
      desc: t('home.dashboard_quick_action_git_project_manager_desc'),
      icon: GitBranch,
      to: '/git-project-manager',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {t('home.dashboard_welcome')}
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
        {CONSTANT.IS_ELECTRON && CONSTANT.IS_DEV && (
          <div className="text-xs text-slate-400">
            <Clock className="inline h-4 w-4" />{' '}
            {t('home.dashboard_electron_mode')}
          </div>
        )}
      </div>

      {/* 快速操作 */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">
          {t('home.dashboard_quick_actions')}
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

      {/* 提示信息 */}
      {CONSTANT.IS_ELECTRON && (
        <Card className="border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Zap className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900">
                {t('home.dashboard_config_tip_title')}
              </p>
              <p className="mt-1 text-blue-700">
                {t('home.dashboard_config_tip_desc')}
              </p>
              <Link to="/settings">
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  {t('home.dashboard_go_to_settings')}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
