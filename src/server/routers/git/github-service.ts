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
    since?: string, // ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ
    per_page: number = 100
  ) {
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      since,
      per_page
    });
    return data;
  }

  async getRemoteBranches(owner: string, repo: string, per_page?: number) {
    let allBranches: string[] = [];
    let page = 1;
    const pageSize = per_page || 100; // Use 100 as default page size if per_page is not specified for single page fetch

    if (per_page === undefined) {
      // If per_page is not provided, fetch all branches
      while (true) {
        const { data } = await this.octokit.rest.repos.listBranches({
          owner,
          repo,
          per_page: 100, // Max per_page for GitHub API
          page
        });

        if (data.length === 0) {
          break;
        }

        allBranches = allBranches.concat(data.map((branch) => branch.name));
        if (data.length < 100) {
          break;
        }
        page++;
      }
    } else {
      // If per_page is provided, fetch only that many branches
      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: pageSize
      });
      allBranches = data.map((branch) => branch.name);
    }

    return allBranches;
  }

  async getOpenPullRequest(
    owner: string,
    repo: string,
    head: string,
    base: string
  ) {
    // List open PRs and strictly match by head/base refs and head repo full_name
    const { data } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 100
    });
    const fullName = `${owner}/${repo}`;
    const matches = data.filter(
      (pr) =>
        pr.state === 'open' &&
        pr.head?.ref === head &&
        pr.base?.ref === base &&
        pr.head?.repo?.full_name === fullName
    );
    if (matches.length === 0) return null;
    matches.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return matches[0];
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
