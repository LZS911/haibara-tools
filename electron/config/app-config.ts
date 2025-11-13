import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { AppConfig } from '../../src/electron.d';

function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'config.json');
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath();

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(content) as AppConfig;
    }
  } catch (error) {
    console.error('[Electron] Failed to load config:', error);
  }

  return {};
}

export function saveConfig(config: AppConfig): void {
  const configPath = getConfigPath();

  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('[Electron] Config saved to:', configPath);
  } catch (error) {
    console.error('[Electron] Failed to save config:', error);
    throw error;
  }
}
