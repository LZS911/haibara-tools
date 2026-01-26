import { generateText, streamText } from 'ai';
import { createProvider } from '../llm/lib';
import { TemplateEngine } from './template-engine';
import {
  type OptimizationRequest,
  type OptimizationResponse,
  OptimizationResponseSchema,
  type PromptTemplate,
  type PromptType,
  PromptTypeSchema
} from '@/types/prompt-optimizer';
import { listTemplatesByCategory, selectTemplate } from './templates';
import { LRUCache } from 'lru-cache';
import { TRPCError } from '@trpc/server';

// --- 缓存配置 ---

const cache = new LRUCache<string, OptimizationResponse>({
  max: 50, // 最多缓存 50 个结果
  ttl: 1000 * 60 * 30, // 30 分钟过期
  ttlAutopurge: true
});

// --- 运行时统计 ---

export const stats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  streamRequests: 0,
  errors: 0,
  avgLatency: 0,
  lastResetTime: new Date().toISOString()
};

/**
 * 重置统计信息
 */
export function resetStats(): void {
  stats.totalRequests = 0;
  stats.cacheHits = 0;
  stats.cacheMisses = 0;
  stats.streamRequests = 0;
  stats.errors = 0;
  stats.avgLatency = 0;
  stats.lastResetTime = new Date().toISOString();
}

/**
 * 生成缓存键
 */
function generateCacheKey(input: OptimizationRequest): string {
  // 排除 provider 以提高缓存命中率（不同 provider 可能产生相似结果）
  const { provider, ...rest } = input;
  return JSON.stringify(rest);
}

// --- Optimize Service ---

// 尝试解析可能包含在 Markdown 代码块或被转义字符串中的 JSON
function tryJsonParse<T>(text: string): T | null {
  try {
    const first = JSON.parse(text) as unknown;
    if (typeof first === 'string') {
      try {
        return JSON.parse(first) as T;
      } catch {
        return null;
      }
    }
    return first as T;
  } catch {
    return null;
  }
}

function extractFromCodeFence(text: string): string | null {
  const fenceRegex = /```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/i;
  const match = fenceRegex.exec(text);
  if (!match) return null;
  return match[1].trim();
}

function extractFirstJsonObject(text: string): string | null {
  let inString = false;
  let escape = false;
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}

function parseFlexibleJson(text: string): unknown | null {
  // 1) 直接解析
  const direct = tryJsonParse<unknown>(text);
  if (direct !== null) return direct;
  // 2) 从 Markdown 代码块中提取
  const fenced = extractFromCodeFence(text);
  if (fenced) {
    const fromFence = tryJsonParse<unknown>(fenced);
    if (fromFence !== null) return fromFence;
  }
  // 3) 提取第一个平衡的大括号对象
  const balanced = extractFirstJsonObject(text);
  if (balanced) {
    const fromBalanced = tryJsonParse<unknown>(balanced);
    if (fromBalanced !== null) return fromBalanced;
  }
  return null;
}

/**
 * 优化提示词（带缓存）
 */
export async function optimizePrompt(
  input: OptimizationRequest
): Promise<OptimizationResponse> {
  const startTime = Date.now();
  stats.totalRequests++;

  try {
    // 1. 检查缓存
    const cacheKey = generateCacheKey(input);
    const cached = cache.get(cacheKey);
    if (cached) {
      stats.cacheHits++;
      return cached;
    }
    stats.cacheMisses++;

    // 2. 选择模板
    const isImagePrompt = !!input.imageTool;
    const hasContext = !!input.context && input.context.trim().length > 0;
    const template = selectTemplate({
      promptType: input.promptType,
      optimizationLevel: input.optimizationLevel,
      hasContext,
      isImagePrompt
    });

    // 3. 准备变量
    const variables = {
      originalPrompt: input.originalPrompt,
      promptType: input.promptType,
      optimizationLevel: input.optimizationLevel,
      languageStyle: input.languageStyle,
      outputFormat: input.outputFormat,
      language: input.language || 'zh-CN',
      context: input.context || '',
      imageTool: input.imageTool || '',
      artisticStyle: input.artisticStyle || '',
      composition: input.composition || '',
      additionalRequirements: input.additionalRequirements || ''
    } as unknown as Record<string, string>;

    // 4. 验证模板变量（警告但不阻塞）
    const validation = TemplateEngine.validateVariables(template, variables);
    if (!validation.valid) {
      console.warn(
        `[Prompt Optimizer] Missing variables: ${validation.missing.join(', ')}`
      );
    }

    // 5. 编译模板
    const compiled = TemplateEngine.compile(
      template,
      variables,
      input.language
    );

    // 6. 调用 LLM
    const provider = createProvider(input.provider);

    const jsonInstruction = `\n\n严格按以下 JSON 结构返回（不要添加额外文本）：\n{
  "optimizedPrompt": string,
  "optimizationExplanation": string,
  "improvements": string[],
  "techniques": string[],
  "metadata": { "provider": string, "timestamp": string, "tokenUsage": number }
}`;

    const fullPrompt = `SYSTEM:\n${compiled.system}\n\nUSER:\n${compiled.user}${jsonInstruction}`;

    const { text } = await generateText({
      model: provider,
      prompt: fullPrompt
    });

    // 7. 解析响应
    const result = parseAndNormalizeResponse(text, input);

    // 8. 缓存结果
    cache.set(cacheKey, result);

    // 9. 更新统计
    const latency = Date.now() - startTime;
    stats.avgLatency =
      (stats.avgLatency * (stats.totalRequests - 1) + latency) /
      stats.totalRequests;

    return result;
  } catch (error) {
    stats.errors++;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        input.language === 'english'
          ? `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `优化失败：${error instanceof Error ? error.message : '未知错误'}`,
      cause: error
    });
  }
}

