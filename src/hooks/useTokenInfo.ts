
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TokenInfoData } from "@/api/types";
import { getTokenDetails } from "@/api/coingecko";
import { formatExplorerUrl, formatGithubUrl, formatTwitterUrl } from "@/utils/linkFormatters";

export const useTokenInfo = (tokenId: string, contractAddress: string | null | undefined) => {
  const [data, setData] = useState<TokenInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tokenId) {
      setIsLoading(false);
      return;
    }

    const fetchTokenInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First try to get from cache
        const { data: cachedData } = await supabase
          .from('token_data_cache')
          .select('data')
          .eq('token_id', tokenId)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (cachedData && cachedData.data) {
          // Extract token info from cached data
          const tokenData = cachedData.data as any;
          setData({
            name: tokenData.name,
            symbol: tokenData.symbol,
            contractAddress: tokenData.etherscan?.contractAddress || contractAddress,
            description: tokenData.description,
            website: tokenData.website,
            twitterUrl: tokenData.twitterUrl,
            githubUrl: tokenData.githubUrl,
            explorerUrl: tokenData.explorerUrl,
            whitepaper: tokenData.whitepaper,
            launchDate: tokenData.launchDate,
            tokenType: tokenData.tokenType,
            network: tokenData.network
          });
          setIsLoading(false);
          return;
        }

        // If not in cache, fetch from CoinGecko
        const tokenDetails = await getTokenDetails(tokenId);
        
        if (tokenDetails) {
          // Extract information from token details
          const description = tokenDetails.description?.en;
          const website = tokenDetails.links?.homepage?.[0];
          const twitterHandle = tokenDetails.links?.twitter_screen_name;
          const githubRepo = tokenDetails.links?.repos_url?.github?.[0];
          
          // Determine token type
          let tokenType = "ERC-20 Token";
          let network = "ethereum";
          
          if (tokenDetails.asset_platform_id) {
            tokenType = `${tokenDetails.asset_platform_id.charAt(0).toUpperCase() + tokenDetails.asset_platform_id.slice(1)} Token`;
            network = tokenDetails.asset_platform_id;
          }
          
          // Use provided contract address or extract from token details
          let actualContractAddress = contractAddress;
          if (!actualContractAddress && tokenDetails.platforms) {
            for (const [platform, address] of Object.entries(tokenDetails.platforms)) {
              if (address && typeof address === 'string') {
                actualContractAddress = address;
                network = platform;
                break;
              }
            }
          }
          
          setData({
            name: tokenDetails.name,
            symbol: tokenDetails.symbol.toUpperCase(),
            contractAddress: actualContractAddress || undefined,
            description: description,
            website: website,
            twitterUrl: twitterHandle,
            githubUrl: githubRepo,
            network: network,
            tokenType: tokenType
          });
        }
      } catch (err: any) {
        console.error("Error fetching token info:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTokenInfo();
  }, [tokenId, contractAddress]);

  return { data, isLoading, error };
};
