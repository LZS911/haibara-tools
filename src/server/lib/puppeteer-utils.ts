import puppeteer, { Browser as PuppeteerBrowser } from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';
import {
  install,
  Browser,
  computeExecutablePath,
  canDownload
} from '@puppeteer/browsers';

// Use a directory within the project or user data for storing Chromium
// In Electron, use USER_DATA_PATH if available
const getChromiumPath = () => {
  const baseDir = process.env.USER_DATA_PATH || process.cwd();
  return path.join(baseDir, '.local-chromium');
};

let browserInstance: PuppeteerBrowser | null = null;

const getBrowser = async (): Promise<PuppeteerBrowser> => {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const chromiumPath = getChromiumPath();

  if (!fs.existsSync(chromiumPath)) {
    console.log('[Puppeteer] Creating chromium directory:', chromiumPath);
    fs.mkdirSync(chromiumPath, { recursive: true });
  }

  const browser = Browser.CHROMIUM;
  // Use a newer build that supports Apple Silicon (arm64)
  // Chrome 120+ has better arm64 support
  const buildId = '131.0.6778.85';

  console.log('[Puppeteer] Computing executable path...');
  console.log('[Puppeteer] Browser:', browser);
  console.log('[Puppeteer] Build ID:', buildId);
  console.log('[Puppeteer] Cache dir:', chromiumPath);
  console.log('[Puppeteer] Platform:', process.platform);
  console.log('[Puppeteer] Arch:', process.arch);

  const executablePath = computeExecutablePath({
    browser,
    buildId,
    cacheDir: chromiumPath
  });

  console.log('[Puppeteer] Executable path:', executablePath);
  console.log('[Puppeteer] Executable exists:', fs.existsSync(executablePath));

  if (!fs.existsSync(executablePath)) {
    try {
      console.log('[Puppeteer] Checking if build can be downloaded...');
      const isDownloadable = await canDownload({
        browser,
        buildId,
        cacheDir: chromiumPath
      });
      console.log('[Puppeteer] Is downloadable:', isDownloadable);

      if (isDownloadable) {
        console.log('[Puppeteer] Downloading Chromium...');
        await install({
          browser,
          buildId,
          cacheDir: chromiumPath,
          downloadProgressCallback: (
            downloadedBytes: number,
            totalBytes: number
          ) => {
            const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            console.log(
              `[Puppeteer] Download progress: ${percent}% (${downloadedBytes}/${totalBytes})`
            );
          }
        });
        console.log('[Puppeteer] ✅ Chromium downloaded successfully');
      } else {
        throw new Error(
          `Chromium build ${buildId} is not available for download.`
        );
      }
    } catch (error) {
      console.error('[Puppeteer] ❌ Failed to download Chromium:', error);
      if (error instanceof Error) {
        throw new Error(`Could not download browser: ${error.message}`);
      }
      throw new Error('Could not download browser.');
    }
  }

  console.log('[Puppeteer] Launching browser...');
  browserInstance = await puppeteer.launch({
    executablePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });
  console.log('[Puppeteer] ✅ Browser launched successfully');

  browserInstance.on('disconnected', () => {
    browserInstance = null;
  });

  return browserInstance;
};

export { getBrowser };
