import fs from 'fs';
import path from 'path';
import type { AppConfig } from '../../electron.d';

let cachedConfig: AppConfig | null = null;

export function getUserDataPath(): string | null {
  // For packaged app (production), Electron sets this env var.
  if (process.env.IS_PACKAGED === 'true') {
    return process.env.USER_DATA_PATH || null;
  }

  // For development, Electron writes a context file.
  try {
    const contextPath = path.join(
      process.cwd(),
      'tmp',
      'electron-context.json'
    );
    if (fs.existsSync(contextPath)) {
      const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      return context.userDataPath || null;
    }
  } catch (error) {
    console.warn(
      '[Config] Could not read dev context for userDataPath. This is normal if not in Electron dev environment.',
      error
    );
  }

  return null;
}

function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const userDataPath = getUserDataPath();

  // If userDataPath is available, we are in an Electron context.
  if (userDataPath) {
    const configPath = path.join(userDataPath, 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        cachedConfig = JSON.parse(content) as AppConfig;
        console.log('[Config] Loaded config from', configPath);
        return cachedConfig!;
      } catch (error) {
        console.error(
          `[Config] Failed to load or parse config.json from ${configPath}:`,
          error
        );
      }
    }
  }

  // Fallback for non-Electron environment or if config file is missing/invalid.
  console.log('[Config] Using fallback to environment variables for config.');
  cachedConfig = {
    VOLC_APP_ID: process.env.VOLC_APP_ID,
    VOLC_ACCESS_TOKEN: process.env.VOLC_ACCESS_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL_NAME: process.env.OPENAI_MODEL_NAME,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_MODEL_NAME: process.env.DEEPSEEK_MODEL_NAME,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL_NAME: process.env.GEMINI_MODEL_NAME,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL_NAME: process.env.ANTHROPIC_MODEL_NAME,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL_NAME: process.env.OPENROUTER_MODEL_NAME,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL_NAME: process.env.GROQ_MODEL_NAME,
    COHERE_API_KEY: process.env.COHERE_API_KEY,
    COHERE_MODEL_NAME: process.env.COHERE_MODEL_NAME,
    BILIBILI_SESSDATA: process.env.BILIBILI_SESSDATA,
    BILIBILI_BFE_ID: process.env.BILIBILI_BFE_ID,
    BILIBILI_DOWNLOAD_PATH: process.env.BILIBILI_DOWNLOAD_PATH,
    BILIBILI_IS_DANMAKU: process.env.BILIBILI_IS_DANMAKU
      ? process.env.BILIBILI_IS_DANMAKU === String(true)
      : undefined,
    BILIBILI_IS_COVER: process.env.BILIBILI_IS_COVER
      ? process.env.BILIBILI_IS_COVER === String(true)
      : undefined,
    BILIBILI_IS_SUBTITLE: process.env.BILIBILI_IS_SUBTITLE
      ? process.env.BILIBILI_IS_SUBTITLE === String(true)
      : undefined,
    BILIBILI_IS_FOLDER: process.env.BILIBILI_IS_FOLDER
      ? process.env.BILIBILI_IS_FOLDER === String(true)
      : undefined,
    BILIBILI_DOWNLOADING_MAX_SIZE: process.env.BILIBILI_DOWNLOADING_MAX_SIZE
      ? parseInt(process.env.BILIBILI_DOWNLOADING_MAX_SIZE, 10)
      : undefined
  };

  return cachedConfig;
}

/**
 * Gets the application configuration.
 * In an Electron environment, it reads from the user's config.json.
 * Otherwise, it falls back to environment variables.
 * @returns {AppConfig} The application configuration.
 */
export function getConfig(): AppConfig {
  return loadConfig();
}
