import z from 'zod';

export type AiConvertStep =
  | 'input-bv-id'
  | 'select-style'
  | 'processing'
  | 'completed';

export type AiConvertStatus =
  | 'idle'
  | 'downloading'
  | 'transcribing'
  | 'generating'
  | 'done'
  | 'error';

export type ProgressStage =
  | 'downloading'
  | 'transcribing'
  | 'extracting-keyframes'
  | 'generating'
  | 'completed'
  | 'error';

export interface ProgressUpdate {
  jobId: string;
  stage: ProgressStage;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

export interface Keyframe {
  timestamp: number; // 秒
  imagePath: string; // 服务端路径
  imageUrl?: string; // 前端访问 URL
  text: string; // 该时间段对应的文字
}

export type SummaryStyle = z.infer<typeof SummaryStyleSchema>;

export const SummaryStyleSchema = z.enum([
  'note',
  'summary',
  'article',
  'mindmap',
  'social-media-post',
  'table'
]);

export const KeyframeStrategySchema = z.enum([
  'semantic',
  'uniform',
  'visual',
  'hybrid',
  'keyword'
]);

export type KeyframeStrategy = z.infer<typeof KeyframeStrategySchema>;
