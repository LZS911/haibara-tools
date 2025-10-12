// src/store/app.ts
import { create } from 'zustand';

interface AppState {
  isTaskRunning: boolean;
  setIsTaskRunning: (isRunning: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isTaskRunning: false,
  setIsTaskRunning: (isRunning) => set({ isTaskRunning: isRunning }),
}));
