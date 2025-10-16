import puppeteer, { type Browser as PuppeteerBrowser } from 'puppeteer-core';

let browserInstance: PuppeteerBrowser | null = null;

// Helper function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getBrowser = async (): Promise<PuppeteerBrowser> => {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  const maxRetries = 10;
  const retryDelay = 500; // ms

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[Puppeteer] Attempting to connect... (Attempt ${i + 1})`);
      browserInstance = await puppeteer.connect({
        browserURL: 'http://localhost:9222'
      });

      console.log('[Puppeteer] ✅ Browser connected successfully');

      browserInstance.on('disconnected', () => {
        console.log('[Puppeteer] Browser disconnected.');
        browserInstance = null;
      });

      return browserInstance;
    } catch {
      console.warn(
        `[Puppeteer] Connection attempt ${i + 1} failed. Retrying in ${
          retryDelay / 1000
        }s...`
      );
      if (i < maxRetries - 1) {
        await delay(retryDelay);
      } else {
        console.error(
          '[Puppeteer] ❌ Failed to connect to browser after multiple retries.'
        );
        throw new Error('Could not connect to browser.');
      }
    }
  }

  // This part should not be reachable due to the throw in the loop
  throw new Error('Could not connect to browser.');
};

export { getBrowser };
