
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface DevelopmentData {
  isOpenSource: boolean;
  commits30d: number;
  contributorsCount: number;
  lastCommit: string;
  score: number;
  // Add other properties from the database
  developmentScore: number;
  githubActivity: string;
  githubCommits: number;
  githubContributors: number;
  lastCommitDate: string;
}

export const useDevelopmentMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  const contractAddress = tokenInfo?.contract_address || '';
  
  return useQuery({
    queryKey: ['developmentMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<DevelopmentData> => {
      if (!normalizedToken && !contractAddress) {
        throw new Error('Token identifier or contract address is required');
      }

      console.log(`Fetching development metrics for ${normalizedToken || contractAddress}`);
      
      try {
        // Try to get data from token_development_cache
        const { data: devData, error: devError } = await supabase
          .from('token_development_cache')
          .select('*')
          .eq('token_id', normalizedToken || contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!forceRefresh && devData && !devError) {
          console.log('Found cached development data');
          
          return {
            isOpenSource: !!devData.github_activity,
            commits30d: devData.github_commits || 0,
            contributorsCount: devData.github_contributors || 0,
            lastCommit: devData.last_commit_date || 'N/A',
            score: devData.development_score || 50,
            developmentScore: devData.development_score || 50,
            githubActivity: devData.github_activity || 'N/A',
            githubCommits: devData.github_commits || 0,
            githubContributors: devData.github_contributors || 0,
            lastCommitDate: devData.last_commit_date || 'N/A'
          };
        }

        // If forcing refresh or no cache, get new data
        console.log('Fetching fresh development data');
        
        // Fetch data from edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            forceRefresh: true,
            includeDevelopment: true
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

        // Extract development metrics
        const metrics = data.metrics || {};
        
        return {
          isOpenSource: metrics.isOpenSource || false,
          commits30d: metrics.commits30d || 0,
          contributorsCount: metrics.contributorsCount || 0,
          lastCommit: metrics.lastCommit || 'N/A',
          score: metrics.developmentScore || 50,
          developmentScore: metrics.developmentScore || 50,
          githubActivity: metrics.githubActivity || 'N/A',
          githubCommits: metrics.githubCommits || 0,
          githubContributors: metrics.githubContributors || 0,
          lastCommitDate: metrics.lastCommitDate || 'N/A'
        };
      } catch (error) {
        console.error('Exception fetching development data:', error);
        
        // Fallback data
        return {
          isOpenSource: false,
          commits30d: 0,
          contributorsCount: 0,
          lastCommit: 'N/A',
          score: 50,
          developmentScore: 50,
          githubActivity: 'N/A',
          githubCommits: 0,
          githubContributors: 0,
          lastCommitDate: 'N/A'
        };
      }
    },
    enabled: !!normalizedToken || !!contractAddress,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2
  });
};
