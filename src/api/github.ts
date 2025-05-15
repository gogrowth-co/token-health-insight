
/**
 * GitHub API integration service
 * Provides methods to fetch repository and commit data from GitHub
 */

const GITHUB_API_BASE_URL = "https://api.github.com";

// GitHub API response types
export interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  open_issues_count: number;
  stargazers_count: number;
  forks_count: number;
  license?: {
    key: string;
    name: string;
    spdx_id: string;
  };
  pushed_at: string;
  updated_at: string;
  created_at: string;
  default_branch: string;
  visibility: string;
  is_template: boolean;
  topics: string[];
  language: string;
  archived: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
}

export interface GitHubCommitActivity {
  total: number;
  week: number;
  days: number[];
}

// Main function to fetch repository info
export async function getRepoInfo(owner: string, repo: string): Promise<GitHubRepo | null> {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`);

    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub repo info:", error);
    return null;
  }
}

// Fetch recent commits
export async function getRepoCommits(owner: string, repo: string, days = 30): Promise<GitHubCommit[]> {
  try {
    // Calculate date from X days ago
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceString = since.toISOString();

    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/commits?since=${sinceString}&per_page=100`
    );

    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return [];
  }
}

// Get commit activity for the past year
export async function getCommitActivity(owner: string, repo: string): Promise<GitHubCommitActivity[] | null> {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/stats/commit_activity`
    );

    if (!response.ok) {
      console.warn(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub commit activity:", error);
    return null;
  }
}

// Extract GitHub repo info from URL or links 
export function extractGitHubRepoFromUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Handle different GitHub URL formats
    const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const matches = url.match(githubRegex);
    
    if (matches && matches.length >= 3) {
      const owner = matches[1];
      // Remove .git extension or query parameters if present
      let repo = matches[2].split('.git')[0].split('#')[0].split('?')[0];
      
      return { owner, repo };
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting GitHub repo from URL:", error);
    return null;
  }
}

// Find GitHub repo from token details
export function findGitHubRepoFromTokenDetails(tokenDetails: any): { owner: string; repo: string } | null {
  // Check token links
  if (tokenDetails?.links?.repos_url?.github?.length > 0) {
    for (const url of tokenDetails.links.repos_url.github) {
      const repoInfo = extractGitHubRepoFromUrl(url);
      if (repoInfo) return repoInfo;
    }
  }
  
  // Check homepage for GitHub links
  if (tokenDetails?.links?.homepage?.length > 0) {
    for (const url of tokenDetails.links.homepage) {
      if (url.includes('github.com')) {
        const repoInfo = extractGitHubRepoFromUrl(url);
        if (repoInfo) return repoInfo;
      }
    }
  }
  
  return null;
}

// Calculate activity status based on commit frequency
export function calculateGitHubActivityStatus(commits: GitHubCommit[], commitActivity: GitHubCommitActivity[] | null): {
  status: 'Active' | 'Stale' | 'Inactive';
  commitCount: number;
  commitTrend: 'up' | 'down' | 'neutral';
  commitChange: string;
  lastCommitDate: string | null;
} {
  // Default values
  const result = {
    status: 'Inactive' as 'Active' | 'Stale' | 'Inactive',
    commitCount: 0,
    commitTrend: 'neutral' as 'up' | 'down' | 'neutral',
    commitChange: '0%',
    lastCommitDate: null as string | null
  };
  
  // Get commit count for the last 30 days
  result.commitCount = commits.length;
  
  // Get the date of the most recent commit
  if (commits.length > 0) {
    result.lastCommitDate = commits[0].commit.author.date;
  }
  
  // Determine activity status based on commit frequency
  if (result.commitCount > 10) {
    result.status = 'Active';
  } else if (result.commitCount > 0) {
    result.status = 'Stale';
  }
  
  // Calculate commit trend using commit activity data
  if (commitActivity && commitActivity.length >= 8) {
    // Sum up commits from the last 4 weeks and the 4 weeks before that
    const lastFourWeeks = commitActivity.slice(0, 4).reduce((sum, week) => sum + week.total, 0);
    const previousFourWeeks = commitActivity.slice(4, 8).reduce((sum, week) => sum + week.total, 0);
    
    if (previousFourWeeks === 0) {
      if (lastFourWeeks > 0) {
        result.commitTrend = 'up';
        result.commitChange = 'New';
      }
    } else {
      const change = ((lastFourWeeks - previousFourWeeks) / previousFourWeeks) * 100;
      result.commitChange = `${change > 0 ? '+' : ''}${change.toFixed(0)}%`;
      
      if (change > 5) {
        result.commitTrend = 'up';
      } else if (change < -5) {
        result.commitTrend = 'down';
      }
    }
  }
  
  return result;
}

/**
 * Calculate a rough estimate of roadmap progress based on repository data
 */
export function calculateRoadmapProgress(repoDetails: GitHubRepo): string {
  // In a real implementation, this would analyze milestones, issues, or project boards
  // For now, returning a placeholder calculation based on issues and repository age
  
  // If there are no open issues, consider it complete
  if (repoDetails.open_issues_count === 0) {
    return "100%";
  }
  
  // Base the calculation on the ratio of open issues to repository age
  const creationDate = new Date(repoDetails.created_at);
  const now = new Date();
  const ageInDays = Math.ceil((now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Older repositories with fewer open issues are considered further along
  const issuesPerDay = repoDetails.open_issues_count / ageInDays;
  
  if (issuesPerDay < 0.01) {
    return "90%";
  } else if (issuesPerDay < 0.05) {
    return "75%";
  } else if (issuesPerDay < 0.1) {
    return "60%";
  } else if (issuesPerDay < 0.5) {
    return "40%";
  } else {
    return "25%";
  }
}
