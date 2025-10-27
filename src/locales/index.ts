import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { SupportLanguage } from './types';
import zhCN from './zh-CN';
import enUS from './en-US';

const resources: Record<
  SupportLanguage,
  Record<'translation', Record<string, Record<string, string>>>
> = {
  en: enUS,
  zh: zhCN
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('i18nextLng') || 'zh',
  fallbackLng: 'zh',
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false,
    skipOnVariables: false
  },

  detection: {
    order: ['navigator', 'localStorage', 'cookie', 'htmlTag'],
    caches: ['localStorage', 'cookie'],
    lookupLocalStorage: 'i18nextLng',
    lookupCookie: 'i18next'
  }
});
