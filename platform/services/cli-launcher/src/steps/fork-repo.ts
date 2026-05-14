import type { GitHubConfig } from '../config.js';

export interface ForkedRepo {
  fullName: string;
  cloneUrl: string;
  htmlUrl: string;
}

// Creates a new repo from the template using GitHub's generate-from-template API.
// Forking is disabled on template repos; generate creates a fresh copy instead.
export async function forkTemplateRepo(
  config: GitHubConfig,
  agentRepoName: string,
  fetchFn: typeof fetch = fetch,
): Promise<ForkedRepo> {
  const [owner, repo] = config.templateRepo.split('/');
  if (!owner || !repo) throw new Error(`invalid templateRepo: ${config.templateRepo}`);

  const res = await fetchFn(`https://api.github.com/repos/${owner}/${repo}/generate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      owner: config.targetOrg,
      name: agentRepoName,
      include_all_branches: false,
      private: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub generate failed (${res.status}): ${text}`);
  }

  const data = await res.json() as {
    full_name: string;
    clone_url: string;
    html_url: string;
  };

  return {
    fullName: data.full_name,
    cloneUrl: data.clone_url,
    htmlUrl: data.html_url,
  };
}

// Generates a deterministic repo name from the agent name.
export function agentRepoName(agentName: string): string {
  return `agent-${agentName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}
