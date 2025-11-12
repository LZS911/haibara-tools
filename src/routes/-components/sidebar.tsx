import { Link, useRouterState, type LinkProps } from '@tanstack/react-router';
import {
  Video,
  Settings,
  Database,
  ChevronLeft,
  CloudUpload,
  Download,
  Mic,
  AudioLines,
  GitBranch,
  Brain
} from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/app';
import { cn } from '../-lib/utils';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CONSTANT } from '../../data/constant';

interface NavItem {
  path: LinkProps['to'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  electronOnly?: boolean;
  category?: string;
}

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const { isTaskRunning } = useAppStore();
  const [appVersion, setAppVersion] = useState('');
  const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);

  useEffect(() => {
    if (CONSTANT.IS_ELECTRON && window.electronAPI) {
      window.electronAPI.getAppVersion().then(setAppVersion);
    }
  }, []);

  const handleCheckForUpdate = async () => {
    if (CONSTANT.IS_ELECTRON && window.electronAPI) {
      setIsCheckingForUpdate(true);
      try {
        const result = await window.electronAPI.checkForUpdates();
        if (result?.isLatest) {
          toast.info(t('components.check_for_updates'), {
            description: t('components.update_latest_message')
          });
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
        toast.error(t('components.update_check_failed_message'), {
          description: t('components.update_check_failed_message')
        });
      } finally {
        setIsCheckingForUpdate(false);
      }
    }
  };

  const navItems: NavItem[] = [
    {
      path: '/media-to-docs',
      label: t('common.nav_media_to_docs'),
      icon: Video,
      category: 'tools'
    },
    {
      path: '/bilibili-downloader',
      label: t('common.nav_bilibili_downloader'),
      icon: Download,
      category: 'tools'
    },
    {
      path: '/voice-cloning/training',
      label: t('common.nav_voice_training'),
      icon: Mic,
      category: 'tools'
    },
    {
      path: '/voice-cloning/synthesis',
      label: t('common.nav_voice_synthesis'),
      icon: AudioLines,
      category: 'tools'
    },
    {
      path: '/git-project-manager',
      label: t('common.nav_git_project_manager'),
      icon: GitBranch,
      electronOnly: true,
      category: 'tools'
    },
    {
      path: '/prompt-optimizer',
      label: t('common.nav_prompt_optimizer'),
      icon: Brain,
      category: 'tools'
    },
    {
      path: '/media-to-docs/convert-history',
      label: t('components.nav_history_management'),
      icon: Database,
      category: 'manage'
    },
    {
      path: '/settings',
      label: t('components.nav_settings'),
      icon: Settings,
      electronOnly: true,
      category: 'system'
    }
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.electronOnly || CONSTANT.IS_ELECTRON
  );

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;

    const isActive = currentPath === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center rounded text-sm font-medium transition-all duration-150',

          isActive
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',

          isTaskRunning && 'cursor-not-allowed opacity-50 pointer-events-none',

          isCollapsed ? 'justify-center h-8 w-8' : 'gap-2.5 px-2.5 py-1.5'
        )}
      >
        <Icon
          className={cn(
            'flex-shrink-0 transition-all',

            isCollapsed ? 'h-4 w-4' : 'h-4 w-4'
          )}
        />

        <span
          className={cn(
            'whitespace-nowrap transition-opacity duration-200',

            isCollapsed && 'opacity-0 w-0'
          )}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full border-r border-slate-200 bg-white transition-all duration-300',
        isCollapsed ? 'w-16 p-1' : 'w-52'
      )}
      style={{
        top: CONSTANT.IS_ELECTRON ? '40px' : '0',
        height: CONSTANT.IS_ELECTRON ? 'calc(100vh - 40px)' : '100vh'
      }}
    >
      <nav className="relative flex h-full flex-col p-2">
        {/* Collapse Button */}
        <div
          className={cn(
            'absolute top-1/2 -right-3 z-50 transition-transform duration-300',
            isCollapsed && 'rotate-180'
          )}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 rounded-full bg-white shadow-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* 工具区域 */}
        <div className="mb-3">
          {!isCollapsed && (
            <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('components.sidebar_tools')}
            </p>
          )}
          <div className="space-y-0.5">
            {filteredNavItems
              .filter((item) => item.category === 'tools')
              .map(renderNavLink)}
          </div>
        </div>

        {/* 管理区域 */}
        <div className="mb-3">
          {!isCollapsed && (
            <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('components.sidebar_manage', '管理')}
            </p>
          )}
          <div className="space-y-0.5">
            {filteredNavItems
              .filter((item) => item.category === 'manage')
              .map(renderNavLink)}
          </div>
        </div>

        {/* 系统设置区域 */}
        {filteredNavItems.some((item) => item.category === 'system') && (
          <div className="mb-3">
            {!isCollapsed && (
              <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('components.sidebar_system', '系统')}
              </p>
            )}
            <div className="space-y-0.5">
              {filteredNavItems
                .filter((item) => item.category === 'system')
                .map(renderNavLink)}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-auto space-y-1.5 border-t border-slate-200 pt-2.5">
          {CONSTANT.IS_ELECTRON && (
            <div
              className={cn(
                'flex items-center rounded py-1 text-sm text-slate-500',
                {
                  'px-2.5': !isCollapsed
                }
              )}
            >
              <div
                className={cn('flex-1 transition-opacity duration-200', {
                  hidden: isCollapsed
                })}
              >
                <p className="whitespace-nowrap text-xs font-medium">
                  {t('components.version')} {appVersion}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleCheckForUpdate}
                disabled={isCheckingForUpdate}
                className="flex-shrink-0 cursor-pointer"
                title={t('components.check_for_updates')}
              >
                <CloudUpload
                  className={cn('h-3.5 w-3.5 cursor-pointer!', {
                    'animate-spin': isCheckingForUpdate
                  })}
                />
              </Button>
            </div>
          )}
          <Link
            to="/"
            className={cn(
              isTaskRunning &&
                'cursor-not-allowed opacity-50 pointer-events-none'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-2.5 rounded px-2.5 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded bg-slate-100">
                <img src="/icon.svg" alt="Logo" className="h-4 w-4" />
              </div>
              <div
                className={cn('flex-1 transition-opacity duration-200', {
                  hidden: isCollapsed
                })}
              >
                <p className="whitespace-nowrap text-xs font-medium">
                  {t('common.app_title')}
                </p>
                <p className="whitespace-nowrap text-xs text-slate-400">
                  {t('components.sidebar_dashboard')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
