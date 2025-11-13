import { app } from 'electron';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

interface StartServerOptions {
  startPort?: number;
  appRoot: string;
  serverEntry: string;
}

async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('node:net');

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const port = (server.address() as { port: number }).port;
      server.close(() => resolve(port));
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(error);
      }
    });
  });
}

export async function startServer({
  startPort = 3000,
  appRoot,
  serverEntry
}: StartServerOptions): Promise<number> {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`Server file not found at: ${serverEntry}`);
  }

  const availablePort = await findAvailablePort(startPort);

  process.env.USER_DATA_PATH = userDataPath;
  process.env.IS_PACKAGED = String(app.isPackaged);

  const serverModule = await import(pathToFileURL(serverEntry).href);
  const { app: expressApp } = await serverModule.createServer(appRoot, true);

  return new Promise<number>((resolve, reject) => {
    const server = expressApp.listen(availablePort, () => {
      console.log(
        `[Electron] ✅ Express server running on port ${availablePort}`
      );
      resolve(availablePort);
    });

    server.on('error', (error: Error) => {
      console.error('[Electron] ❌ Server error:', error);
      reject(error);
    });
  });
}
