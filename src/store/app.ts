// src/store/app.ts
import { create } from 'zustand';

interface AppState {
  isTaskRunning: boolean;
  setIsTaskRunning: (isRunning: boolean) => void;
  jobToLoadFromHistory: {
    bvId: string;
    audioPath: string;
    videoPath: string | null;
  } | null;
  setJobToLoadFromHistory: (
    job: {
      bvId: string;
      audioPath: string;
      videoPath: string | null;
    } | null
  ) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isTaskRunning: false,
  setIsTaskRunning: (isRunning) => set({ isTaskRunning: isRunning }),
  jobToLoadFromHistory: null,
  setJobToLoadFromHistory: (job) => set({ jobToLoadFromHistory: job })
}));
