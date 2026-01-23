import 'dotenv/config';
import path from 'node:path';
import url from 'node:url';
import * as fs from 'node:fs';
import express from 'express';
import { trpcMiddleWare } from './trpc';
import { getMediaRoot } from './routers/media-to-docs/cache';
import { getTtsRoot, getVoiceCloningRoot } from './routers/voice-cloning/data';

const PORT =
  typeof process.env.PORT !== 'undefined'
    ? parseInt(process.env.PORT, 10)
    : 3000;
const HMR_PORT =
  typeof process.env.HMR_PORT !== 'undefined'
    ? parseInt(process.env.HMR_PORT, 10)
    : 3001;

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITE_TEST_BUILD;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createServer = async (
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production'
) => {
  console.log('[Server] Creating server...');
  console.log('[Server] Root:', root);
  console.log('[Server] isProd:', isProd);
  console.log('[Server] __dirname:', __dirname);
  console.log('[Server] USER_DATA_PATH:', process.env.USER_DATA_PATH);

  const app = express();

  app.use('/trpc', trpcMiddleWare);

  // Serve media files (audio, video, keyframes) for media-to-docs service
  // 动态获取路径，确保在运行时使用正确的 userData 路径
  app.use('/media-files', (req, res, next) => {
    console.log('[Server] Serving media files from:', getMediaRoot());
    express.static(getMediaRoot())(req, res, next);
  });

  // Serve voice cloning TTS audio files
  app.use('/voice-cloning-files/tts', (req, res, next) => {
    console.log('[Server] Serving TTS files from:', getTtsRoot());
    express.static(getTtsRoot())(req, res, next);
  });

  // Serve voice cloning training files
  app.use('/voice-cloning-files', (req, res, next) => {
    console.log(
      '[Server] Serving voice cloning files from:',
      getVoiceCloningRoot()
    );
    express.static(getVoiceCloningRoot())(req, res, next);
  });

  if (!isProd) {
    console.log('[Server] Setting up development mode with Vite...');
    const vite = await import('vite');
    const viteServer = await vite.createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        host: true,
        middlewareMode: true,
        watch: {
          ignored: ['**/src/server/**']
        },
        hmr: {
          port: HMR_PORT
        }
      },
      appType: 'custom'
    });

    // Use vite's connect instance as middleware
    app.use(viteServer.middlewares);

    // Handle any requests that don't match an API route by serving the React app's index.html
    app.get(/(.*)/, async (req, res, next) => {
      try {
        let html = fs.readFileSync(path.resolve(root, 'index.html'), 'utf-8');
        html = await viteServer.transformIndexHtml(req.url, html);

        res.send(html);
      } catch (e) {
        return next(e);
      }
    });

    console.log('[Server] ✅ Development server configured');
    return { app };
  } else {
    console.log('[Server] Setting up production mode...');

    // 在生产模式下，静态文件在 root/dist/client
    const clientPath = path.resolve(root, 'dist/client');
    console.log('[Server] Client path:', clientPath);
    console.log('[Server] Client path exists:', fs.existsSync(clientPath));

    if (!fs.existsSync(clientPath)) {
      console.error('[Server] ❌ Client path does not exist!');
      throw new Error(`Client files not found at: ${clientPath}`);
    }

    // 列出客户端目录内容以便调试
    try {
      const files = fs.readdirSync(clientPath);
      console.log('[Server] Client directory contents:', files);
    } catch (error) {
      console.error('[Server] Failed to read client directory:', error);
    }

    app.use(express.static(clientPath));
    console.log('[Server] Static files middleware configured');

    // Handle any requests that don't match an API route by serving the React app's index.html
    app.get(/(.*)/, (_req, res) => {
      const indexPath = path.resolve(clientPath, 'index.html');
      console.log('[Server] Serving index.html from:', indexPath);
      console.log('[Server] Index.html exists:', fs.existsSync(indexPath));
      res.sendFile(indexPath);
    });

    console.log('[Server] ✅ Production server configured');
  }

  console.log('[Server] ✅ Server created successfully');
  return { app };
};

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(PORT, () => {
      console.info(`Server available at: http://localhost:${PORT}`);
    })
  );
}
