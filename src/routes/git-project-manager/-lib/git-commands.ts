// src/routes/git-project-manager/-lib/git-commands.ts

interface GitCommandResult {
  success: boolean;
  output?: string;
  stderr?: string;
  error?: string;
}

/**
 * Executes a Git command using the Electron API.
 * @param command The Git command to execute (e.g., 'status --short').
 * @param repoPath The absolute path to the Git repository.
 * @param token Optional GitHub token for authenticated operations.
 * @returns A promise that resolves to a GitCommandResult.
 */
export async function executeGitCommand(
  command: string,
  repoPath: string,
  token?: string
): Promise<GitCommandResult> {
  if (!window.electronAPI) {
    return {
      success: false,
      error:
        'Electron API not available. This function can only be called in an Electron environment.'
    };
  }
  try {
    const result = await window.electronAPI.executeGitCommand(
      command,
      repoPath,
      token
    );
    return result;
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

/**
 * Gets the status of the Git repository (modified, added, deleted files).
 * @param repoPath The absolute path to the Git repository.
 * @returns A promise that resolves to an array of changes or an error.
 */
export async function getRepoStatus(repoPath: string): Promise<{
  changes?: Array<{
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
  }>;
  error?: string;
}> {
  const result = await executeGitCommand('git status --short', repoPath);

  if (!result.success) {
    return {
      error: result.error || result.stderr || 'Failed to get repository status'
    };
  }

  const lines = (result.output || '').trim().split('\n').filter(Boolean);
  const changes = lines.map((line) => {
    const status = line.substring(0, 2).trim();
    const filePath = line.substring(2).trim();

    let changeStatus: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified';
    if (status === 'A' || status === '??') {
      changeStatus = 'added';
    } else if (status === 'M' || status === 'MM') {
      changeStatus = 'modified';
    } else if (status === 'D') {
      changeStatus = 'deleted';
    } else if (status === 'R') {
      changeStatus = 'renamed';
    }

    return {
      path: filePath,
      status: changeStatus
    };
  });

  return { changes };
}

/**
 * Gets the current branch name of the Git repository.
 * @param repoPath The absolute path to the Git repository.
 * @returns A promise that resolves to the current branch name or an error.
 */
export async function getCurrentBranch(
  repoPath: string
): Promise<{ branch?: string; error?: string }> {
  const result = await executeGitCommand('git branch --show-current', repoPath);

  if (!result.success) {
    return {
      error: result.error || result.stderr || 'Failed to get current branch'
    };
  }

  return { branch: (result.output || '').trim() };
}
