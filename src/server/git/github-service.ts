import { Octokit } from 'octokit';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchUserRepos() {
    const { data } = await this.octokit.rest.repos.listForAuthenticatedUser({
      type: 'owner'
    });
    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      private: repo.private,
      htmlUrl: repo.html_url,
      owner: repo.owner,
      description: repo.description,
      url: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      stargazersCount: repo.stargazers_count,
      watchersCount: repo.watchers_count,
      forksCount: repo.forks_count
    }));
  }

  async createPR(
    owner: string,
    repo: string,
    head: string,
    base: string,
    title: string,
    body: string
  ) {
    const { data } = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head,
      base,
      body
    });
    return data;
  }

  async getRepoPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'all',
    since?: string // ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
  ) {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      since
    });
    return data;
  }

  async getRemoteBranches(owner: string, repo: string) {
    const { data } = await this.octokit.rest.repos.listBranches({
      owner,
      repo
    });
    return data.map((branch) => branch.name);
  }

  async getOpenPullRequest(
    owner: string,
    repo: string,
    head: string,
    base: string
  ) {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      head,
      base
    });
    return data.length > 0 ? data[0] : null;
  }

  async updatePullRequest(
    owner: string,
    repo: string,
    pull_number: number,
    title: string,
    body: string
  ) {
    const { data } = await this.octokit.rest.pulls.update({
      owner,
      repo,
      pull_number,
      title,
      body
    });
    return data;
  }
}
