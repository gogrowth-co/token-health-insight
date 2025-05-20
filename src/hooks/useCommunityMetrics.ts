
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';

export interface CommunityData {
  socialFollowers: string;
  socialFollowersCount: number;
  socialFollowersChange: number;
  verifiedAccount: string;
  growthRate: string;
  growthRateValue: number;
  activeChannels: string;
  activeChannelsCount: number;
  teamVisibility: string;
  communityScore: number;
  fromCache?: boolean;
}

export const useCommunityMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['communityMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<CommunityData> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching community metrics for ${normalizedToken} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      
      try {
        // First try to get data from community cache table
        const { data: communityData, error: communityError } = await supabase
          .from('token_community_cache')
          .select('*')
          .eq('token_id', normalizedToken)
          .single();
        
        // If data exists and we're not forcing a refresh, return it
        if (!forceRefresh && communityData && !communityError) {
          console.log(`Found community cache for ${normalizedToken}`);
          
          return {
            socialFollowers: communityData.social_followers || 'N/A',
            socialFollowersCount: communityData.social_followers_count || 0,
            socialFollowersChange: Number(communityData.social_followers_change) || 0,
            verifiedAccount: communityData.verified_account || 'N/A',
            growthRate: communityData.growth_rate || 'N/A',
            growthRateValue: Number(communityData.growth_rate_value) || 0,
            activeChannels: communityData.active_channels || 'N/A',
            activeChannelsCount: communityData.active_channels_count || 0,
            teamVisibility: communityData.team_visibility || 'N/A',
            communityScore: communityData.community_score || 50,
            fromCache: true
          };
        }

        // If we're forcing a refresh or no cache exists, fetch fresh data from API
        const contractAddress = tokenInfo?.contract_address || '';
        const blockchain = tokenInfo?.blockchain || 'eth';
        // Get Twitter handle from tokenInfo
        const twitterHandle = tokenInfo?.links?.twitter_screen_name || '';
        
        console.log(`Fetching fresh community data for ${normalizedToken}, twitter=${twitterHandle}`);
        
        // Fetch community data from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            blockchain: blockchain,
            twitter: twitterHandle,
            forceRefresh: forceRefresh,
            includeCommunity: true,
            mode: 'community-only'
          }
        });

        if (error) {
          console.error('Error fetching community data:', error);
          throw new Error(`Failed to fetch community data: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching community data:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched community metrics for ${normalizedToken}`);
        
        // Extract community data
        const metrics = data.metrics || {};
        
        return {
          socialFollowers: metrics.socialFollowers || 'N/A',
          socialFollowersCount: metrics.socialFollowersCount || 0,
          socialFollowersChange: metrics.socialFollowersChange || 0,
          verifiedAccount: metrics.verifiedAccount || 'N/A',
          growthRate: metrics.growthRate || 'N/A',
          growthRateValue: metrics.growthRateValue || 0,
          activeChannels: metrics.activeChannels || 'N/A',
          activeChannelsCount: metrics.activeChannelsCount || 0,
          teamVisibility: metrics.teamVisibility || 'N/A',
          communityScore: metrics.communityScore || 50,
          fromCache: false
        };
      } catch (error) {
        console.error('Exception fetching community data:', error);
        
        // Create fallback data
        const fallbackData: CommunityData = {
          socialFollowers: 'N/A',
          socialFollowersCount: 0,
          socialFollowersChange: 0,
          verifiedAccount: 'N/A',
          growthRate: 'N/A',
          growthRateValue: 0,
          activeChannels: 'N/A',
          activeChannelsCount: 0,
          teamVisibility: 'N/A',
          communityScore: 50,
          fromCache: false
        };
        
        return fallbackData;
      }
    },
    enabled: !!normalizedToken,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 0 if force refresh, otherwise 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2
  });
};
