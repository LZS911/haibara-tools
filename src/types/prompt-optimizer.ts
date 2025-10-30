import z from 'zod';
import { LLMProviderSchema } from '@/types/llm';

export const TemplateLanguageSchema = z.enum(['chinese', 'english']);
export type TemplateLanguage = z.infer<typeof TemplateLanguageSchema>;

export interface CompiledPrompt {
  system: string;
  user: string;
}

// 基础枚举 Schema
export const PromptTypeSchema = z.enum([
  'creative',
  'analysis',
  'code',
  'qa',
  'translation',
  'summarization',
  'brainstorming',
  'other'
]);
export type PromptType = z.infer<typeof PromptTypeSchema>;

export const OptimizationLevelSchema = z.enum([
  'minimal',
  'standard',
  'aggressive'
]);
export type OptimizationLevel = z.infer<typeof OptimizationLevelSchema>;

export const LanguageStyleSchema = z.enum([
  'professional',
  'casual',
  'technical',
  'creative'
]);
export type LanguageStyle = z.infer<typeof LanguageStyleSchema>;

export const OutputFormatSchema = z.enum(['text', 'structured', 'markdown']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

export const TemplateTypeSchema = z.enum(['text', 'context', 'image']);
export type TemplateType = z.infer<typeof TemplateTypeSchema>;

export const ImageToolSchema = z.enum([
  'stable-diffusion',
  'midjourney',
  'dall-e',
  'other'
]);
export type ImageTool = z.infer<typeof ImageToolSchema>;

// --- 新增：优化选项的 Schema ---
export const OptimizationOptionSchema = z.object({
  value: z.string(),
  nameKey: z.string(),
  descriptionKey: z.string()
});
export type OptimizationOption = z.infer<typeof OptimizationOptionSchema>;

export const AllOptimizationOptionsSchema = z.object({
  promptTypes: z.array(OptimizationOptionSchema),
  optimizationLevels: z.array(OptimizationOptionSchema),
  languageStyles: z.array(OptimizationOptionSchema),
  outputFormats: z.array(OptimizationOptionSchema),
  languages: z.array(
    z.object({ value: TemplateLanguageSchema, label: z.string() })
  )
});
export type AllOptimizationOptions = z.infer<
  typeof AllOptimizationOptionsSchema
>;

// 请求与响应 Schema
export const OptimizationRequestSchema = z.object({
  originalPrompt: z.string().min(10).max(5000),
  promptType: PromptTypeSchema,
  optimizationLevel: OptimizationLevelSchema,
  languageStyle: LanguageStyleSchema,
  outputFormat: OutputFormatSchema,
  provider: LLMProviderSchema,
  language: TemplateLanguageSchema,

  // 模板系统扩展字段
  templateType: TemplateTypeSchema.optional(),
  context: z.string().optional(),
  imageTool: ImageToolSchema.optional(),
  artisticStyle: z.string().optional(),
  composition: z.string().optional(),
  additionalRequirements: z.string().optional()
});
export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;

export const OptimizationResponseSchema = z.object({
  optimizedPrompt: z.string(),
  optimizationExplanation: z.string(),
  improvements: z.array(z.string()),
  techniques: z.array(z.string()),
  metadata: z.object({
    provider: z.string(),
    timestamp: z.string(),
    tokenUsage: z.number()
  })
});
export type OptimizationResponse = z.infer<typeof OptimizationResponseSchema>;

export const OptimizationHistorySchema = z.object({
  id: z.string(),
  originalPrompt: z.string(),
  optimizedPrompt: z.string(),
  timestamp: z.number(),
  promptType: PromptTypeSchema,
  metadata: z.object({
    provider: z.string(),
    optimizationLevel: z.string()
  })
});
export type OptimizationHistory = z.infer<typeof OptimizationHistorySchema>;

// 优化记录 Schema（用于历史记录和收藏）
export const OptimizationRecordSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  originalPrompt: z.string(),
  optimizedPrompt: z.string(),
  request: OptimizationRequestSchema,
  response: OptimizationResponseSchema,
  isFavorite: z.boolean()
});
export type OptimizationRecord = z.infer<typeof OptimizationRecordSchema>;

// 模板系统 Schema
export const TemplateVariableSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
  defaultValue: z.string().optional()
});
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: TemplateTypeSchema,
  category: PromptTypeSchema,

  system: z.object({
    chinese: z.string(),
    english: z.string()
  }),

  user: z.object({
    chinese: z.string(),
    english: z.string()
  }),

  variables: z.array(z.string()),
  metadata: z.object({
    optimizationLevel: OptimizationLevelSchema,
    languageStyles: z.array(LanguageStyleSchema),
    tags: z.array(z.string()),
    version: z.string(),
    author: z.string()
  })
});
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
