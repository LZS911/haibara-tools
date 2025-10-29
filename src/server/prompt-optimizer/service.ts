import { generateText } from 'ai';
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

export async function optimizePrompt(
  input: OptimizationRequest
): Promise<OptimizationResponse> {
  const provider = createProvider(input.provider);

  const isImagePrompt = !!input.imageTool;
  const hasContext = !!input.context && input.context.trim().length > 0;
  const template = selectTemplate({
    promptType: input.promptType,
    optimizationLevel: input.optimizationLevel,
    hasContext,
    isImagePrompt
  });

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

  const compiled = TemplateEngine.compile(template, variables, input.language);

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
