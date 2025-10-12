import { Titlebar } from './titlebar';
import { Sidebar } from './sidebar';
import { UpdateNotification } from './update-notification';
import { useState } from 'react';

type Props = {
  children: React.ReactNode;
};

export const Layout: React.FC<Props> = ({ children }) => {
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-slate-50/50">
      {/* 自定义标题栏（仅 Electron） */}
      {isElectron && <Titlebar />}

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* 主内容区 */}
        <main
          className={`flex-1 overflow-y-auto bg-slate-50/50 transition-all duration-300`}
          style={{
            marginLeft: isSidebarCollapsed ? '4.5rem' : '14rem'
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* 更新通知（仅 Electron） */}
      {isElectron && <UpdateNotification />}
    </div>
  );
};
