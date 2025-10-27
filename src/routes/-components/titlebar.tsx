import { useEffect, useState } from 'react';
import { CONSTANT } from '@/data/constant';
import { useTranslation } from 'react-i18next';

export function Titlebar() {
  const [appVersion, setAppVersion] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (CONSTANT.IS_ELECTRON && window.electronAPI) {
      window.electronAPI
        .getAppVersion()
        .then(setAppVersion)
        .catch(console.error);
    }
  }, []);

  if (!CONSTANT.IS_ELECTRON) {
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
      {CONSTANT.IS_MAC && <div className="h-full w-16" />}

      <div className="flex items-center gap-2">
        <img src="/icon.svg" alt="Haibara Tools" className="h-5 w-5" />
        <span className="text-[13px] font-medium text-slate-700">
          {t('common.app_title')}
        </span>
        {appVersion && (
          <span className="text-[11px] text-slate-400">v{appVersion}</span>
        )}
      </div>

      {/* 右侧占位保持居中 */}
      {CONSTANT.IS_MAC && <div className="h-full w-16" />}
    </div>
  );
}
