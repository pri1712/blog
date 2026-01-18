// src/lib/github.ts
export interface Repository {
  name: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  languages: {
    nodes: { name: string }[];
  };
  primaryLanguage: { name: string; color: string } | null;
  pushedAt: string;
  homepageUrl: string | null;
}

export interface GitHubStats {
  totalStars: number;
  totalRepos: number;
  topLanguages: string[];
}

/**
 * Fetches pinned repositories from GitHub GraphQL API
 */
export async function getPinnedRepos(username: string): Promise<Repository[]> {
  const query = `
    {
      user(login: "${username}") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              stargazerCount
              forkCount
              homepageUrl
              pushedAt
              primaryLanguage {
                name
                color
              }
              languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
                nodes {
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const token = import.meta.env.GITHUB_TOKEN;
    
    if (!token) {
      console.warn('GITHUB_TOKEN not found. Using public API (rate limited).');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('GraphQL errors:', errors);
      return [];
    }

    return data?.user?.pinnedItems?.nodes || [];
  } catch (error) {
    console.error('Failed to fetch pinned repos:', error);
    return [];
  }
}

/**
 * Fetches GitHub user statistics
 */
export async function getGitHubStats(username: string): Promise<GitHubStats> {
  const query = `
    {
      user(login: "${username}") {
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}) {
          totalCount
          nodes {
            stargazerCount
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const token = import.meta.env.GITHUB_TOKEN;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    const repos = data?.user?.repositories?.nodes || [];

    const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazerCount, 0);
    const languageCount: { [key: string]: number } = {};

    repos.forEach((repo: any) => {
      if (repo.primaryLanguage) {
        languageCount[repo.primaryLanguage.name] = (languageCount[repo.primaryLanguage.name] || 0) + 1;
      }
    });

    const topLanguages = Object.entries(languageCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([lang]) => lang);

    return {
      totalStars,
      totalRepos: data?.user?.repositories?.totalCount || 0,
      topLanguages,
    };
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    return { totalStars: 0, totalRepos: 0, topLanguages: [] };
  }
}

/**
 * Generates a GitHub contribution graph URL
 */
export function getContributionGraphUrl(username: string, theme: 'dark' | 'light' = 'dark'): string {
  return `https://ghchart.rshah.org/${theme === 'dark' ? '00ff41' : '000000'}/${username}`;
}