
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TokenInfo } from './useTokenInfo';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

export interface TopHolderEntry {
  address: string;
  percentage: number;
  value?: string;
}

export interface TokenMetrics {
  // Token Identification
  tokenId?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  contract_address?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
  
  // Market data
  price?: number;
  priceChange24h?: number;
  marketCap?: string;
  marketCapValue?: number;
  marketCapFormatted?: string;
  marketCapChange24h?: number;
  
  // Scores
  overallScore?: number;
  securityScore?: number;
  liquidityScore?: number;
  tokenomicsScore?: number;
  communityScore?: number;
  developmentScore?: number;
  
  // Security metrics (from token_security_cache)
  ownershipRenounced?: string;
  ownershipRenouncedValue?: boolean;
  freezeAuthority?: string;
  codeAudit?: string;
  multiSigWallet?: string;
  bugBounty?: string;
  
  // Liquidity metrics (from token_liquidity_cache)
  liquidityLock?: string;
  liquidityLockDays?: number;
  cexListings?: string;
  dexDepth?: string;
  dexDepthValue?: number;
  holderDistribution?: string;
  holderDistributionValue?: number;
  tradingVolume24h?: number;
  tradingVolumeFormatted?: string;
  tradingVolumeChange24h?: number;
  
  // Tokenomics metrics (from token_tokenomics_cache)
  tvl?: string;
  tvlValue?: number;
  tvlFormatted?: string;
  tvlChange24h?: number;
  supplyCap?: string;
  supplyCapValue?: number;
  supplyCapFormatted?: string;
  supplyCapExists?: boolean;
  burnMechanism?: string;
  tokenDistribution?: string;
  tokenDistributionFormatted?: string;
  tokenDistributionValue?: number;
  tokenDistributionRating?: string;
  treasurySize?: string;
  treasurySizeFormatted?: string;
  treasurySizeValue?: number;
  
  // Community metrics (from token_community_cache)
  socialFollowers?: string;
  socialFollowersCount?: number;
  socialFollowersChange?: number;
  socialFollowersFromCache?: boolean;
  verifiedAccount?: string;
  growthRate?: string;
  growthRateValue?: number;
  activeChannels?: string;
  activeChannelsCount?: number;
  teamVisibility?: string;
  
  // Development metrics (from token_development_cache)
  githubActivity?: string;
  githubCommits?: number;
  githubContributors?: number;
  lastCommitDate?: string;
  
  // Top holders data
  topHolders?: TopHolderEntry[];
  topHoldersPercentage?: string;
  topHoldersValue?: number;
  topHoldersTrend?: "up" | "down" | string;
  
  // Audit status
  auditStatus?: string;
  
  // Scan metadata
  scanId?: string;
  isProScan?: boolean;
  freeScansRemaining?: number;
  
  // Cache metadata
  fromCache?: boolean;
}

export interface TokenMetadata {
  name?: string;
  symbol?: string;
  logo?: string;
  contract_address?: string;
  blockchain?: string;
  twitter?: string;
  github?: string;
}

