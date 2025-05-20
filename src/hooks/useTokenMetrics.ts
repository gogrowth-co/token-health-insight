
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

// Define narrower types for database results to avoid excessive type instantiation
interface SecurityCacheData {
  security_score?: number;
  ownership_renounced?: string;
  freeze_authority?: string;
  code_audit?: string;
  multi_sig_wallet?: string;
  bug_bounty?: string;
}

interface LiquidityCacheData {
  liquidity_score?: number;
  liquidity_lock?: string;
  liquidity_lock_days?: number;
  cex_listings?: string;
  dex_depth?: string;
  dex_depth_value?: number;
  holder_distribution?: string;
  holder_distribution_value?: number;
  trading_volume_24h?: number;
  trading_volume_formatted?: string;
  trading_volume_change_24h?: number;
}

interface TokenomicsCacheData {
  tokenomics_score?: number;
  tvl_formatted?: string;
  tvl_value?: number;
  tvl_change_24h?: number;
  supply_cap_value?: number;
  supply_cap_formatted?: string;
  supply_cap_exists?: boolean;
  burn_mechanism?: string;
  token_distribution?: string;
  token_distribution_formatted?: string;
  token_distribution_rating?: string;
  token_distribution_value?: number;
  treasury_size?: number;
  treasury_size_formatted?: string;
}

interface CommunityCacheData {
  community_score?: number;
  social_followers?: string;
  social_followers_count?: number;
  social_followers_change?: number;
  verified_account?: string;
  growth_rate?: string;
  growth_rate_value?: number;
  active_channels?: string;
  active_channels_count?: number;
  team_visibility?: string;
}

interface DevelopmentCacheData {
  development_score?: number;
  github_activity?: string;
  github_commits?: number;
  github_contributors?: number;
  last_commit_date?: string;
}

interface HoldersCacheData {
  percentage?: string;
  value?: number;
  trend?: string;
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
            .maybeSingle();
            
          if (subscription && !subError) {
            freeScansRemaining = subscription.scan_limit - subscription.scan_count;
            isProScan = subscription.subscription_tier === 'pro' || freeScansRemaining > 0;
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
              if (isProScan && subscription) {
                await supabase
                  .from('subscribers')
                  .update({
                    scan_count: subscription.scan_count + 1
                  })
                  .eq('user_id', userId);
              }
            }
          }
        }
        
        // Fetch security metrics - Use typed query results
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
          
        // Cast to our specific types to avoid TypeScript errors
        const secData = securityData as SecurityCacheData | null;
        const liqData = liquidityData as LiquidityCacheData | null;
        const tokenData = tokenomicsData as TokenomicsCacheData | null;
        const commData = communityData as CommunityCacheData | null;
        const devData = developmentData as DevelopmentCacheData | null;
        const holderData = holdersData as HoldersCacheData | null;
          
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
          securityScore: secData?.security_score || 50,
          ownershipRenounced: secData?.ownership_renounced !== undefined 
            ? secData.ownership_renounced ? 'Yes' : 'No'
            : 'N/A',
          freezeAuthority: secData?.freeze_authority !== undefined
            ? secData.freeze_authority ? 'Yes' : 'No'
            : 'N/A',
          codeAudit: secData?.code_audit || 'N/A',
          multiSigWallet: secData?.multi_sig_wallet || 'N/A',
          bugBounty: secData?.bug_bounty || 'N/A',
          
          // Liquidity metrics
          liquidityLock: liqData?.liquidity_lock_days 
            ? `${liqData.liquidity_lock_days} days` 
            : 'N/A',
          liquidityLockDays: liqData?.liquidity_lock_days || 0,
          cexListings: liqData?.cex_listings 
            ? `${liqData.cex_listings} exchanges` 
            : 'N/A',
          dexDepth: liqData?.dex_depth || 'N/A',
          dexDepthValue: liqData?.dex_depth_value || 0,
          holderDistribution: liqData?.holder_distribution || 'N/A',
          holderDistributionValue: liqData?.holder_distribution_value || 0,
          tradingVolume24h: liqData?.trading_volume_24h || 0,
          tradingVolumeFormatted: liqData?.trading_volume_formatted || 'N/A',
          tradingVolumeChange24h: liqData?.trading_volume_change_24h || 0,
          
          // Tokenomics metrics
          tokenomicsScore: tokenData?.tokenomics_score || 65,
          tvl: tokenData?.tvl_formatted || 'N/A',
          tvlValue: tokenData?.tvl_value || 0,
          tvlFormatted: tokenData?.tvl_formatted || 'N/A',
          tvlChange24h: tokenData?.tvl_change_24h || 0,
          supplyCap: tokenData?.supply_cap_value ? String(tokenData.supply_cap_value) : 'N/A',
          supplyCapValue: tokenData?.supply_cap_value || 0,
          supplyCapFormatted: tokenData?.supply_cap_formatted || 'N/A',
          supplyCapExists: tokenData?.supply_cap_exists ? true : false,
          burnMechanism: tokenData?.burn_mechanism !== undefined
            ? tokenData.burn_mechanism ? 'Yes' : 'No'
            : 'N/A',
          tokenDistribution: tokenData?.token_distribution || 'N/A',
          tokenDistributionFormatted: tokenData?.token_distribution_formatted || 'N/A',
          tokenDistributionValue: tokenData?.token_distribution_value ? 1 : 0,
          tokenDistributionRating: tokenData?.token_distribution_rating || 'N/A',
          treasurySize: tokenData?.treasury_size ? String(tokenData.treasury_size) : 'N/A',
          treasurySizeFormatted: tokenData?.treasury_size_formatted || 'N/A',
          treasurySizeValue: tokenData?.treasury_size || 0,
          
          // Community metrics
          communityScore: commData?.community_score || 85,
          socialFollowers: commData?.social_followers || 'N/A',
          socialFollowersCount: commData?.social_followers_count || 0,
          socialFollowersChange: commData?.social_followers_change || 0,
          verifiedAccount: commData?.verified_account || 'N/A',
          growthRate: commData?.growth_rate || 'N/A',
          growthRateValue: commData?.growth_rate_value || 0,
          activeChannels: commData?.active_channels || 'N/A',
          activeChannelsCount: commData?.active_channels_count || 0,
          teamVisibility: commData?.team_visibility || 'N/A',
          
          // Development metrics
          developmentScore: devData?.development_score || 50,
          githubActivity: devData?.github_activity || 'N/A',
          githubCommits: devData?.github_commits || 0,
          githubContributors: devData?.github_contributors || 0,
          lastCommitDate: devData?.last_commit_date || 'N/A',
          
          // Top holders
          topHoldersPercentage: holderData?.percentage || 'N/A',
          topHoldersValue: holderData?.value || 0,
          topHoldersTrend: holderData?.trend as "up" | "down" | string || 'N/A',
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