/**
 * 流式优化提示词
 */
export async function* optimizePromptStream(
  input: OptimizationRequest
): AsyncGenerator<{
  type: 'chunk' | 'complete';
  content: string;
  data?: OptimizationResponse;
}> {
  const startTime = Date.now();
  stats.totalRequests++;
  stats.streamRequests++;

  try {
    // 1. 选择模板
    const isImagePrompt = !!input.imageTool;
    const hasContext = !!input.context && input.context.trim().length > 0;
    const template = selectTemplate({
      promptType: input.promptType,
      optimizationLevel: input.optimizationLevel,
      hasContext,
      isImagePrompt
    });

    // 2. 准备变量
    const variables = {
      originalPrompt: input.originalPrompt,
      promptType: input.promptType,
      optimizationLevel: input.optimizationLevel,
      languageStyle: input.languageStyle,
      outputFormat: input.outputFormat,
      language: input.language || 'zh-CN',
      context: input.context || '',
      imageTool: input.imageTool || '',
      artisticStyle: input.artisticStyle || '',
      composition: input.composition || '',
      additionalRequirements: input.additionalRequirements || ''
    } as unknown as Record<string, string>;

    // 3. 验证模板变量
    const validation = TemplateEngine.validateVariables(template, variables);
    if (!validation.valid) {
      console.warn(
        `[Prompt Optimizer Stream] Missing variables: ${validation.missing.join(', ')}`
      );
    }

    // 4. 编译模板
    const compiled = TemplateEngine.compile(
      template,
      variables,
      input.language
    );

    // 5. 调用 LLM 流式接口
    const provider = createProvider(input.provider);
    const jsonInstruction = `\n\n严格按以下 JSON 结构返回（不要添加额外文本）：\n{
  "optimizedPrompt": string,
  "optimizationExplanation": string,
  "improvements": string[],
  "techniques": string[],
  "metadata": { "provider": string, "timestamp": string, "tokenUsage": number }
}`;

    const fullPrompt = `SYSTEM:\n${compiled.system}\n\nUSER:\n${compiled.user}${jsonInstruction}`;

    const stream = streamText({
      model: provider,
      prompt: fullPrompt
    });

    // 6. 流式输出
    let buffer = '';
    for await (const chunk of stream.textStream) {
      buffer += chunk;
      yield { type: 'chunk', content: chunk };
    }

    // 7. 解析完整响应
    const result = parseAndNormalizeResponse(buffer, input);

    // 8. 更新统计
    const latency = Date.now() - startTime;
    stats.avgLatency =
      (stats.avgLatency * (stats.totalRequests - 1) + latency) /
      stats.totalRequests;

    // 9. 返回最终结果
    yield { type: 'complete', content: '', data: result };
  } catch (error) {
    stats.errors++;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message:
        input.language === 'english'
          ? `Stream optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          : `流式优化失败：${error instanceof Error ? error.message : '未知错误'}`,
      cause: error
    });
  }
}

/**
 * 解析并规范化响应
 */
function parseAndNormalizeResponse(
  text: string,
  input: OptimizationRequest
): OptimizationResponse {
  const fallback = (): OptimizationResponse => ({
    optimizedPrompt: text.trim(),
    optimizationExplanation:
      input.language === 'english'
        ? 'Model returned non-JSON output. Provided raw optimized text.'
        : '模型未返回有效 JSON，已直接返回优化文本。',
    improvements: [],
    techniques: [],
    metadata: {
      provider: input.provider,
      timestamp: new Date().toISOString(),
      tokenUsage: 0
    }
  });

  try {
    const parsed = parseFlexibleJson(text) as OptimizationResponse;
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      !OptimizationResponseSchema.safeParse(parsed).success
    ) {
      return fallback();
    }
    const normalized: OptimizationResponse = {
      optimizedPrompt: String(parsed.optimizedPrompt || '').trim(),
      optimizationExplanation: String(
        parsed.optimizationExplanation || ''
      ).trim(),
      improvements: Array.isArray(parsed.improvements)
        ? (parsed.improvements as unknown[]).map((s: unknown) => String(s))
        : [],
      techniques: Array.isArray(parsed.techniques)
        ? (parsed.techniques as unknown[]).map((s: unknown) => String(s))
        : [],
      metadata: {
        provider: String(
          (parsed?.metadata && parsed.metadata?.provider) || input.provider
        ),
        timestamp: String(
          (parsed?.metadata &&
            (parsed.metadata as Record<string, unknown>)?.timestamp) ||
            new Date().toISOString()
        ),
        tokenUsage: Number(
          (parsed?.metadata &&
            (parsed.metadata as Record<string, unknown>)?.tokenUsage) ||
            0
        )
      }
    };
    if (!normalized.optimizedPrompt) return fallback();
    return normalized;
  } catch {
    return fallback();
  }
}

// --- Templates ---

export function listTemplates(category?: PromptType): PromptTemplate[] {
  if (category) {
    // 验证 category 合法性
    PromptTypeSchema.parse(category);
  }
  return listTemplatesByCategory(category);
}
