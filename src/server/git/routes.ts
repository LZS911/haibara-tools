import { GitHubService } from './github-service';
import { z } from 'zod';
import { GitAssistantService } from '../llm/git-assistant';
import { LLMProviderSchema, PRActivitySchema } from '../../types/llm';
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
        changeDescription: z.string(), // Added for LLM
        llmProvider: LLMProviderSchema, // Added for LLM
        prTitle: z.string().optional() // Optional PR title
      })
    )
    .mutation(async ({ input }) => {
      const gitAssistant = new GitAssistantService(input.llmProvider);
      const commitMessage = await gitAssistant.generateCommitMessage(
        input.changeDescription
      );
      const prTitle = input.prTitle || commitMessage; // Use custom title if provided, else use commit message

      const github = new GitHubService(input.token);

      // Check if a PR already exists for this head and base branch
      const existingPR = await github.getOpenPullRequest(
        input.owner,
        input.repo,
        input.head,
        input.base
      );

      if (existingPR) {
        // If PR exists, update its description
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
    })
});
