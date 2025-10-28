import { generateText } from 'ai';
import { createProvider } from './lib';
import type { LLMProvider, PRActivity } from '../../types/llm';

export class GitAssistantService {
  constructor(private provider: LLMProvider) {}

  async generateCommitMessage(changeDescription: string): Promise<string> {
    const llm = createProvider(this.provider);
    const { text } = await generateText({
      model: llm,
      prompt: `Generate a Git commit message from the change description below.\n\nStrict requirements:\n- Use English and Conventional Commits format: 
  type(scope?): subject\n- type must be one of: feat, fix, docs, chore, refactor, perf, test, build, ci, style, revert\n- Subject: imperative mood, no trailing period, <= 72 characters\n- Avoid emojis, quotes, code fences, or extra commentary\n- If more context is needed, add a body after one blank line:\n  - Wrap each line at 72 characters\n  - Use concise bullet points for key changes\n- Output ONLY the commit message content that can be used directly by git.\n\nChange description:\n${changeDescription}\n\nReturn only the commit message:`
    });
    return text;
  }

  async generateWeeklyReportSummary(
    prActivities: PRActivity[]
  ): Promise<string> {
    const llm = createProvider(this.provider);
    const { text } = await generateText({
      model: llm,
      prompt: `你是一名资深工程师，正在撰写工作周报。基于以下 Pull Request 活动，生成一份用于工作场景的周报摘要，使用中文，结构清晰、可直接粘贴到周报中，避免夸张语气。\n\n要求：\n- 使用 Markdown 输出，包含以下小节（仅在有内容时展示）：\n  1. 本周概览（一句话总结）\n  2. 关键产出（按项目/仓库分组，列出 PR：标题(#编号)、状态、主要改动点；必要时合并相近 PR）\n  3. 量化指标（合并 PR 数、提交数、评审数、变更行数：+新增/-删除）\n  4. 问题与风险（若无写“无”）\n  5. 下周计划（3-5 条可执行事项）\n  6. 协作/支持需求（若无写“无”）\n- 按时间顺序组织内容，优先最近的活动。\n- 用词专业、客观、简洁；优先使用项目名/仓库名；避免无信息的陈述。\n- 字数建议 200-400 字。\n- 如果输入为空或无有效活动，输出“本周暂无可记录的 PR 活动”，并生成一份简短的下周计划占位。\n\n输入的 PR 活动（JSON）：\n${JSON.stringify(prActivities, null, 2)}\n\n请开始生成：`
    });
    return text;
  }
}
