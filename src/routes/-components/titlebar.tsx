import { useEffect, useState } from 'react';

export function Titlebar() {
  const [appVersion, setAppVersion] = useState('');
  const isElectron =
    typeof window !== 'undefined' && window.electronAPI?.isElectron;
  const isMac =
    typeof window !== 'undefined' && window.navigator.platform.includes('Mac');

  useEffect(() => {
    if (isElectron && window.electronAPI) {
      window.electronAPI
        .getAppVersion()
        .then(setAppVersion)
        .catch(console.error);
    }
  }, [isElectron]);

  if (!isElectron) {
    return null;
  }

  return (
    <div
      className="toolbar-native flex h-11 items-center justify-between px-4"
      style={
        {
          WebkitAppRegion: 'drag',
          WebkitUserSelect: 'none'
        } as React.CSSProperties
      }
    >
      {/* macOS 交通灯按钮占位（左侧） */}
      {isMac && <div className="h-full w-16" />}

      <div className="flex items-center gap-2">
        <img src="/icon.svg" alt="Haibara Tools" className="h-5 w-5" />
        <span className="text-[13px] font-medium text-slate-700">
          Haibara Tools
        </span>
        {appVersion && (
          <span className="text-[11px] text-slate-400">v{appVersion}</span>
        )}
      </div>

      {/* 右侧占位保持居中 */}
      {isMac && <div className="h-full w-16" />}
    </div>
  );
}
