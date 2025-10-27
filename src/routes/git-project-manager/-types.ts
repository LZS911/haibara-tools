// Git 仓库类型
export interface GitRepository {
  id: string;
  name: string;
  localPath: string;
  githubOwner: string;
  githubRepo: string;
  defaultBranch: string;
  createdAt: number;
  updatedAt: number;
}

// 文件变更类型
export interface FileChange {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string; // for renamed files
}

// PR 记录类型
export interface PRRecord {
  id: number;
  repositoryId: string;
  title: string;
  number: number;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  createdAt: string;
  closedAt?: string;
  mergedAt?: string;
  author: string;
  baseBranch: string;
  headBranch: string;
}

// 周报生成选项
export interface WeeklyReportOptions {
  repositoryIds: string[];
  startTime: string;
  endTime: string;
  selectedPRIds: number[];
}

// 提交并创建 PR 的参数
export interface CommitAndPRParams {
  repositoryId: string;
  changeDescription: string;
  commitMessage: string;
  targetBranch: string;
}
