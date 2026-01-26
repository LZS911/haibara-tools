import { Octokit } from 'octokit';
import type { GitHubSyncConfig, GitHubFileInfo, Document } from '@/types/docs';
import { getConfig } from '../../lib/config';

// GitHub 文档同步服务
export class GitHubDocsSyncService {
  private octokit: Octokit;
  private config: GitHubSyncConfig;

  constructor(token: string, config: GitHubSyncConfig) {
    this.octokit = new Octokit({ auth: token });
    this.config = config;
  }

  // 获取当前用户信息
  async getCurrentUser(): Promise<{ login: string; name: string | null }> {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return { login: data.login, name: data.name };
  }

  // 获取用户的所有仓库
  async listRepos(): Promise<
    Array<{
      name: string;
      fullName: string;
      private: boolean;
      defaultBranch: string;
    }>
  > {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      type: 'owner',
      sort: 'updated',
      per_page: 100
    });

    return data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch || 'main'
    }));
  }

  // 创建新仓库
  async createRepo(
    name: string,
    description: string,
    isPrivate = true
  ): Promise<{
    name: string;
    fullName: string;
    defaultBranch: string;
    htmlUrl: string;
  }> {
    const { data } = await this.octokit.rest.repos.createForAuthenticatedUser({
      name,
      description,
      private: isPrivate,
      auto_init: true // 自动初始化 README
    });

    return {
      name: data.name,
      fullName: data.full_name,
      defaultBranch: data.default_branch || 'main',
      htmlUrl: data.html_url
    };
  }

  // 获取仓库目录内容
  async getRepoContents(
    owner: string,
    repo: string,
    path = ''
  ): Promise<GitHubFileInfo[]> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: this.config.branch
      });

      if (Array.isArray(data)) {
        return data.map((item) => ({
          name: item.name,
          path: item.path,
          sha: item.sha,
          size: item.size || 0,
          type: item.type as 'file' | 'dir',
          downloadUrl: item.download_url || undefined
        }));
      }

      // 单个文件
      return [
        {
          name: data.name,
          path: data.path,
          sha: data.sha,
          size: data.size || 0,
          type: data.type as 'file' | 'dir',
          downloadUrl: data.download_url || undefined
        }
      ];
    } catch (error) {
      // 如果目录不存在，返回空数组
      if ((error as { status?: number }).status === 404) {
        return [];
      }
      throw error;
    }
  }

  // 获取文件内容
  async getFileContent(
    owner: string,
    repo: string,
    path: string
  ): Promise<{ content: string; sha: string } | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: this.config.branch
      });

      if (Array.isArray(data) || data.type !== 'file') {
        return null;
      }

      // 解码 base64 内容
      const content = Buffer.from(data.content || '', 'base64').toString(
        'utf-8'
      );
      return { content, sha: data.sha };
    } catch (error) {
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      throw error;
    }
  }

  // 创建或更新文件
  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha?: string // 如果是更新，需要提供文件的 SHA
  ): Promise<{ sha: string; path: string }> {
    // 如果没有提供 SHA，尝试获取现有文件的 SHA
    let fileSha = sha;
    if (!fileSha) {
      const existing = await this.getFileContent(owner, repo, path);
      if (existing) {
        fileSha = existing.sha;
      }
    }

    const params: {
      owner: string;
      repo: string;
      path: string;
      message: string;
      content: string;
      branch: string;
      sha?: string;
    } = {
      owner,
      repo,
      path,
      message,
      content: Buffer.from(content, 'utf-8').toString('base64'),
      branch: this.config.branch
    };

    if (fileSha) {
      params.sha = fileSha;
    }

    const { data } =
      await this.octokit.rest.repos.createOrUpdateFileContents(params);

    return {
      sha: data.content?.sha || '',
      path: data.content?.path || path
    };
  }

  // 上传图片（二进制文件）
  async uploadImage(
    owner: string,
    repo: string,
    path: string,
    imageData: Buffer,
    message: string
  ): Promise<{ sha: string; path: string; downloadUrl: string }> {
    // 检查文件是否已存在
    const existing = await this.getFileContent(owner, repo, path);

    const params: {
      owner: string;
      repo: string;
      path: string;
      message: string;
      content: string;
      branch: string;
      sha?: string;
    } = {
      owner,
      repo,
      path,
      message,
      content: imageData.toString('base64'),
      branch: this.config.branch
    };

    if (existing) {
      params.sha = existing.sha;
    }

    const { data } =
      await this.octokit.rest.repos.createOrUpdateFileContents(params);

    return {
      sha: data.content?.sha || '',
      path: data.content?.path || path,
      downloadUrl: data.content?.download_url || ''
    };
  }

  // 删除文件
  async deleteFile(
    owner: string,
    repo: string,
    path: string,
    message: string
  ): Promise<boolean> {
    const existing = await this.getFileContent(owner, repo, path);
    if (!existing) {
      return false;
    }

    await this.octokit.rest.repos.deleteFile({
      owner,
      repo,
      path,
      message,
      sha: existing.sha,
      branch: this.config.branch
    });

    return true;
  }

  // 同步文档到 GitHub
  async syncDocToGitHub(
    owner: string,
    repo: string,
    doc: Document
  ): Promise<{ path: string; sha: string }> {
    const fileName = `${sanitizeFileName(doc.meta.title)}.md`;
    const filePath = this.config.directory
      ? `${this.config.directory}/${fileName}`
      : fileName;

    // 构建文档内容（添加 frontmatter）
    const frontmatter = [
      '---',
      `id: ${doc.meta.id}`,
      `title: ${doc.meta.title}`,
      doc.meta.description ? `description: ${doc.meta.description}` : '',
      doc.meta.tags.length > 0 ? `tags: [${doc.meta.tags.join(', ')}]` : '',
      `created: ${new Date(doc.meta.createdAt).toISOString()}`,
      `updated: ${new Date(doc.meta.updatedAt).toISOString()}`,
      '---',
      ''
    ]
      .filter(Boolean)
      .join('\n');

    const fullContent = frontmatter + doc.content;

    const result = await this.createOrUpdateFile(
      owner,
      repo,
      filePath,
      fullContent,
      `Update doc: ${doc.meta.title}`
    );

    return {
      path: result.path,
      sha: result.sha
    };
  }

  // 从 GitHub 拉取文档
  async pullDocFromGitHub(
    owner: string,
    repo: string,
    path: string
  ): Promise<{
    title: string;
    content: string;
    description?: string;
    tags?: string[];
  } | null> {
    const file = await this.getFileContent(owner, repo, path);
    if (!file) {
      return null;
    }

    // 解析 frontmatter
    const parsed = parseFrontmatter(file.content);
    return {
      title: (parsed.frontmatter.title as string) || path.replace(/\.md$/, ''),
      content: parsed.content,
      description: parsed.frontmatter.description as string | undefined,
      tags: parsed.frontmatter.tags as string[] | undefined
    };
  }

  // 检查目录是否存在，如果不存在则创建
  async ensureDirectory(
    owner: string,
    repo: string,
    path: string
  ): Promise<void> {
    const contents = await this.getRepoContents(owner, repo, path);
    if (contents.length === 0) {
      // 创建一个 .gitkeep 文件来确保目录存在
      await this.createOrUpdateFile(
        owner,
        repo,
        `${path}/.gitkeep`,
        '',
        `Create directory: ${path}`
      );
    }
  }
}

// 辅助函数：清理文件名
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '') // 移除非法字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .toLowerCase()
    .slice(0, 100); // 限制长度
}

// 辅助函数：解析 frontmatter
function parseFrontmatter(content: string): {
  frontmatter: Record<string, string | string[] | undefined>;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length);

  const frontmatter: Record<string, string | string[] | undefined> = {};
  const lines = frontmatterStr.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();

      // 处理数组值 [item1, item2]
      if (value.startsWith('[') && value.endsWith(']')) {
        frontmatter[key] = value
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return { frontmatter, content: body };
}

// 创建服务实例的工厂函数
export async function createGitHubDocsSyncService(
  config: GitHubSyncConfig
): Promise<GitHubDocsSyncService | null> {
  const appConfig = await getConfig();
  const token = appConfig.GITHUB_TOKEN;

  if (!token) {
    return null;
  }

  return new GitHubDocsSyncService(token, config);
}
