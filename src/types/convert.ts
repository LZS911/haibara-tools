import path from 'node:path';

export type ConvertCategory = 'video' | 'text' | 'image' | 'audio';

// 定义各类别支持的格式
export type TextFormat = 'md' | 'docx' | 'pdf';
export type ImageFormat = 'jpg' | 'png' | 'webp';
export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac';
export type VideoFormat = 'mp4' | 'avi' | 'mov' | 'mkv' | 'gif';

export type FileFormat = TextFormat | ImageFormat | AudioFormat | VideoFormat;

// 类型安全的转换类型定义
export interface ConvertType<T extends FileFormat = FileFormat> {
  from: T;
  to: T;
}

// 分类别的转换类型
export type TextConvertType = ConvertType<TextFormat>;
export type ImageConvertType = ConvertType<ImageFormat>;
export type AudioConvertType = ConvertType<AudioFormat>;
export type VideoConvertType = ConvertType<VideoFormat>;

// 支持的转换类型映射
export interface SupportConvertType {
  text: TextConvertType[];
  image: ImageConvertType[];
  audio: AudioConvertType[];
  video: VideoConvertType[];
}

export type JobStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

export interface ConvertJobMeta {
  id: string;
  category: ConvertCategory;
  from: FileFormat;
  to: FileFormat;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  inputFileName?: string;
  outputFileName?: string;
  errorMessage?: string;
}

// 类型守卫函数
export const isTextFormat = (format: string): format is TextFormat => {
  return ['md', 'docx', 'pdf'].includes(format);
};

export const isImageFormat = (format: string): format is ImageFormat => {
  return ['jpg', 'png', 'webp'].includes(format);
};

export const isAudioFormat = (format: string): format is AudioFormat => {
  return ['mp3', 'wav', 'flac', 'aac'].includes(format);
};

export const isVideoFormat = (format: string): format is VideoFormat => {
  return ['mp4', 'avi', 'mov', 'mkv', 'gif'].includes(format);
};

export const getFormatCategory = (format: FileFormat): ConvertCategory => {
  if (isTextFormat(format)) return 'text';
  if (isImageFormat(format)) return 'image';
  if (isAudioFormat(format)) return 'audio';
  if (isVideoFormat(format)) return 'video';
  throw new Error(`Unknown format: ${format}`);
};

// 验证转换类型是否有效
export const isValidConvertType = (
  category: ConvertCategory,
  from: FileFormat,
  to: FileFormat
): boolean => {
  const fromCategory = getFormatCategory(from);
  const toCategory = getFormatCategory(to);
  return (
    category === fromCategory && fromCategory === toCategory && from !== to
  );
};

export const EXT_TO_MIME: Record<string, string> = {
  // Text formats
  md: 'text/markdown; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
  // Image formats
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  // Audio formats
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  aac: 'audio/aac',
  // Video formats
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska'
};

export function getMimeByExt(ext: string): string {
  const key = ext.replace(/^\./, '').toLowerCase();
  return EXT_TO_MIME[key] ?? 'application/octet-stream';
}

export function sanitizeFileName(fileName: string): string {
  // Remove any path components and disallow control chars
  const base = path.basename(fileName);
  return base.replace(/[\r\n\t]/g, '_');
}

export function getMaxSizeBytesForExt(ext: string): number {
  const key = ext.replace(/^\./, '').toLowerCase();
  const mb = (size: number) => size * 1024 * 1024;
  switch (key) {
    case 'md': {
      const env = process.env.MD_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 5);
    }
    case 'docx': {
      const env = process.env.DOC_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 30);
    }
    case 'pdf': {
      const env = process.env.PDF_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 30);
    }
    // Image formats
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp': {
      const env = process.env.IMAGE_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 20);
    }
    // Audio formats
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac': {
      const env = process.env.AUDIO_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 50); // 音频文件通常较大
    }
    // Video formats
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'gif':
    case 'mkv': {
      const env = process.env.VIDEO_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 200); // 视频文件通常很大
    }
    default: {
      const env = process.env.DEFAULT_MAX_FILE_SIZE_MB;
      return mb(env ? Number(env) : 30);
    }
  }
}
