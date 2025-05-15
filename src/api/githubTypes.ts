
/**
 * GitHub data types for token metrics
 */

export interface GitHubData {
  repoUrl: string;
  activityStatus: 'Active' | 'Stale' | 'Inactive';
  starCount: number;
  forkCount: number;
  commitCount: number;
  commitTrend: 'up' | 'down' | 'neutral';
  commitChange: string;
  isOpenSource: boolean;
  license?: string;
  language?: string;
  updatedAt: string;
  roadmapProgress: string;
  openIssues: number;
}
