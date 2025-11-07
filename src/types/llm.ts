import z from 'zod';

export const LLMProviderSchema = z.enum([
  'openai',
  'deepseek',
  'gemini',
  'anthropic',
  'openrouter',
  'groq',
  'cohere',
  'doubao',
  'ollama'
]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

export const PRActivitySchema = z.object({
  id: z.number(),
  title: z.string(),
  html_url: z.string(),
  user: z.object({
    login: z.string()
  }),
  created_at: z.string(),
  closed_at: z.string().nullable()
});

export type PRActivity = z.infer<typeof PRActivitySchema>;
