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
  marketCap?: number;
  marketCapFormatted?: string;
  
  // Scores
  overallScore?: number;
  securityScore?: number;
  liquidityScore?: number;
  tokenomicsScore?: number;
  communityScore?: number;
  developmentScore?: number;
  
  // Security metrics
  ownershipRenounced?: string;
  ownershipRenouncedValue?: boolean;
  freezeAuthority?: string;
  codeAudit?: string;
  multiSigWallet?: string;
  bugBounty?: string;
  
  // Liquidity metrics
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
  
  // Tokenomics metrics
  tvlValue?: number;
  tvlFormatted?: string;
  tvlChange24h?: number;
  supplyCapValue?: number;
  supplyCapFormatted?: string;
  supplyCapExists?: boolean;
  burnMechanism?: string;
  tokenDistributionFormatted?: string;
  tokenDistributionValue?: number;
  tokenDistributionRating?: string;
  treasurySizeFormatted?: string;
  treasurySizeValue?: number;
  
  // Community metrics
  socialFollowers?: string;
  socialFollowersCount?: number;
  socialFollowersChange?: number;
  verifiedAccount?: string;
  growthRate?: string;
  growthRateValue?: number;
  activeChannels?: string;
  activeChannelsCount?: number;
  teamVisibility?: string;
  
  // Development metrics
  githubActivity?: string;
  githubCommits?: number;
  githubContributors?: number;
  lastCommitDate?: string;
  
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
        
        // Fetch metrics from our edge function
        const { data, error } = await supabase.functions.invoke('get-token-metrics', {
          body: { 
            token: normalizedToken,
            address: contractAddress,
            twitter: twitterHandle,
            github: githubRepo,
            blockchain: blockchain,
            forceRefresh: forceRefresh,
            includeHolders: true, // Make sure to request detailed holders data
            includeSecurity: true, // Request security data
            includeLiquidity: true, // Request liquidity data
            sources: {
              marketCap: 'coingecko',
              tvl: 'coingecko',
              auditStatus: 'etherscan',
              topHolders: 'goplus',
              liquidityLock: 'etherscan',
              security: 'goplus',
              liquidity: 'geckoterminal'
            }
          }
        });

        if (error) {
          console.error('Error fetching token metrics:', error);
          throw new Error(`Failed to fetch token metrics: ${error.message}`);
        }

        if (data.error) {
          console.error('API error fetching token metrics:', data.error);
          throw new Error(data.error);
        }

        console.log(`Successfully fetched metrics for ${normalizedToken}:`, data.metrics);
        
        // If we have market cap from tokenInfo but not from metrics, use it
        if (tokenInfo?.market_cap && (!data.metrics.marketCapValue || data.metrics.marketCapValue === 0)) {
          data.metrics.marketCapValue = tokenInfo.market_cap;
          data.metrics.marketCapFormatted = formatCurrency(tokenInfo.market_cap);
        }

        // If we have price from tokenInfo but not from metrics, use it
        if (tokenInfo?.current_price && (!data.metrics.price || data.metrics.price === 0)) {
          data.metrics.price = tokenInfo.current_price;
        }

        // If we have price change from tokenInfo but not from metrics, use it
        if (tokenInfo?.price_change_percentage_24h && (!data.metrics.priceChange24h || data.metrics.priceChange24h === 0)) {
          data.metrics.priceChange24h = tokenInfo.price_change_percentage_24h;
        }
        
        // Add information about whether data came from cache
        if (data.socialFollowersFromCache !== undefined) {
          data.metrics.socialFollowersFromCache = data.socialFollowersFromCache;
        }

        // Override socialFollowers with "Coming Soon" since we're not using that feature yet
        data.metrics.socialFollowers = "Coming Soon";
        data.metrics.socialFollowersCount = 0;
        data.metrics.socialFollowersChange = 0;
        
        // Process ownership renounced status from security data
        if (data.securityData && contractAddress) {
          console.log("Processing security data for ownership renounced status:", data.securityData);
          
          // Handle ownership renounced status
          if (data.securityData.is_open_source === false) {
            // If code isn't open source, we can't verify ownership status reliably
            data.metrics.ownershipRenounced = "Unknown";
          } else {
            // Check if owner_address is null or empty, which often indicates renounced ownership
            if (!data.securityData.owner_address || 
                data.securityData.owner_address === "0x0000000000000000000000000000000000000000" || 
                data.securityData.owner_type === "no_owner") {
              data.metrics.ownershipRenounced = "Yes";
            } else {
              data.metrics.ownershipRenounced = "No";
            }
          }
          
          // Handle freeze authority - use the enhanced logic from the edge function
          if (data.securityData.is_blacklisted === "1" || data.securityData.has_blacklist === "1") {
            data.metrics.freezeAuthority = "Yes";
          } else if (data.securityData.is_whitelisted === "1") {
            data.metrics.freezeAuthority = "Yes";
          } else if (data.securityData.can_take_back_ownership === "1") {
            data.metrics.freezeAuthority = "Yes";
          } else if (data.securityData.has_mint_function === "1") {
            data.metrics.freezeAuthority = "Yes";
          } else if (data.securityData.is_proxy === "1") {
            data.metrics.freezeAuthority = "Possible";
          } else if (data.securityData.is_open_source === true || data.securityData.is_open_source === "1") {
            data.metrics.freezeAuthority = "No";
          } else {
            data.metrics.freezeAuthority = "N/A";
          }
        } else {
          data.metrics.ownershipRenounced = "N/A";
          data.metrics.freezeAuthority = "N/A";
        }
        
        // Set default values for security metrics that are not yet implemented
        data.metrics.codeAudit = "Coming Soon";
        data.metrics.multiSigWallet = "Coming Soon";
        data.metrics.bugBounty = "Coming Soon";
        
        // Calculate a simple security score based on the available metrics
        let securityScore = 50; // Base score
        
        // Adjust security score based on ownership renounced
        if (data.metrics.ownershipRenounced === "Yes") {
          securityScore += 20;
        } else if (data.metrics.ownershipRenounced === "No") {
          securityScore -= 5;
        }
        
        // Adjust security score based on freeze authority
        if (data.metrics.freezeAuthority === "No") {
          securityScore += 15;
        } else if (data.metrics.freezeAuthority === "Yes") {
          securityScore -= 10;
        } else if (data.metrics.freezeAuthority === "Possible") {
          securityScore -= 5;
        }
        
        data.metrics.securityScore = securityScore;
        
        // Set default values for liquidity metrics if they don't exist
        if (!data.metrics.dexDepth) {
          data.metrics.dexDepth = "Coming Soon";
        }
        
        if (!data.metrics.cexListings) {
          data.metrics.cexListings = "Coming Soon";
        }
        
        // Calculate a simple liquidity score based on available metrics
        let liquidityScore = 65; // Base score
        
        // Adjust liquidity score based on market cap
        if (data.metrics.marketCapValue > 1000000000) { // > $1B
          liquidityScore += 15;
        } else if (data.metrics.marketCapValue > 100000000) { // > $100M
          liquidityScore += 10;
        } else if (data.metrics.marketCapValue > 10000000) { // > $10M
          liquidityScore += 5;
        } else if (data.metrics.marketCapValue < 1000000) { // < $1M
          liquidityScore -= 10;
        }
        
        // Adjust liquidity score based on liquidity lock
        if (data.metrics.liquidityLockDays > 180) {
          liquidityScore += 10;
        } else if (data.metrics.liquidityLockDays > 30) {
          liquidityScore += 5;
        } else if (data.metrics.liquidityLock === "Not Found" || data.metrics.liquidityLock === "Unlocked") {
          liquidityScore -= 15;
        }
        
        // Adjust liquidity score based on holder distribution
        if (data.metrics.topHoldersValue > 0) {
          if (data.metrics.topHoldersValue > 80) {
            liquidityScore -= 15; // Concentrated holders (risky)
          } else if (data.metrics.topHoldersValue < 40) {
            liquidityScore += 10; // Well distributed
          }
        }
        
        data.metrics.liquidityScore = liquidityScore;
        
        return data.metrics as TokenMetrics;
      } catch (error) {
        console.error('Exception fetching token metrics:', error);
        
        // Create a minimal metrics object with data from tokenInfo if available
        if (tokenInfo) {
          const fallbackMetrics: Partial<TokenMetrics> = {
            marketCapFormatted: tokenInfo.market_cap ? formatCurrency(tokenInfo.market_cap) : 'N/A',
            marketCapValue: tokenInfo.market_cap || 0,
            marketCapChange24h: tokenInfo.price_change_percentage_24h || 0,
            price: tokenInfo.current_price || 0,
            priceChange24h: tokenInfo.price_change_percentage_24h || 0,
            liquidityLock: 'N/A',
            liquidityLockDays: 0,
            topHoldersPercentage: 'N/A',
            topHoldersValue: 0,
            topHoldersTrend: null,
            tvl: 'N/A',
            tvlValue: 0,
            tvlChange24h: 0,
            auditStatus: 'N/A',
            socialFollowers: 'Coming Soon',
            socialFollowersCount: 0,
            socialFollowersChange: 0,
            socialFollowersFromCache: false,
            ownershipRenounced: 'N/A',
            freezeAuthority: 'N/A',
            codeAudit: 'Coming Soon',
            multiSigWallet: 'Coming Soon',
            bugBounty: 'Coming Soon',
            securityScore: 50,
            liquidityScore: 65,
            dexDepth: 'Coming Soon',
            cexListings: 'Coming Soon',
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
