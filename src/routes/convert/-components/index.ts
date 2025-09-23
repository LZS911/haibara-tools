// 统一导出所有组件和类型
export { CategoryTabs } from './CategoryTabs';
export { PairList } from './PairList';
export { UploadDropzone } from './UploadDropzone';
export { ProgressBar } from './ProgressBar';

// 导出所有类型
export type {
  ConvertCategory,
  FileFormat,
  TextFormat,
  ImageFormat,
  AudioFormat,
  VideoFormat,
  PairItem,
  PairListProps,
  CategoryTabsProps,
  UploadDropzoneProps,
  ProgressBarProps,
  FileTypeConfig,
  CategoryConfig
} from './types';

// 导出工具函数
export {
  getFileTypeIcon,
  getFileTypeColor,
  getFileTypeCategory,
  getCategoryConfig,
  getCategoryIcon,
  isValidFileFormat,
  isValidCategory,
  isValidConvertPair,
  getSupportedFormatsForCategory,
  createConvertPair,
  validateConvertPairs,
  FILE_TYPE_CONFIG,
  CATEGORY_CONFIG
} from './types';

// 导出图标组件
export {
  StepIcon,
  StatusIcon,
  FileTypeIcon,
  CategoryIcon,
  ConversionArrow,
  UploadCloud,
  LoadingSpinner,
  CheckMark,
  STEP_ICONS,
  STATUS_ICONS,
  FILE_TYPE_ICONS,
  CATEGORY_ICONS
} from './icons';
