import type { Keyframe, SummaryStyle } from '@/types/media-to-docs';
import { TRPCError } from '@trpc/server';
import { streamText } from 'ai';
import type { LLMProvider } from '../../../types/llm';
import { VISION_PROVIDERS } from '../../llm/providers';
import { progressManager } from '../progress-manager';
import { createProvider } from '../../llm/lib';
import * as fs from 'node:fs';

const stylePrompts: Record<SummaryStyle, string> = {
  note: `你是一位专业的笔记整理专家，擅长从语音转录文本中提炼结构化的学习笔记。

**核心任务**：将视频/音频转录文本整理成完整、系统的学习笔记。

**输出要求**：
1. **结构化组织**（必须使用 Markdown）：
   - 使用 # 一级标题作为主题
   - 使用 ## 二级标题组织核心章节
   - 使用 ### 三级标题细分知识点
   - 使用无序列表（- 或 *）列举要点
   - 使用 ** 粗体 ** 强调关键术语和概念

2. **内容完整性**：
   - 提取所有重要知识点，不要遗漏关键信息
   - 保留具体的数据、案例和实例说明
   - 如果有操作步骤，请按顺序列出
   - 如果有公式或代码，使用代码块标记

3. **逻辑清晰**：
   - 按照讲解的逻辑顺序组织内容
   - 区分主要观点和次要细节
   - 使用引用块（>）标注重要结论或警示信息

4. **忠于原文**：
   - 忠实转录原文的核心含义
   - 不添加原文未提及的内容
   - 保持客观准确的语言风格

请开始整理笔记：`,
  summary: `你是一位内容总结专家，擅长从视频/音频转录中提炼核心要点。

**核心任务**：将转录文本浓缩成简洁精炼的内容摘要。

**输出要求**：
1. **简明扼要**：
   - 用 2-4 个段落概括全部内容
   - 每个段落 3-5 句话
   - 总字数控制在 300-500 字

2. **突出重点**：
   - 第一段：一句话概括主题和核心观点
   - 中间段落：提炼 2-3 个关键要点
   - 最后段落：总结结论或给出建议

3. **精准表达**：
   - 使用精炼、准确的语言
   - 避免冗余和口语化表达
   - 保留关键数据和事实

4. **逻辑连贯**：
   - 摘要应当独立成文，逻辑完整
   - 段落之间衔接自然
   - 适当使用过渡词

请开始总结：`,
  article: `你是一位资深的内容创作者，擅长将视频/音频内容改写成优质的图文文章。

**核心任务**：将转录文本改写成一篇完整、流畅、有吸引力的文章。

**输出要求**：
1. **标题设计**：
   - 创作一个吸引眼球的标题（10-20字）
   - 可以使用数字、疑问、对比等手法
   - 准确概括文章核心内容

2. **文章结构**（使用 Markdown）：
   - 开头：2-3 段引言，说明背景和为什么值得关注
   - 正文：3-5 个章节，每个章节有 ## 小标题
   - 结尾：1-2 段总结，升华主题或提出思考

3. **内容改写**：
   - 将口语化的转录文本改写成书面语
   - 使用过渡句让逻辑更连贯
   - 适当扩展解释，增强可读性
   - 保留关键观点和事实，但用更生动的语言表达

4. **排版优化**：
   - 使用 **粗体** 强调重点
   - 使用引用块（>）突出金句
   - 适当使用列表让信息更清晰
   - 段落不宜过长，保持 3-5 行为佳

请开始创作文章：`,
  mindmap: `你是一位思维导图专家，擅长将视频/音频内容结构化为清晰的思维导图。

**核心任务**：将转录文本转换成层级分明的思维导图。

**输出要求**：
1. **识别中心主题**：
   - 用一句话（5-10字）概括中心主题
   - 作为思维导图的根节点（一级标题 #）

2. **构建分支结构**（使用 Markdown 列表）：
   - 一级分支（-）：提取 3-6 个主要模块或核心概念
   - 二级分支（  -）：每个一级分支下 2-5 个关键要点
   - 三级分支（    -）：必要时补充具体细节或例子
   - 最多使用三级，避免层级过深

3. **关键词提炼**：
   - 每个节点使用 3-8 字的关键词或短语
   - 不使用完整的句子
   - 使用名词、动词短语为主
   - 保持语言简洁有力

4. **逻辑组织**：
   - 按照重要性或讲解顺序排列分支
   - 同级分支之间逻辑并列
   - 结构平衡，避免某个分支过于庞大

5. **格式规范**：
\`\`\`markdown
# 中心主题
- 一级分支1
  - 二级要点1
  - 二级要点2
    - 三级细节
- 一级分支2
  - 二级要点1
  - 二级要点2
\`\`\`

请开始生成思维导图：`,
  'social-media-post': `你是一位社交媒体运营专家，擅长将内容转化为高传播性的社交媒体帖子。

**核心任务**：将视频/音频内容改写成适合社交平台传播的文案。

**输出要求**：
1. **开头吸睛**（选一种方式）：
   - 抛出引人思考的问题
   - 使用数字和对比（例如："90%的人都不知道..."）
   - 制造悬念或冲突
   - 分享个人感受

2. **核心内容**（150-300字）：
   - 提炼 2-3 个最有价值或最有趣的要点
   - 使用短句，每句 10-20 字
   - 换行频繁，保持视觉舒适
   - 语言口语化、轻松易懂

3. **增强表现力**：
   - 适当使用 Emoji（2-4 个）增加趣味性
   - 使用 **粗体** 强调关键词
   - 可以用数字或符号做列表（如 ①②③）

4. **互动引导**：
   - 结尾抛出问题或话题，引导评论
   - 或者号召点赞/转发
   - 例如："你有过类似经历吗？评论区聊聊～"

5. **话题标签**（3-5 个）：
   - 创建相关的 #话题标签
   - 结合内容关键词和热门话题
   - 放在文案末尾

**示例格式**：
\`\`\`
[吸睛开头] 

[要点1]
[要点2]
[要点3]

[互动引导]

#话题1 #话题2 #话题3
\`\`\`

请开始创作社交媒体文案：`,
  table: `你是一位信息结构化专家，擅长将视频/音频内容中的信息整理成表格形式。

**核心任务**：分析转录文本，提取适合表格展示的结构化信息。

**输出要求**：
1. **判断适用性**：
   - 如果内容不适合表格展示，请说明原因
   - 适合表格的场景：对比分析、分类列举、步骤流程、属性说明、时间线等

2. **表格设计**（使用 Markdown）：
   - 确定 2-5 个表头（列名）
   - 表头简洁明了（2-6个字）
   - 每行代表一个独立的项目或维度

3. **信息提取**：
   - 从原文中准确提取关键信息
   - 每个单元格内容简洁（10-30字为宜）
   - 保持同列信息的格式一致性
   - 数据准确，不捏造信息

4. **表格数量**：
   - 根据内容可以创建 1-3 个表格
   - 每个表格有独立的标题说明
   - 表格之间用换行分隔

5. **格式示例**：
\`\`\`markdown
## 表格标题

简短说明这个表格的内容（一句话）

| 表头1 | 表头2 | 表头3 |
|------|------|------|
| 内容1 | 内容2 | 内容3 |
| 内容1 | 内容2 | 内容3 |
\`\`\`

**常见表格类型**：
- 对比表：不同方案/产品的优缺点对比
- 清单表：功能列表、特性说明
- 流程表：步骤、阶段、时间线
- 分类表：不同类型的特征总结

请开始分析并生成表格：`
};

