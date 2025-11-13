import { Menu, Tray, nativeImage } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

interface StatusTrayOptions {
  assetsRoot: string;
  onToggleMainWindow: () => void;
  onQuit: () => void;
  isMainWindowVisible: () => boolean;
}

let statusTray: Tray | null = null;

function resolveTrayIcon(assetsRoot: string): string | undefined {
  const candidates = ['iconTemplate.png', 'icon.icns', 'icon.png'];

  for (const candidate of candidates) {
    const iconPath = path.join(assetsRoot, candidate);
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }

  return undefined;
}

function buildMenu({
  isMainWindowVisible,
  onQuit,
  onToggleMainWindow
}: StatusTrayOptions): Electron.Menu {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: isMainWindowVisible() ? '隐藏主窗口' : '显示主窗口',
      click: onToggleMainWindow
    },
    {
      label: '退出 Haibara Tools',
      click: onQuit
    }
  ];

  return Menu.buildFromTemplate(menuTemplate);
}

export function createStatusTray(options: StatusTrayOptions): void {
  if (process.platform !== 'darwin') {
    return;
  }

  if (statusTray) {
    return;
  }

  const iconPath = resolveTrayIcon(options.assetsRoot);
  if (!iconPath) {
    console.warn('[Electron] Tray icon not found, skipping status tray setup.');
    return;
  }

  const image = nativeImage.createFromPath(iconPath);
  image.setTemplateImage(true);

  statusTray = new Tray(image);
  statusTray.setToolTip('Haibara Tools');
  statusTray.setIgnoreDoubleClickEvents(true);
  statusTray.setContextMenu(buildMenu(options));

  statusTray.on('click', () => {
    options.onToggleMainWindow();
  });
}

export function updateStatusTray(options: StatusTrayOptions): void {
  if (!statusTray) {
    return;
  }

  statusTray.setContextMenu(buildMenu(options));
}

export function destroyStatusTray(): void {
  statusTray?.destroy();
  statusTray = null;
}
