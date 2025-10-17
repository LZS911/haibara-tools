import url from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import type { BuildEnvironmentOptions } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Client Build Configuration
const clientBuildConfig: BuildEnvironmentOptions = {
  outDir: 'dist/client',
  emitAssets: true,
  copyPublicDir: true,
  emptyOutDir: true,
  sourcemap: false
};

// Server Build Configuration
const serverBuildConfig: BuildEnvironmentOptions = {
  ssr: true,
  outDir: 'dist/server',
  copyPublicDir: false,
  emptyOutDir: true,
  sourcemap: false,
  rollupOptions: {
    input: path.resolve(__dirname, 'src/server/server.ts'),
    output: {
      entryFileNames: '[name].cjs', // 使用 .cjs 扩展名，与 Electron main.cjs 保持一致
      format: 'cjs', // 使用 CommonJS 格式
      chunkFileNames: 'assets/[name]-[hash].cjs',
      assetFileNames: 'assets/[name]-[hash][extname]'
    }
  }
};

// Electron Build Configuration
const electronBuildConfig: BuildEnvironmentOptions = {
  ssr: true,
  outDir: 'dist/electron',
  copyPublicDir: false,
  emptyOutDir: true,
  sourcemap: false,
  rollupOptions: {
    input: {
      main: path.resolve(__dirname, 'electron/main.ts'),
      preload: path.resolve(__dirname, 'electron/preload.ts')
    },
    output: {
      // 所有 Electron 文件使用 .cjs 扩展名（CommonJS 格式）
      // 因为 package.json 有 "type": "module"，.js 文件会被当作 ES 模块
      entryFileNames: '[name].cjs',
      format: 'cjs',
      chunkFileNames: 'assets/[name]-[hash].cjs',
      assetFileNames: 'assets/[name]-[hash][extname]'
    },
    external: [
      'electron',
      'electron-updater',
      // Node.js 内置模块
      'node:path',
      'node:url',
      'node:fs',
      'node:net',
      // 服务端依赖（已打包在 dist/server）
      /^\.\.\/dist\/server/
    ]
  }
};

// https://vitejs.dev/config/
export default defineConfig((configEnv) => {
  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true
      }),
      tailwindcss(),
      react(),
      process.env.ANALYZE === 'true' &&
        visualizer({
          open: false,
          filename: 'stats.html',
          gzipSize: true,
          brotliSize: true
        })
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },

    server: {
      host: true,
      proxy: {
        '/trpc': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build:
      configEnv.mode === 'server'
        ? serverBuildConfig
        : configEnv.mode === 'electron'
          ? electronBuildConfig
          : clientBuildConfig
  };
});
