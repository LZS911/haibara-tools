import { Link, useRouterState } from '@tanstack/react-router';
import {
  RefreshCw,
  Video,
  Settings,
  Database,
  ChevronLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/app';
import { cn } from '../-lib/utils';

interface NavItem {
  path: string;
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
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;

  const { isTaskRunning } = useAppStore();

  const navItems: NavItem[] = [
    {
      path: '/convert',
      label: t('nav_convert', '文件转换'),
      icon: RefreshCw,
      category: 'tools'
    },
    {
      path: '/media-to-docs',
      label: t('nav_media_to_docs', 'AI 转文档'),
      icon: Video,
      category: 'tools'
    },
    {
      path: '/media-to-docs/cache-management',
      label: t('nav_cache_management', '缓存管理'),
      icon: Database,
      category: 'manage'
    },
    {
      path: '/settings',
      label: t('nav_settings', '设置'),
      icon: Settings,
      electronOnly: true,
      category: 'system'
    }
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.electronOnly || isElectron
  );

  const renderNavLink = (item: NavItem) => {
    const Icon = item.icon;

    const isActive = currentPath === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          'flex items-center rounded-lg text-sm font-medium transition-all',

          isActive
            ? 'bg-slate-900 text-white shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',

          isTaskRunning && 'cursor-not-allowed opacity-50 pointer-events-none',

          isCollapsed ? 'justify-center h-10 w-10' : 'gap-3 px-3 py-2'
        )}
      >
        <Icon
          className={cn(
            'flex-shrink-0 transition-all',

            isCollapsed ? 'h-5 w-5' : 'h-4 w-4'
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
        top: isElectron ? '44px' : '0',
        height: isElectron ? 'calc(100vh - 44px)' : '100vh'
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
        <div className="mb-4">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('sidebar_tools', '工具')}
            </p>
          )}
          <div className="space-y-1">
            {filteredNavItems
              .filter((item) => item.category === 'tools')
              .map(renderNavLink)}
          </div>
        </div>

        {/* 管理区域 */}
        <div className="mb-4">
          {!isCollapsed && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('sidebar_manage', '管理')}
            </p>
          )}
          <div className="space-y-1">
            {filteredNavItems
              .filter((item) => item.category === 'manage')
              .map(renderNavLink)}
          </div>
        </div>

        {/* 系统设置区域 */}
        {filteredNavItems.some((item) => item.category === 'system') && (
          <div className="mb-4">
            {!isCollapsed && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('sidebar_system', '系统')}
              </p>
            )}
            <div className="space-y-1">
              {filteredNavItems
                .filter((item) => item.category === 'system')
                .map(renderNavLink)}
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-auto border-t border-slate-200 pt-3">
          <Link
            to="/"
            className={cn(
              isTaskRunning &&
                'cursor-not-allowed opacity-50 pointer-events-none'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700',
                isCollapsed && 'justify-center'
              )}
            >
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-100">
                <img src="/icon.svg" alt="Logo" className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  'flex-1 transition-opacity duration-200',
                  isCollapsed && 'opacity-0 w-0'
                )}
              >
                <p className="whitespace-nowrap text-xs font-medium">
                  Haibara Tools
                </p>
                <p className="whitespace-nowrap text-xs text-slate-400">
                  {t('sidebar_dashboard', '仪表板')}
                </p>
              </div>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
