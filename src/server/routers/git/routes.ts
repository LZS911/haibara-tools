import { GitHubService } from './github-service';
import { z } from 'zod';
import { GitAssistantService } from '../llm/git-assistant';
import { createProvider } from '../llm/lib';
import { generateText } from 'ai';
import { LLMProviderSchema, PRActivitySchema } from '@/types/llm';
import { initTRPC } from '@trpc/server';
import * as storage from './storage';

const t = initTRPC.create();

// Schema for Git Repository
const GitRepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  localPath: z.string(),
  githubOwner: z.string(),
  githubRepo: z.string(),
  defaultBranch: z.string(),
  createdAt: z.number(),
  updatedAt: z.number()
});

// Schema for PR Record
const PRRecordSchema = z.object({
  id: z.number(),
  repositoryId: z.string(),
  title: z.string(),
  number: z.number(),
  state: z.enum(['open', 'closed', 'merged']),
  htmlUrl: z.string(),
  createdAt: z.string(),
  closedAt: z.string().optional(),
  mergedAt: z.string().optional(),
  author: z.string(),
  baseBranch: z.string(),
  headBranch: z.string()
});

export const gitRouter = t.router({
  getRepositories: t.procedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const github = new GitHubService(input.token);
      return github.fetchUserRepos();
    }),

  generateCommitMessage: t.procedure
    .input(
      z.object({
        changeDescription: z.string(),
        llmProvider: LLMProviderSchema
      })
    )
    .mutation(async ({ input }) => {
      const gitAssistant = new GitAssistantService(input.llmProvider);
      return gitAssistant.generateCommitMessage(input.changeDescription);
    }),

  createPullRequest: t.procedure
    .input(
      z.object({
        token: z.string(),
        owner: z.string(),
        repo: z.string(),
        head: z.string(),
        base: z.string(),
        changeDescription: z.string(),
        prTitle: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const prTitle = input.prTitle;

      const github = new GitHubService(input.token);

      // Check if a PR already exists for this head and base branch
      const existingPR = await github.getOpenPullRequest(
        input.owner,
        input.repo,
        input.head,
        input.base
      );

      if (
        existingPR &&
        existingPR.head?.ref === input.head &&
        existingPR.base?.ref === input.base &&
        existingPR.head?.repo?.full_name === `${input.owner}/${input.repo}`
      ) {
        const updatedBody = existingPR.body
          ? `${existingPR.body}\n\n---\n\n${input.changeDescription}`
          : input.changeDescription;
        return github.updatePullRequest(
          input.owner,
          input.repo,
          existingPR.number,
          existingPR.title, // Keep the original title
          updatedBody
        );
      } else {
        // If no PR exists, create a new one
        return github.createPR(
          input.owner,
          input.repo,
          input.head,
          input.base,
          prTitle, // Use custom title or generated commit message
          input.changeDescription
        );
      }
    }),

  getPullRequestActivity: t.procedure
    .input(
      z.object({
        token: z.string(),
        owner: z.string(),
        repo: z.string(),
        state: z.enum(['open', 'closed', 'all']).optional(),
        since: z.string().optional(),
        perPage: z.number().optional()
      })
    )
    .query(async ({ input }) => {
      const github = new GitHubService(input.token);
      return github.getRepoPullRequests(
        input.owner,
        input.repo,
        input.state,
        input.since,
        input.perPage
      );
    }),

  generateWeeklyReport: t.procedure
    .input(
      z.object({
        prActivities: z.array(PRActivitySchema), // Using the defined schema
        llmProvider: LLMProviderSchema
      })
    )
    .mutation(async ({ input }) => {
      const gitAssistant = new GitAssistantService(input.llmProvider);
      return gitAssistant.generateWeeklyReportSummary(input.prActivities);
    }),

  // 本地仓库管理
  addLocalRepository: t.procedure
    .input(
      z.object({
        name: z.string(),
        localPath: z.string(),
        githubOwner: z.string(),
        githubRepo: z.string(),
        defaultBranch: z.string()
      })
    )
    .mutation(async ({ input }) => {
      return storage.addRepository(input);
    }),

  getLocalRepositories: t.procedure.query(() => {
    return storage.readRepositories();
  }),

  getLocalRepositoryById: t.procedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return storage.getRepositoryById(input.id);
    }),

  updateLocalRepository: t.procedure
    .input(
      z.object({
        id: z.string(),
        updates: GitRepositorySchema.partial()
      })
    )
    .mutation(({ input }) => {
      const success = storage.updateRepository(input.id, input.updates);
      if (!success) {
        throw new Error('Repository not found');
      }
      return { success };
    }),

  deleteLocalRepository: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(({ input }) => {
      const success = storage.deleteRepository(input.id);
      if (!success) {
        throw new Error('Repository not found');
      }
      return { success };
    }),

  // PR 记录管理
  savePRRecord: t.procedure.input(PRRecordSchema).mutation(({ input }) => {
    storage.upsertPRRecord(input);
    return { success: true };
  }),

  batchSavePRRecords: t.procedure
    .input(z.object({ records: z.array(PRRecordSchema) }))
    .mutation(({ input }) => {
      storage.batchUpsertPRRecords(input.records);
      return { success: true };
    }),

  getPRRecords: t.procedure
    .input(z.object({ repositoryId: z.string(), limit: z.number().optional() }))
    .query(({ input }) => {
      return storage
        .getPRRecordsByRepository(input.repositoryId, input.limit)
        .sort((a, b) => b.number - a.number);
    }),

  getPRRecordsByTimeRange: t.procedure
    .input(
      z.object({
        repositoryIds: z.array(z.string()),
        startTime: z.string(),
        endTime: z.string()
      })
    )
    .query(({ input }) => {
      return storage
        .getPRRecordsByTimeRange(
          input.repositoryIds,
          input.startTime,
          input.endTime
        )
        .sort((a, b) => b.number - a.number);
    }),

  deletePRRecord: t.procedure
    .input(z.object({ id: z.number(), repositoryId: z.string() }))
    .mutation(({ input }) => {
      const success = storage.deletePRRecord(input.id, input.repositoryId);
      if (!success) {
        throw new Error('PR record not found');
      }
      return { success };
    }),

  // 从 GitHub 同步 PR 记录
  syncPRRecords: t.procedure
    .input(
      z.object({
        token: z.string(),
        repositoryId: z.string(),
        owner: z.string(),
        repo: z.string(),
        state: z.enum(['open', 'closed', 'all']).optional(),
        perPage: z.number().optional()
      })
    )
    .mutation(async ({ input }) => {
      const github = new GitHubService(input.token);
      const prs = await github.getRepoPullRequests(
        input.owner,
        input.repo,
        input.state,
        undefined,
        input.perPage
      );

      const records: storage.PRRecord[] = prs.map((pr) => ({
        id: pr.id,
        repositoryId: input.repositoryId,
        title: pr.title,
        number: pr.number,
        state: pr.merged_at
          ? 'merged'
          : pr.state === 'open'
            ? 'open'
            : 'closed',
        htmlUrl: pr.html_url,
        createdAt: pr.created_at,
        closedAt: pr.closed_at || undefined,
        mergedAt: pr.merged_at || undefined,
        author: pr.user?.login || 'unknown',
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref
      }));

      storage.batchUpsertPRRecords(records);
      return { success: true, count: records.length };
    }),

  getRemoteBranches: t.procedure
    .input(
      z.object({
        token: z.string(),
        owner: z.string(),
        repo: z.string(),
        perPage: z.number().optional()
      })
    )
    .query(async ({ input }) => {
      const github = new GitHubService(input.token);
      return github.getRemoteBranches(input.owner, input.repo, input.perPage);
    }),

  // Suggest a git branch name using LLM (reuses existing provider factory)
  suggestBranchName: t.procedure
    .input(
      z.object({
        provider: LLMProviderSchema,
        requirement: z.string().min(3),
        // Optional hint fields for better branch prefixing (no new helpers introduced)
        preferredPrefix: z.enum(['feature', 'fix', 'chore']).optional()
      })
    )
    .mutation(async ({ input }) => {
      const llm = createProvider(input.provider);
      const prefixHint =
        input.preferredPrefix ?? inferPrefix(input.requirement);

      const prompt = `You are an expert software maintainer. Generate a git branch name for the following requirement.

Strict rules:
- Output ONLY the branch name, nothing else.
- Use the pattern: <prefix>/<kebab-case-slug>
- prefix must be one of: feature, fix, chore. Prefer: ${prefixHint}
- kebab-case only: [a-z0-9-], max 48 chars for slug part
- No spaces, no underscores, no emoji, no punctuation except '-'
- If an issue number is present, include it at end like '-#123' without spaces (keep '#')

Requirement:
${input.requirement}
`;

      const { text } = await generateText({ model: llm, prompt });
      const raw = (text || '').trim();
      const sanitized = sanitizeBranchName(raw);
      if (!sanitized) {
        // Fallback simple slug
        const fallbackSlug =
          input.requirement
            .toLowerCase()
            .replace(/https?:\/\/\S+/g, '')
            .replace(/[^a-z0-9\s#-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 48) || 'update';
        return `${prefixHint}/${fallbackSlug}`;
      }
      return sanitized;
    })
});

