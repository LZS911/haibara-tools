import { generateText, streamText } from 'ai';
import { createProvider } from '../llm/lib';
import type { LLMProvider } from '@/types/llm';
import type {
  AIOperation,
  AIDocResponse,
  KnowledgeSearchResult
} from '@/types/docs';
import { searchDocs, getDoc, getDocSnippet } from './storage';

// AI 操作的系统提示词
const SYSTEM_PROMPTS: Record<AIOperation, string> = {
  polish: `你是一位专业的文档编辑。请润色以下文本，使其更加流畅、专业，同时保持原意不变。
要求：
- 保持原有格式（如 Markdown 格式）
- 改进句子结构和用词
- 消除冗余表达
- 保持原文的核心意思
只返回润色后的文本，不要添加任何解释。`,

  continue: `你是一位专业的写作助手。请根据以下内容的上下文，继续写作。
要求：
- 保持一致的写作风格和语气
- 延续内容的主题和逻辑
- 保持相同的格式（如 Markdown 格式）
- 生成有意义的后续内容，大约 200-300 字
只返回续写的内容，不要添加任何解释。`,

  summarize: `你是一位专业的内容分析师。请为以下文本生成简洁的摘要。
要求：
- 提取核心观点和要点
- 摘要长度控制在 100-200 字
- 使用清晰、简洁的语言
- 保持客观中立的语气
只返回摘要内容，不要添加任何解释。`,

  rewrite: `你是一位专业的文案撰写人。请用不同的方式重写以下文本，表达相同的意思。
要求：
- 保持原意不变
- 使用不同的表达方式和句式
- 保持原有格式（如 Markdown 格式）
- 可以调整段落结构使其更清晰
只返回改写后的文本，不要添加任何解释。`,

  expand: `你是一位专业的内容创作者。请扩展以下文本，丰富其内容。
要求：
- 添加更多细节和说明
- 可以增加示例或论据
- 保持原有的核心观点
- 保持原有格式（如 Markdown 格式）
- 扩展后的内容是原文的 2-3 倍长度
只返回扩展后的文本，不要添加任何解释。`,

  simplify: `你是一位专业的技术写作专家。请简化以下文本，使其更易于理解。
要求：
- 使用简单、直接的语言
- 避免专业术语，或对其进行解释
- 缩短复杂的句子
- 保持核心信息完整
- 保持原有格式（如 Markdown 格式）
只返回简化后的文本，不要添加任何解释。`,

  translate: `你是一位专业的翻译。请将以下文本翻译成指定的目标语言。
要求：
- 翻译准确，保持原意
- 使用地道的目标语言表达
- 保持原有格式（如 Markdown 格式）
- 对于专有名词，可以保留原文并添加翻译
只返回翻译后的文本，不要添加任何解释。`
};

// AI 文档处理服务
export class AIDocService {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  // 执行 AI 操作
  async processContent(
    content: string,
    operation: AIOperation,
    context?: string,
    targetLanguage?: string
  ): Promise<AIDocResponse> {
    const model = createProvider(this.provider);
    let systemPrompt = SYSTEM_PROMPTS[operation];

    // 翻译操作需要指定目标语言
    if (operation === 'translate' && targetLanguage) {
      systemPrompt += `\n目标语言：${targetLanguage}`;
    }

    // 构建用户消息
    let userMessage = content;
    if (context) {
      userMessage = `上下文：\n${context}\n\n需要处理的内容：\n${content}`;
    }

    const { text, usage } = await generateText({
      model,
      system: systemPrompt,
      prompt: userMessage
    });

    return {
      result: text,
      operation,
      tokensUsed: usage?.totalTokens
    };
  }

  // 流式 AI 操作
  async *processContentStream(
    content: string,
    operation: AIOperation,
    context?: string,
    targetLanguage?: string
  ): AsyncGenerator<{ type: 'chunk' | 'complete'; content: string }> {
    const model = createProvider(this.provider);
    let systemPrompt = SYSTEM_PROMPTS[operation];

    if (operation === 'translate' && targetLanguage) {
      systemPrompt += `\n目标语言：${targetLanguage}`;
    }

    let userMessage = content;
    if (context) {
      userMessage = `上下文：\n${context}\n\n需要处理的内容：\n${content}`;
    }

    const { textStream } = streamText({
      model,
      system: systemPrompt,
      prompt: userMessage
    });

    let fullContent = '';
    for await (const chunk of textStream) {
      fullContent += chunk;
      yield { type: 'chunk', content: chunk };
    }

    yield { type: 'complete', content: fullContent };
  }

