// 共享的 UI 组件类型定义
import type {
  ConvertCategory,
  FileFormat,
  TextFormat,
  ImageFormat,
  AudioFormat,
  VideoFormat
} from '@/types/convert';
import { FILE_TYPE_ICONS, CATEGORY_ICONS } from './icons';

// 重新导出服务端类型供组件使用
export type {
  ConvertCategory,
  FileFormat,
  TextFormat,
  ImageFormat,
  AudioFormat,
  VideoFormat
};

// UI 特定的类型定义
export interface PairItem {
  from: FileFormat;
  to: FileFormat;
}

export interface PairListProps {
  pairs: PairItem[];
  onPick: (pair: PairItem) => void;
  selectedPair?: PairItem | null;
  selectedSource: FileFormat | null;
  setSelectedSource: (source: FileFormat) => void;
}

export interface CategoryTabsProps {
  categories: ConvertCategory[];
  active: ConvertCategory;
  onChange: (key: ConvertCategory) => void;
}

export interface UploadDropzoneProps {
  acceptExtensions?: FileFormat[];
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  selectedConvertType?: PairItem;
}

export interface ProgressBarProps {
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'done' | 'error';
  fileName?: string;
}

// 文件类型配置
export interface FileTypeConfig {
  color: string;
  category: ConvertCategory;
}

// 类别配置
export interface CategoryConfig {
  gradient: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
}

// 类型安全的文件类型映射
export const FILE_TYPE_CONFIG: Record<FileFormat, FileTypeConfig> = {
  // 文本格式
  md: { color: 'from-blue-500 to-blue-600', category: 'text' },
  docx: { color: 'from-blue-600 to-indigo-600', category: 'text' },
  pdf: { color: 'from-red-500 to-red-600', category: 'text' },

  // 图片格式
  jpg: { color: 'from-purple-500 to-pink-500', category: 'image' },
  png: { color: 'from-purple-500 to-pink-500', category: 'image' },
  gif: { color: 'from-purple-600 to-pink-600', category: 'image' },
  webp: { color: 'from-purple-400 to-pink-400', category: 'image' },

  // 视频格式
  mp4: { color: 'from-orange-500 to-red-500', category: 'video' },
  avi: { color: 'from-orange-500 to-red-500', category: 'video' },
  mov: { color: 'from-orange-500 to-red-500', category: 'video' },
  mkv: { color: 'from-orange-500 to-red-500', category: 'video' },

  // 音频格式
  mp3: { color: 'from-green-500 to-emerald-500', category: 'audio' },
  wav: { color: 'from-green-500 to-emerald-500', category: 'audio' },
  flac: { color: 'from-green-500 to-emerald-500', category: 'audio' },
  aac: { color: 'from-green-500 to-emerald-500', category: 'audio' }
};

export const CATEGORY_CONFIG: Record<ConvertCategory, CategoryConfig> = {
  text: {
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700'
  },
  image: {
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700'
  },
  audio: {
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700'
  },
  video: {
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-50 to-red-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700'
  }
};

// 类型安全的工具函数（使用 lucide icon）
export function getFileTypeIcon(format: FileFormat) {
  return FILE_TYPE_ICONS[format] || FILE_TYPE_ICONS.md;
}

export function getFileTypeColor(format: FileFormat): string {
  return FILE_TYPE_CONFIG[format]?.color || 'from-gray-500 to-gray-600';
}

export function getFileTypeCategory(format: FileFormat): ConvertCategory {
  const config = FILE_TYPE_CONFIG[format];
  if (!config) {
    throw new Error(`Unknown file format: ${format}`);
  }
  return config.category;
}

export function getCategoryConfig(category: ConvertCategory): CategoryConfig {
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error(`Unknown category: ${category}`);
  }
  return config;
}

export function getCategoryIcon(category: ConvertCategory) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.text;
}

// 类型守卫函数
export function isValidFileFormat(format: string): format is FileFormat {
  return format in FILE_TYPE_CONFIG;
}

export function isValidCategory(category: string): category is ConvertCategory {
  return category in CATEGORY_CONFIG;
}

// 验证转换对是否有效
export function isValidConvertPair(pair: PairItem): boolean {
  if (!isValidFileFormat(pair.from) || !isValidFileFormat(pair.to)) {
    return false;
  }

  const fromCategory = getFileTypeCategory(pair.from);
  const toCategory = getFileTypeCategory(pair.to);

  return fromCategory === toCategory && pair.from !== pair.to;
}

// 获取类别支持的文件格式
export function getSupportedFormatsForCategory(
  category: ConvertCategory
): FileFormat[] {
  return Object.keys(FILE_TYPE_CONFIG).filter(
    (format) => FILE_TYPE_CONFIG[format as FileFormat].category === category
  ) as FileFormat[];
}

// 类型安全的转换对创建函数
export function createConvertPair(
  from: FileFormat,
  to: FileFormat
): PairItem | null {
  const pair: PairItem = { from, to };
  return isValidConvertPair(pair) ? pair : null;
}

// 批量验证转换对列表
export function validateConvertPairs(pairs: PairItem[]): PairItem[] {
  return pairs.filter(isValidConvertPair);
}