// --- Local helpers (no new exported utilities) ---
function inferPrefix(text: string): 'feature' | 'fix' | 'chore' {
  const t = text.toLowerCase();
  if (/(bug|fix|error|fail|broken|issue)/.test(t)) return 'fix';
  if (/(refactor|infra|build|chore|deps|dependency|ci)/.test(t)) return 'chore';
  return 'feature';
}

function sanitizeBranchName(name: string): string | null {
  let trimmed = name.trim();
  // If model returned backticks or extra lines, take first line
  trimmed = trimmed.split(/\r?\n/)[0];
  // Remove leading/trailing quotes or code fences
  trimmed = trimmed.replace(/^`+|`+$/g, '').replace(/^"+|"+$/g, '');

  // Ensure prefix/slug format
  const match = trimmed.match(/^(feature|fix|chore)\/[A-Za-z0-9#\\-]+$/);
  let candidate = trimmed;
  if (!match) {
    // Try to coerce: find prefix then slug
    const prefixMatch =
      trimmed.match(/\b(feature|fix|chore)\b/i)?.[0]?.toLowerCase() ||
      'feature';
    const rest = trimmed.replace(/\b(feature|fix|chore)\b\/?/i, '');
    const slug =
      rest
        .toLowerCase()
        .replace(/[^a-z0-9#\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 48) || 'update';
    candidate = `${prefixMatch}/${slug}`;
  }

  // Final cleanup: only allow [a-z0-9-_/ and #]
  candidate = candidate
    .toLowerCase()
    .replace(/[^a-z0-9#\-\\/]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/\\-+|\\-\\/g, '/');

  // Truncate if excessively long
  if (candidate.length > 64) candidate = candidate.slice(0, 64);

  return /^(feature|fix|chore)\/[a-z0-9#\\-]+$/.test(candidate)
    ? candidate
    : null;
}