export const useTokenMetrics = (
  tokenIdentifier?: string | null,
  tokenInfo?: TokenInfo | null,
  refreshTrigger: number = 0,
  forceRefresh: boolean = false,
  tokenMetadata?: TokenMetadata
) => {
  const normalizedToken = tokenIdentifier?.replace(/^\$/, '').toLowerCase() || '';
  
  return useQuery({
    queryKey: ['tokenMetrics', normalizedToken, refreshTrigger, forceRefresh],
    queryFn: async (): Promise<TokenMetrics> => {
      if (!normalizedToken) {
        throw new Error('Token identifier is required');
      }

      console.log(`Fetching token metrics for ${normalizedToken} (refresh: ${refreshTrigger}, force: ${forceRefresh})`);
      console.log('Token metadata:', tokenMetadata);
      
      try {
        // Get contract address and social handles from tokenInfo or tokenMetadata if available
        const contractAddress = tokenMetadata?.contract_address || tokenInfo?.contract_address || '';
        const twitterHandle = tokenMetadata?.twitter || tokenInfo?.links?.twitter_screen_name || tokenInfo?.twitter || '';
        const githubRepo = tokenMetadata?.github || tokenInfo?.links?.github || '';
        const blockchain = tokenMetadata?.blockchain || tokenInfo?.blockchain || 'eth';
        
        console.log(`Using data for metrics: Contract=${contractAddress}, Twitter=${twitterHandle}, GitHub=${githubRepo}, Blockchain=${blockchain}`);
        
        // First check if the user has pro access
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        let isProScan = false;
        let freeScansRemaining = 0;
        
        if (userId) {
          // Check subscription status
          const { data: subscription, error: subError } = await supabase
            .from('subscribers')
            .select('*')
            .eq('user_id', userId)
            .single();
            
          if (subscription && !subError) {
            freeScansRemaining = subscription.scan_limit - subscription.scan_count;
            isProScan = subscription.plan === 'pro' || freeScansRemaining > 0;
          } else {
            // If no subscription record, user is on free plan with default scans
            freeScansRemaining = 3; // Default free scan limit
            isProScan = freeScansRemaining > 0;
          }
          
          // Record this scan
          if (contractAddress) {
            const { data: scanData, error: scanError } = await supabase
              .from('token_scans')
              .insert({
                user_id: userId,
                token_address: contractAddress,
                pro_scan: isProScan,
                token_id: normalizedToken,
                token_symbol: tokenInfo?.symbol || tokenMetadata?.symbol || '',
                token_name: tokenInfo?.name || tokenMetadata?.name || ''
              })
              .select()
              .single();
              
            if (scanError) {
              console.warn('Error recording scan:', scanError);
            } else if (scanData) {
              console.log('Scan recorded with ID:', scanData.id);
              
              // Update scan count if this is a pro scan
              if (isProScan) {
                await supabase
                  .from('subscribers')
                  .upsert({
                    user_id: userId,
                    scan_count: subscription ? subscription.scan_count + 1 : 1
                  }, {
                    onConflict: 'user_id'
                  });
              }
            }
          }
        }
        
        // Fetch security metrics
        const { data: securityData, error: securityError } = await supabase
          .from('token_security_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        // Fetch liquidity metrics  
        const { data: liquidityData, error: liquidityError } = await supabase
          .from('token_liquidity_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        // Fetch tokenomics metrics
        const { data: tokenomicsData, error: tokenomicsError } = await supabase
          .from('token_tokenomics_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        // Fetch community metrics
        const { data: communityData, error: communityError } = await supabase
          .from('token_community_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        // Fetch development metrics
        const { data: developmentData, error: developmentError } = await supabase
          .from('token_development_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .order('last_updated', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        // Fetch top holders
        const { data: holdersData, error: holdersError } = await supabase
          .from('token_holders_cache')
          .select('*')
          .eq('token_address', contractAddress)
          .maybeSingle();
          
        // Combine all metrics
        const metrics: TokenMetrics = {
          tokenId: normalizedToken,
          contract_address: contractAddress,
          name: tokenInfo?.name || tokenMetadata?.name,
          symbol: tokenInfo?.symbol || tokenMetadata?.symbol,
          logo: tokenInfo?.image || tokenMetadata?.logo,
          blockchain: blockchain,
          twitter: twitterHandle,
          github: githubRepo,
          
          // Market data
          price: tokenInfo?.current_price,
          priceChange24h: tokenInfo?.price_change_percentage_24h,
          marketCapValue: tokenInfo?.market_cap || 0,
          marketCapFormatted: tokenInfo?.market_cap ? formatCurrency(tokenInfo.market_cap) : 'N/A',
          marketCapChange24h: tokenInfo?.price_change_percentage_24h || 0,
          
          // Scan metadata
          isProScan,
          freeScansRemaining,
          
          // Security metrics
          securityScore: securityData?.security_score || 50,
          ownershipRenounced: securityData?.ownership_renounced !== undefined 
            ? securityData.ownership_renounced ? 'Yes' : 'No'
            : 'N/A',
          freezeAuthority: securityData?.freeze_authority !== undefined
            ? securityData.freeze_authority ? 'Yes' : 'No'
            : 'N/A',
          codeAudit: securityData?.code_audit || 'N/A',
          multiSigWallet: securityData?.multi_sig_wallet || 'N/A',
          bugBounty: securityData?.bug_bounty || 'N/A',
          
          // Liquidity metrics
          liquidityScore: liquidityData?.liquidity_score || 65,
          liquidityLock: liquidityData?.liquidity_locked_days 
            ? `${liquidityData.liquidity_locked_days} days` 
            : 'N/A',
          liquidityLockDays: liquidityData?.liquidity_locked_days || 0,
          cexListings: liquidityData?.cex_listings 
            ? `${liquidityData.cex_listings} exchanges` 
            : 'N/A',
          dexDepth: liquidityData?.dex_depth || 'N/A',
          dexDepthValue: liquidityData?.dex_depth_value || 0,
          holderDistribution: liquidityData?.holder_distribution || 'N/A',
          holderDistributionValue: liquidityData?.holder_distribution_value || 0,
          tradingVolume24h: liquidityData?.trading_volume_24h || 0,
          tradingVolumeFormatted: liquidityData?.trading_volume_formatted || 'N/A',
          tradingVolumeChange24h: liquidityData?.trading_volume_change_24h || 0,
          
          // Tokenomics metrics
          tokenomicsScore: tokenomicsData?.tokenomics_score || 65,
          tvl: tokenomicsData?.tvl_formatted || 'N/A',
          tvlValue: tokenomicsData?.tvl_usd || 0,
          tvlFormatted: tokenomicsData?.tvl_formatted || 'N/A',
          tvlChange24h: tokenomicsData?.tvl_change_24h || 0,
          supplyCap: tokenomicsData?.supply_cap ? String(tokenomicsData.supply_cap) : 'N/A',
          supplyCapValue: tokenomicsData?.supply_cap || 0,
          supplyCapFormatted: tokenomicsData?.supply_cap ? formatCurrency(tokenomicsData.supply_cap) : 'N/A',
          supplyCapExists: tokenomicsData?.supply_cap ? true : false,
          burnMechanism: tokenomicsData?.burn_mechanism !== undefined
            ? tokenomicsData.burn_mechanism ? 'Yes' : 'No'
            : 'N/A',
          tokenDistribution: tokenomicsData?.vesting_schedule || 'N/A',
          tokenDistributionFormatted: tokenomicsData?.distribution_score || 'N/A',
          tokenDistributionValue: tokenomicsData?.distribution_score ? 1 : 0,
          tokenDistributionRating: tokenomicsData?.distribution_score || 'N/A',
          treasurySize: tokenomicsData?.treasury_usd ? String(tokenomicsData.treasury_usd) : 'N/A',
          treasurySizeFormatted: tokenomicsData?.treasury_usd ? formatCurrency(tokenomicsData.treasury_usd) : 'N/A',
          treasurySizeValue: tokenomicsData?.treasury_usd || 0,
          
          // Community metrics
          communityScore: communityData?.community_score || 85,
          socialFollowers: communityData?.social_followers || 'N/A',
          socialFollowersCount: communityData?.social_followers_count || 0,
          socialFollowersChange: communityData?.social_followers_change || 0,
          verifiedAccount: communityData?.verified_account || 'N/A',
          growthRate: communityData?.growth_rate || 'N/A',
          growthRateValue: communityData?.growth_rate_value || 0,
          activeChannels: communityData?.active_channels || 'N/A',
          activeChannelsCount: communityData?.active_channels_count || 0,
          teamVisibility: communityData?.team_visibility || 'N/A',
          
          // Development metrics
          developmentScore: developmentData?.development_score || 50,
          githubActivity: developmentData?.github_activity || 'N/A',
          githubCommits: developmentData?.github_commits || 0,
          githubContributors: developmentData?.github_contributors || 0,
          lastCommitDate: developmentData?.last_commit_date || 'N/A',
          
          // Top holders
          topHoldersPercentage: holdersData?.percentage || 'N/A',
          topHoldersValue: holdersData?.value || 0,
          topHoldersTrend: holdersData?.trend as "up" | "down" | string || 'N/A',
        };
        
        console.log('Combined metrics:', metrics);
        
        return metrics;
      } catch (error) {
        console.error('Exception fetching token metrics:', error);
        
        // Create a minimal metrics object with data from tokenInfo if available
        if (tokenInfo) {
          const fallbackMetrics: Partial<TokenMetrics> = {
            tokenId: normalizedToken,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            blockchain: tokenInfo.blockchain || 'ethereum',
            contract_address: tokenInfo.contract_address,
            marketCapFormatted: tokenInfo.market_cap ? formatCurrency(tokenInfo.market_cap) : 'N/A',
            marketCapValue: tokenInfo.market_cap || 0,
            marketCapChange24h: tokenInfo.price_change_percentage_24h || 0,
            price: tokenInfo.current_price || 0,
            priceChange24h: tokenInfo.price_change_percentage_24h || 0,
            
            // Default scores
            securityScore: 50,
            liquidityScore: 65,
            tokenomicsScore: 65,
            communityScore: 85,
            developmentScore: 50,
            
            // Default N/A values
            liquidityLock: 'N/A',
            liquidityLockDays: 0,
            topHoldersPercentage: 'N/A',
            topHoldersValue: 0,
            topHoldersTrend: 'N/A',
            tvl: 'N/A',
            tvlValue: 0,
            tvlChange24h: 0,
            auditStatus: 'N/A',
            socialFollowers: 'N/A',
            socialFollowersCount: 0,
            socialFollowersChange: 0,
            socialFollowersFromCache: false,
            ownershipRenounced: 'N/A',
            freezeAuthority: 'N/A',
            codeAudit: 'N/A',
            multiSigWallet: 'N/A',
            bugBounty: 'N/A',
            topHolders: []
          };
          
          return fallbackMetrics as TokenMetrics;
        }
        
        // Show more helpful error messages in UI
        if ((error as Error).message?.includes('Failed to fetch')) {
          throw new Error('Unable to connect to our servers. Please check your internet connection.');
        } else if ((error as Error).message?.includes('API error')) {
          throw new Error('Error communicating with token metrics API. Please try again later.');
        }
        
        throw error;
      }
    },
    enabled: !!normalizedToken,
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 0 if force refresh, otherwise 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2, // Increase retries to 2
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });
};
