import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import reportWebVitals from '@/reportWebVitals';
import { createRouter } from '@/router';

import '@/styles.css';
import '@/locales';
import '@/electron.d';

// 异步初始化应用
async function initApp() {
  // 在 Electron 环境下，等待获取服务器端口
  if (window.electronAPI?.isElectron) {
    try {
      const serverPort = await window.electronAPI.getServerPort();
      console.log('[App] Running in Electron mode, server port:', serverPort);
    } catch (error) {
      console.error('[App] Failed to get server port:', error);
    }
  }

  // Create a new router instance
  const router = createRouter();

  // Render the app
  const rootElement = document.getElementById('app');
  if (rootElement && !rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  }

  // If you want to start measuring performance in your app, pass a function
  // to log results (for example: reportWebVitals(console.log))
  // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
  reportWebVitals();
}

// 启动应用
initApp().catch((error) => {
  console.error('[App] Failed to initialize:', error);
});
