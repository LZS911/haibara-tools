import type {
  KeyframeStrategy,
  SummaryStyle,
  AsrEngine
} from '@/types/media-to-docs';

export const STYLES: { id: SummaryStyle; name: string }[] = [
  { id: 'note', name: '结构笔记' },
  { id: 'summary', name: '内容摘要' },
  { id: 'article', name: '自媒体文章' },
  { id: 'mindmap', name: '思维导图' },
  { id: 'social-media-post', name: '社交媒体帖子' },
  { id: 'table', name: '信息表格' }
];

export const ASR_ENGINES: {
  id: AsrEngine;
  name: string;
  description: string;
}[] = [
  {
    id: 'whisper',
    name: 'Whisper',
    description: '本地模型，无需联网，首次使用会自动下载模型'
  },
  {
    id: 'volcano',
    name: '火山引擎',
    description: '在线 ASR 服务，需要配置 API 密钥'
  }
];

export const KEYFRAME_STRATEGIES: {
  value: KeyframeStrategy;
  label: string;
  hint: string;
}[] = [
  {
    value: 'semantic',
    label: '智能分析',
    hint: '基于语音和语义，自动选择信息量最高的画面'
  },
  {
    value: 'keyword',
    label: '关键字匹配',
    hint: '基于 ASR 结果匹配关键字，精准提取相关画面'
  },
  {
    value: 'uniform',
    label: '均匀采样',
    hint: '按固定时间间隔截图，适合风景或无对话视频'
  },
  {
    value: 'visual',
    label: '视觉分析',
    hint: '基于视觉，自动选择信息量最高的画面'
  },
  {
    value: 'hybrid',
    label: '混合分析',
    hint: '基于语音和视觉，自动选择信息量最高的画面'
  }
];
