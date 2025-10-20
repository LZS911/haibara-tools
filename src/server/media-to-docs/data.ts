import type { KeyframeStrategy, SummaryStyle } from '@/types/media-to-docs';

export const STYLES: { id: SummaryStyle; name: string }[] = [
  { id: 'note', name: '结构笔记' },
  { id: 'summary', name: '内容摘要' },
  { id: 'article', name: '自媒体文章' },
  { id: 'mindmap', name: '思维导图' },
  { id: 'social-media-post', name: '社交媒体帖子' },
  { id: 'table', name: '信息表格' }
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
