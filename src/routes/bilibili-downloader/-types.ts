export interface DownloadTask {
  id: string;
  bvId: string;
  title: string;
  quality: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  videoPath?: string;
  audioPath?: string;
  mergedPath?: string;
  coverPath?: string;
  createdAt: number;
  totalSize?: number;
  downloadedSize?: number;
}

export interface DownloadHistoryItem {
  id: string;
  bvId: string;
  title: string;
  quality: number;
  videoPath?: string;
  audioPath?: string;
  mergedPath?: string;
  coverPath?: string;
  downloadedAt: number;
}

export interface Page {
  title: string;
  url: string;
  bvid: string;
  cid: number;
  duration: string;
  page: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  url: string;
  bvid: string;
  cid: number;
  cover: string;
  view: number;
  danmaku: number;
  reply: number;
  duration: string;
  up: Array<{ name: string; mid: number }>;
  qualityOptions: Array<{ label: string; value: number }>;
  page: Page[];
}

export interface DownloadOptions {
  quality: number;
  isMerge: boolean;
  isDelete: boolean;
  downloadPath?: string;
}