export function getSystemPrompt(style: SummaryStyle): string {
  return stylePrompts[style] || stylePrompts.note;
}

// --- Main Completion Function ---

export async function getCompletion(
  transcript: string,
  style: SummaryStyle,
  provider: LLMProvider,
  jobId?: string
): Promise<string> {
  if (!transcript) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Transcript content is empty.'
    });
  }

  const systemPrompt = getSystemPrompt(style);

  try {
    const model = createProvider(provider);

    // 使用 AI SDK 的统一 streamText 接口
    const result = streamText({
      model,
      system: systemPrompt,
      prompt: `这是需要处理的文本内容:\n\n---\n\n${transcript}`,
      temperature: 0.7
    });

    let fullContent = '';
    let lastProgressUpdate = 0;
    const estimatedLength = transcript.length * 0.8;

    // 流式接收生成内容
    for await (const textPart of result.textStream) {
      fullContent += textPart;

      // 更新生成进度（节流）
      if (jobId) {
        const now = Date.now();
        if (now - lastProgressUpdate >= 1500) {
          const currentLength = fullContent.length;
          const progress = Math.min(
            Math.round((currentLength / estimatedLength) * 100),
            95
          );
          progressManager.updateGenerationProgress(
            jobId,
            progress,
            `已生成 ${currentLength} 字符`
          );
          lastProgressUpdate = now;
        }
      }
    }

    if (!fullContent) {
      throw new Error(`${provider} API returned an empty response.`);
    }

    // 确保最后一次进度更新
    if (jobId) {
      progressManager.updateGenerationProgress(jobId, 100, '生成完成');
    }

    return fullContent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error calling ${provider} API:`, error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to get completion from ${provider}: ${errorMessage}`,
      cause: error
    });
  }
}

// --- Provider Fallback Support (Optional) ---

/**
 * 尝试使用多个提供商，按优先级顺序回退
 * @param transcript 转录文本
 * @param style 总结风格
 * @param providers 提供商优先级列表
 * @param jobId 任务ID
 * @returns 生成的内容
 */
