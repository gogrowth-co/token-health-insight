
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface DevelopmentData {
  githubActivity: string;
  githubCommits: number;
  githubContributors: number;
  lastCommitDate: string;
  developmentScore: number;
  fromCache?: boolean;
}

export const useDevelopmentMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['developmentMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<DevelopmentData> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching development metrics for ${normalizedToken} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      
      try {
        // First try to get data from development cache table
        const { data: devData, error: devError } = await supabase
          .from('token_development_cache')
          .select('*')
          .eq('token_id', normalizedToken)
          .single();
        
        // If data exists and we're not forcing a refresh, return it
        if (!forceRefresh && devData && !devError) {
          console.log(`Found development cache for ${normalizedToken}`);
          
          return {
            githubActivity: devData.github_activity || 'N/A',
            githubCommits: devData.github_commits || 0,
            githubContributors: devData.github_contributors || 0,
            lastCommitDate: devData.last_commit_date || 'N/A',
            developmentScore: devData.development_score || 50,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data from API
        const githubRepo = tokenInfo?.links?.github || '';
        
        console.log(`Fetching fresh development data for ${normalizedToken}, github=${githubRepo}`);
        
        // Fetch development data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            github: githubRepo,
            forceRefresh: forceRefresh,
            includeDevelopment: true,
            mode: 'development-only'
          }
        });

        if (error) {
          console.error('Error fetching development data:', error);
          throw new Error(`Failed to fetch development data: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching development data:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched development metrics for ${normalizedToken}`);
        
        // Extract development data
        const metrics = data.metrics || {};
        
        return {
          githubActivity: metrics.githubActivity || 'N/A',
          githubCommits: metrics.githubCommits || 0,
          githubContributors: metrics.githubContributors || 0,
          lastCommitDate: metrics.lastCommitDate || 'N/A',
          developmentScore: metrics.developmentScore || 50,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching development data:', error);
        
        // Create fallback data
        const fallbackData: DevelopmentData = {
          githubActivity: 'N/A',
          githubCommits: 0,
          githubContributors: 0,
          lastCommitDate: 'N/A',
          developmentScore: 50,
          fromCache: false
        };
        
        return fallbackData;
      }
    },
    enabled: !!normalizedToken && !!tokenInfo?.links?.github,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 0 if force refresh, otherwise 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });
};
