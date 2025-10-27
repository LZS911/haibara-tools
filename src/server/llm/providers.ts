import type { AppConfig } from '../../electron';
import type { LLMProvider } from '@/types/llm';

export const LLM_PROVIDERS: {
  id: LLMProvider;
  name: string;
  description?: string;
  apiKeyField: keyof AppConfig;
  modelNameField: keyof AppConfig;
  defaultModel?: string;
}[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 等模型',
    apiKeyField: 'OPENAI_API_KEY',
    modelNameField: 'OPENAI_MODEL_NAME',
    defaultModel: 'gpt-4o'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '中文优化，性价比高',
    apiKeyField: 'DEEPSEEK_API_KEY',
    modelNameField: 'DEEPSEEK_MODEL_NAME',
    defaultModel: 'deepseek-chat'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: '有免费额度，适合开发测试',
    apiKeyField: 'GEMINI_API_KEY',
    modelNameField: 'GEMINI_MODEL_NAME',
    defaultModel: 'gemini-1.5-flash'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: '统一访问多个模型',
    apiKeyField: 'OPENROUTER_API_KEY',
    modelNameField: 'OPENROUTER_MODEL_NAME',
    defaultModel: 'anthropic/claude-3.5-sonnet'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: '超快推理速度',
    apiKeyField: 'GROQ_API_KEY',
    modelNameField: 'GROQ_MODEL_NAME',
    defaultModel: 'llama3-70b-8192'
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: '企业级 AI',
    apiKeyField: 'COHERE_API_KEY',
    modelNameField: 'COHERE_MODEL_NAME',
    defaultModel: 'command-r-plus'
  }
];

export const VISION_PROVIDERS: LLMProvider[] = [
  'openai',
  'anthropic',
  'gemini'
];
