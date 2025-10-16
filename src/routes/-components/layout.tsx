import { Titlebar } from './titlebar';
import { Sidebar } from './sidebar';
import { UpdateNotification } from './update-notification';
import { useState, useCallback, useEffect } from 'react';
import { CONSTANT } from '../../data/constant';

type Props = {
  children: React.ReactNode;
};

export const Layout: React.FC<Props> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (CONSTANT.IS_ELECTRON) {
      window.electronAPI?.getConfig().then((config) => {
        if (config.SIDEBAR_COLLAPSED !== undefined) {
          setIsSidebarCollapsed(config.SIDEBAR_COLLAPSED === String(true));
          return;
        }
        setIsSidebarCollapsed(false);
      });
    } else {
      const saved = window.localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        try {
          setIsSidebarCollapsed(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to parse sidebar state:', error);
          setIsSidebarCollapsed(false);
        }
      }
    }
  }, []);

  const handleSetIsCollapsed = useCallback(
    async (collapsed: boolean | ((prevState: boolean) => boolean)) => {
      const newCollapsedValue =
        typeof collapsed === 'function'
          ? collapsed(isSidebarCollapsed)
          : collapsed;
      setIsSidebarCollapsed(newCollapsedValue);

      if (CONSTANT.IS_ELECTRON) {
        try {
          const currentConfig = await window.electronAPI!.getConfig();
          await window.electronAPI!.saveConfig({
            ...currentConfig,
            SIDEBAR_COLLAPSED: String(newCollapsedValue)
          });
        } catch (error) {
          console.error('Failed to save sidebar state:', error);
        }
      } else {
        window.localStorage.setItem(
          'sidebar-collapsed',
          JSON.stringify(newCollapsedValue)
        );
      }
    },
    [isSidebarCollapsed]
  );

  return (
    <div className="flex h-screen flex-col bg-slate-50/50">
      {/* 自定义标题栏（仅 Electron） */}
      {CONSTANT.IS_ELECTRON && <Titlebar />}

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={handleSetIsCollapsed}
        />

        {/* 主内容区 */}
        <main
          className={`flex-1 pt-8 pb-4 overflow-y-auto bg-slate-50/50 transition-all duration-300`}
          style={{
            marginLeft: isSidebarCollapsed ? '4rem' : '13rem'
          }}
        >
          <div className="mx-auto max-w-7xl px-6 md:px-8">{children}</div>
        </main>
      </div>

      {/* 更新通知（仅 Electron） */}
      {CONSTANT.IS_ELECTRON && <UpdateNotification />}
    </div>
  );
};