  // 生成标签
  async generateTags(content: string): Promise<string[]> {
    const model = createProvider(this.provider);

    const { text } = await generateText({
      model,
      system: `你是一位专业的内容分类专家。请为以下文本生成 3-5 个相关标签。
要求：
- 标签应该简洁（1-4 个字）
- 标签应该反映文本的主题和领域
- 使用中文标签
- 只返回标签，用逗号分隔，不要添加任何其他内容`,
      prompt: content
    });

    return text
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0 && tag.length <= 20);
  }

  // 生成标题建议
  async suggestTitle(content: string): Promise<string> {
    const model = createProvider(this.provider);

    const { text } = await generateText({
      model,
      system: `你是一位专业的标题撰写专家。请为以下文本生成一个合适的标题。
要求：
- 标题应该简洁明了（10-30 个字）
- 标题应该准确反映文本内容
- 只返回标题，不要添加任何其他内容`,
      prompt: content
    });

    return text.trim().slice(0, 100);
  }
}

// 知识库搜索服务
export async function searchKnowledgeBase(
  query: string,
  limit = 5
): Promise<KnowledgeSearchResult[]> {
  // 使用本地搜索
  const docs = searchDocs(query, limit);

  return docs.map((doc) => ({
    docId: doc.id,
    title: doc.title,
    snippet: getDocSnippet(doc.id, query),
    score: 1 // 简单搜索不提供精确分数
  }));
}

// AI 增强的知识库搜索
export async function aiEnhancedSearch(
  query: string,
  provider: LLMProvider,
  limit = 5
): Promise<KnowledgeSearchResult[]> {
  // 首先进行本地搜索
  const localResults = await searchKnowledgeBase(query, limit * 2);

  if (localResults.length === 0) {
    return [];
  }

  // 使用 AI 对结果进行重排序
  const model = createProvider(provider);

  // 构建搜索上下文
  const resultsContext = localResults
    .map((r, i) => `[${i}] ${r.title}: ${r.snippet}`)
    .join('\n');

  const { text } = await generateText({
    model,
    system: `你是一位搜索结果排序专家。根据用户的查询意图，对以下搜索结果进行相关性排序。
返回格式：只返回按相关性排序的结果索引号，用逗号分隔（如：2,0,3,1）。
不要添加任何解释。`,
    prompt: `查询：${query}\n\n搜索结果：\n${resultsContext}`
  });

  // 解析排序结果
  const orderedIndices = text
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 0 && n < localResults.length);

  // 按新顺序返回结果
  const reorderedResults: KnowledgeSearchResult[] = [];
  const seen = new Set<number>();

  for (const idx of orderedIndices) {
    if (!seen.has(idx)) {
      seen.add(idx);
      reorderedResults.push({
        ...localResults[idx],
        score:
          (orderedIndices.length - reorderedResults.length) /
          orderedIndices.length
      });
    }
  }

  // 添加未包含在排序中的结果
  for (let i = 0; i < localResults.length; i++) {
    if (!seen.has(i)) {
      reorderedResults.push({
        ...localResults[i],
        score: 0.1
      });
    }
  }

  return reorderedResults.slice(0, limit);
}

// 获取文档引用建议
export async function getDocumentReferences(
  content: string,
  provider: LLMProvider,
  limit = 3
): Promise<
  Array<{
    docId: string;
    title: string;
    relevantSection: string;
    suggestion: string;
  }>
> {
  // 从内容中提取关键词进行搜索
  const model = createProvider(provider);

  // 提取关键词
  const { text: keywords } = await generateText({
    model,
    system: `提取以下文本中最重要的 3-5 个关键词或短语，用逗号分隔。只返回关键词，不要添加任何解释。`,
    prompt: content
  });

  // 使用关键词搜索知识库
  const keywordList = keywords.split(/[,，]/).map((k) => k.trim());
  const allResults: KnowledgeSearchResult[] = [];

  for (const keyword of keywordList) {
    const results = await searchKnowledgeBase(keyword, 3);
    allResults.push(...results);
  }

  // 去重并限制数量
  const uniqueResults = Array.from(
    new Map(allResults.map((r) => [r.docId, r])).values()
  ).slice(0, limit);

  // 为每个结果生成引用建议
  const references: Array<{
    docId: string;
    title: string;
    relevantSection: string;
    suggestion: string;
  }> = [];

  for (const result of uniqueResults) {
    const doc = getDoc(result.docId);
    if (doc) {
      references.push({
        docId: result.docId,
        title: result.title,
        relevantSection: result.snippet,
        suggestion: `可以引用《${result.title}》中的相关内容来支持您的观点。`
      });
    }
  }

  return references;
}

// 创建 AI 服务实例
export function createAIDocService(provider: LLMProvider): AIDocService {
  return new AIDocService(provider);
}
