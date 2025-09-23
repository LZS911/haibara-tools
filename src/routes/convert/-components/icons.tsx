import {
  Target,
  Upload,
  Zap,
  CheckCircle,
  PartyPopper,
  XCircle,
  ArrowLeftRight,
  RotateCw,
  Settings,
  Clock,
  Check,
  FileText,
  BookOpen,
  Image,
  Film,
  Video,
  Music,
  Search,
  AlertCircle,
  CloudUpload,
  Loader2,
  FolderUp,
  CheckCircle2,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/routes/-lib/utils';
import { type FileFormat, type ConvertCategory } from './types';

// Icon 组件的通用属性
interface IconProps {
  className?: string;
  size?: number;
}

// 流程步骤图标映射
export const STEP_ICONS = {
  selectType: Target,
  uploadFile: FolderUp,
  converting: Zap,
  completed: CheckCircle,
  celebration: PartyPopper,
  error: XCircle,
  conversion: ArrowLeftRight,
  converting_alt: RotateCw
} as const;

// 状态图标映射
export const STATUS_ICONS = {
  uploading: Upload,
  processing: Settings,
  done: CheckCircle2,
  error: XCircle,
  idle: Clock,
  check: Check,
  search: Search,
  info: AlertCircle,
  cloudUpload: CloudUpload,
  loading: Loader2
} as const;

// 文件类型图标映射
export const FILE_TYPE_ICONS: Record<FileFormat, LucideIcon> = {
  // 文本格式
  md: FileText,
  docx: FileText,
  pdf: BookOpen,

  // 图片格式
  jpg: Image,
  png: Image,
  gif: Film,
  webp: Image,

  // 视频格式
  mp4: Video,
  avi: Video,
  mov: Video,
  mkv: Video,

  // 音频格式
  mp3: Music,
  wav: Music,
  flac: Music,
  aac: Music
};

// 类别图标映射
export const CATEGORY_ICONS: Record<ConvertCategory, LucideIcon> = {
  text: FileText,
  image: Image,
  audio: Music,
  video: Video
};

// 预定义的图标组件
export function StepIcon({
  step,
  className,
  size = 20
}: IconProps & {
  step: keyof typeof STEP_ICONS;
}) {
  const Icon = STEP_ICONS[step];
  return <Icon className={cn('', className)} size={size} />;
}

export function StatusIcon({
  status,
  className,
  size = 20
}: IconProps & {
  status: keyof typeof STATUS_ICONS;
}) {
  const Icon = STATUS_ICONS[status];
  return <Icon className={cn('', className)} size={size} />;
}

export function FileTypeIcon({
  type,
  className,
  size = 20
}: IconProps & {
  type: FileFormat;
}) {
  const Icon = FILE_TYPE_ICONS[type];
  return <Icon className={cn('', className)} size={size} />;
}

export function CategoryIcon({
  category,
  className,
  size = 20
}: IconProps & {
  category: ConvertCategory;
}) {
  const Icon = CATEGORY_ICONS[category];
  return <Icon className={cn('', className)} size={size} />;
}

// 转换箭头图标组件
export function ConversionArrow({ className, size = 20 }: IconProps) {
  return (
    <ArrowLeftRight
      className={cn('transition-colors duration-300', className)}
      size={size}
    />
  );
}

// 上传云图标组件
export function UploadCloud({ className, size = 40 }: IconProps) {
  return (
    <CloudUpload
      className={cn('transition-colors duration-300', className)}
      size={size}
    />
  );
}

// 加载动画图标组件
export function LoadingSpinner({ className, size = 20 }: IconProps) {
  return <Loader2 className={cn('animate-spin', className)} size={size} />;
}

// 选中检查图标组件
export function CheckMark({ className, size = 12 }: IconProps) {
  return <Check className={cn('', className)} size={size} />;
}

// 工具函数：获取文件类型图标
export function getFileTypeIcon(format: FileFormat): LucideIcon {
  return FILE_TYPE_ICONS[format] || FileText;
}

// 工具函数：获取类别图标
export function getCategoryIcon(category: ConvertCategory): LucideIcon {
  return CATEGORY_ICONS[category] || FileText;
}
