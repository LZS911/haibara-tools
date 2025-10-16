export const CONSTANT = {
  IS_ELECTRON: typeof window !== 'undefined' && window.electronAPI?.isElectron,
  IS_DEV: process.env.NODE_ENV === 'development',
  IS_MAC:
    typeof window !== 'undefined' && window.navigator.platform.includes('Mac')
};
