import { Link, useRouterState } from '@tanstack/react-router';
import { RefreshCw, Video, Settings, Menu, X, Database } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  electronOnly?: boolean;
  category?: string;
}

export function Sidebar() {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;

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

  // 在 web 模式下，不显示设置页面
  const filteredNavItems = navItems.filter(
    (item) => !item.electronOnly || isElectron
  );

  return (
    <>
      {/* 移动端菜单按钮 */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* 遮罩层 */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-full w-56 border-r border-slate-200 bg-white transition-transform duration-300
          md:sticky md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          top: isElectron ? '44px' : '0',
          height: isElectron ? 'calc(100vh - 44px)' : '100vh'
        }}
      >
        <nav className="flex h-full flex-col p-3">
          {/* 工具区域 */}
          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('sidebar_tools', '工具')}
            </p>
            <div className="space-y-1">
              {filteredNavItems
                .filter((item) => item.category === 'tools')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* 管理区域 */}
          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('sidebar_manage', '管理')}
            </p>
            <div className="space-y-1">
              {filteredNavItems
                .filter((item) => item.category === 'manage')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                        ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* 系统设置区域 */}
          {filteredNavItems.some((item) => item.category === 'system') && (
            <div className="mb-4">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t('sidebar_system', '系统')}
              </p>
              <div className="space-y-1">
                {filteredNavItems
                  .filter((item) => item.category === 'system')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPath === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`
                          flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                          ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 底部信息 */}
          <div className="mt-auto border-t border-slate-200 pt-3">
            <Link to="/">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
                  <img src="/icon.svg" alt="Logo" className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">Haibara Tools</p>
                  <p className="text-xs text-slate-400">
                    {t('sidebar_dashboard', '仪表板')}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
}
