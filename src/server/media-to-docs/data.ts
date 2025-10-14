import type {
  SummaryStyle,
  LLMProvider
} from '@/routes/media-to-docs/-types';

export const STYLES: { id: SummaryStyle; name: string }[] = [
  { id: 'note', name: '结构笔记' },
  { id: 'summary', name: '内容摘要' },
  { id: 'article', name: '自媒体文章' },
  { id: 'mindmap', name: '思维导图' },
  { id: 'social-media-post', name: '社交媒体帖子' },
  { id: 'table', name: '信息表格' }
];

export const PROVIDERS: {
  id: LLMProvider;
  name: string;
  description?: string;
}[] = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4 - 高质量通用模型' },
  { id: 'deepseek', name: 'DeepSeek', description: '中文优化，性价比高' },
  { id: 'gemini', name: 'Gemini', description: 'Google - 免费大额度' },
  { id: 'anthropic', name: 'Claude', description: '长上下文，高质量' },
  { id: 'openrouter', name: 'OpenRouter', description: '统一访问多模型' },
  { id: 'groq', name: 'Groq', description: '超快推理速度' },
  { id: 'cohere', name: 'Cohere', description: '企业级 AI' }
];
