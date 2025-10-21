import z from 'zod';

export const LLMProviderSchema = z.enum([
  'openai',
  'deepseek',
  'gemini',
  'anthropic',
  'openrouter',
  'groq',
  'cohere'
]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;
