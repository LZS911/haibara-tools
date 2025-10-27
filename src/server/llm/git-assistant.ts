import { generateText } from 'ai';
import { createProvider } from './lib';
import type { LLMProvider, PRActivity } from '../../types/llm';

export class GitAssistantService {
  constructor(private provider: LLMProvider) {}

  async generateCommitMessage(changeDescription: string): Promise<string> {
    const llm = createProvider(this.provider);
    const { text } = await generateText({
      model: llm,
      prompt: `Generate a concise and informative Git commit message based on the following change description:\n\n${changeDescription}\n\nCommit message should be in English and follow conventional commit guidelines (e.g., feat: add new feature, fix: resolve bug). Do not include any extra explanations, just the commit message.`
    });
    return text;
  }

  async generatePRDescription(
    changeDescription: string,
    commitMessage: string
  ): Promise<string> {
    const llm = createProvider(this.provider);
    const { text } = await generateText({
      model: llm,
      prompt: `根据以下变更描述和提交信息生成一个详细的 Pull Request 描述：\n\n变更描述：\n${changeDescription}\n\n提交信息：\n${commitMessage}\n\nPR 描述应使用中文，解释变更内容、背后的动机以及任何潜在影响。包括摘要、变更列表和任何相关上下文。`
    });
    return text;
  }

  async generateWeeklyReportSummary(
    prActivities: PRActivity[]
  ): Promise<string> {
    const llm = createProvider(this.provider);
    const { text } = await generateText({
      model: llm,
      prompt: `根据以下 Pull Request 活动生成一份周报摘要。周报应使用中文，简洁明了，并突出关键成就和进展。\n\nPR 活动：\n${JSON.stringify(prActivities, null, 2)}\n\n周报摘要：`
    });
    return text;
  }
}