export async function getCompletionWithFallback(
  transcript: string,
  style: SummaryStyle,
  providers: LLMProvider[],
  jobId?: string
): Promise<{ content: string; usedProvider: LLMProvider }> {
  let lastError: Error | undefined;

  for (const provider of providers) {
    try {
      console.log(`Trying provider: ${provider}`);
      const content = await getCompletion(transcript, style, provider, jobId);
      console.log(`Successfully used provider: ${provider}`);
      return { content, usedProvider: provider };
    } catch (error) {
      console.warn(`Provider ${provider} failed, trying next...`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }

  // 所有提供商都失败
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`,
    cause: lastError
  });
}

// --- Multimodal Support ---

/**
 * 时间轴风格的 prompt（用于多模态场景）
 */
function getTimelinePrompt(keyframes: Keyframe[]): string {
  const timestamps = keyframes
    .map((k) => {
      const mins = Math.floor(k.timestamp / 60);
      const secs = Math.floor(k.timestamp % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    })
    .join(', ');

  return `你是一位视频内容分析专家，擅长将视频转录和关键画面结合，生成结构化的时间轴笔记。

**核心任务**：根据提供的视频关键帧（带时间戳）和完整文字转录，生成一份时间轴风格的图文笔记。

**关键帧时间点**：${timestamps}

**输出要求**：
1. **时间轴结构**（使用 Markdown）：
   - 按时间顺序组织内容
   - 每个时间段使用 ## [时间] 标题 的格式
   - 时间格式为 MM:SS

2. **每个时间段包含**：
   - **画面描述**：简明描述该时间点的关键画面内容（2-3 句话）
   - **内容要点**：提炼该时间段的核心信息
     - 使用无序列表列举要点
     - 每个要点简洁明了
     - 保持逻辑连贯

3. **格式示例**：
\`\`\`markdown
## [00:15] 开场介绍
**画面描述**：讲师站在白板前，背景是产品 Logo，手持演示笔指向屏幕。

**内容要点**：
- 今天的主题是介绍新产品的核心功能
- 产品已经开发了 6 个月，即将上线
- 主要目标用户是企业客户

## [01:30] 核心功能演示
**画面描述**：屏幕切换到产品界面，展示仪表盘和数据图表。

**内容要点**：
- 实时数据监控功能
- 自定义报表生成
- 支持多种数据源接入
\`\`\`

4. **内容完整性**：
   - 覆盖所有关键时间点
   - 画面描述要基于实际看到的画面内容
   - 文字要点要忠实于转录文本
   - 不添加原文未提及的内容

5. **语言风格**：
   - 画面描述使用客观、具象的语言
   - 内容要点使用简洁、精炼的表达
   - 保持专业但易读的风格

请开始生成时间轴笔记：`;
}

/**
 * 格式化时间戳为 MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 带图片的多模态补全（时间轴风格）
 */
export async function getCompletionWithImages(
  transcript: string,
  keyframes: Keyframe[],
  provider: LLMProvider,
  jobId?: string
): Promise<string> {
  if (!transcript) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Transcript content is empty.'
    });
  }

  if (keyframes.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No keyframes provided.'
    });
  }

  if (!VISION_PROVIDERS.includes(provider)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Provider ${provider} does not support vision models. Please use openai, anthropic, or gemini.`
    });
  }

  const systemPrompt = getTimelinePrompt(keyframes);

  try {
    const model = createProvider(provider);

    // 构建多模态消息内容
    const messageContent: Array<{
      type: string;
      text?: string;
      image?: Buffer | Uint8Array;
    }> = [{ type: 'text', text: systemPrompt }];

    // 添加所有关键帧图片
    for (const keyframe of keyframes) {
      const imageBuffer = fs.readFileSync(keyframe.imagePath);
      messageContent.push({
        type: 'image',
        image: imageBuffer
      });
      messageContent.push({
        type: 'text',
        text: `[${formatTimestamp(keyframe.timestamp)}] 该时间段的文字内容：${keyframe.text || '（无文字）'}`
      });
    }

    // 添加完整转录文本
    messageContent.push({
      type: 'text',
      text: `\n\n---\n\n**完整转录文本**（供参考）：\n\n${transcript}`
    });

    // 使用 AI SDK 的 streamText，支持多模态
    const result = streamText({
      model,
      messages: [
        {
          role: 'user',
          content: messageContent as never // AI SDK 类型推断问题，需要类型断言
        }
      ],
      temperature: 0.7
    });

    let fullContent = '';
    let lastProgressUpdate = 0;
    const estimatedLength = transcript.length * 0.8;

    // 流式接收生成内容
    for await (const textPart of result.textStream) {
      fullContent += textPart;

      // 更新生成进度（节流）
      if (jobId) {
        const now = Date.now();
        if (now - lastProgressUpdate >= 1500) {
          const currentLength = fullContent.length;
          const progress = Math.min(
            Math.round((currentLength / estimatedLength) * 100),
            95
          );
          progressManager.updateGenerationProgress(
            jobId,
            progress,
            `已生成 ${currentLength} 字符`
          );
          lastProgressUpdate = now;
        }
      }
    }

    if (!fullContent) {
      throw new Error(`${provider} API returned an empty response.`);
    }

    // 确保最后一次进度更新
    if (jobId) {
      progressManager.updateGenerationProgress(jobId, 100, '生成完成');
    }

    return fullContent;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error calling ${provider} API with images:`, error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to get completion from ${provider} with images: ${errorMessage}`,
      cause: error
    });
  }
}
