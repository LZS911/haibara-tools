export enum TrainingStatusEnum {
  NotFound,
  Training,
  Success,
  Failed,
  Active
}

export interface TrainingStatus {
  status: TrainingStatusEnum;
  progress?: number;
  message?: string;
  speakerId: string;
}

export interface UploadAudioRequest {
  audioPath: string;
  speakerId: string;
}

export interface UploadAudioResponse {
  success: boolean;
  speakerId: string;
  message?: string;
}

export interface DownloadBvAudioRequest {
  bvIdOrUrl: string;
  jobId?: string;
}

export interface DownloadBvAudioResponse {
  success: boolean;
  audioPath: string | null;
  title?: string;
  jobId: string;
  fromCache?: boolean;
}

// 进度相关类型
export type ProgressStage = 'downloading' | 'completed' | 'error';

export interface ProgressUpdate {
  jobId: string;
  stage: ProgressStage;
  progress: number; // 0-100
  message?: string;
  error?: string;
}

// 语音合成相关类型
export interface SynthesizeSpeechRequest {
  text: string;
  speakerId: string;
}

export interface SynthesizeSpeechResponse {
  success: boolean;
  audioPath: string;
  audioUrl: string;
}

export interface SynthesisRecord {
  id: string;
  speakerId: string;
  text: string;
  audioUrl: string;
  audioPath: string;
  createdAt: string;
}

// 音色 ID 类型
export interface Speaker {
  id: string;
  name: string;
  createdAt: string;
}

export interface SpeakerWithStatus extends Speaker {
  status?: TrainingStatusEnum;
}

// 训练记录类型
export interface TrainingRecord {
  speakerId: string;
  bvId: string;
  title: string;
  audioPath: string;
  status: TrainingStatusEnum;
  createdAt: string;
  completedAt?: string;
}
