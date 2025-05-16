/**
 * Formats a URL by ensuring it has the https:// prefix
 */
export function formatUrl(url?: string): string | undefined {
  if (!url) return undefined;
  
  // Remove trailing slashes for consistency
  url = url.trim().replace(/\/+$/, '');
  
  if (!url) return undefined;
  
  // Add https:// prefix if no protocol is specified
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Formats a Twitter URL from handle or URL
 */
export function formatTwitterUrl(handle?: string): string | undefined {
  if (!handle) return undefined;
  
  // Clean up the handle
  handle = handle.trim().replace(/^@/, '');
  
  if (!handle) return undefined;
  
  // If it's already a URL, format it
  if (handle.includes('twitter.com') || handle.includes('x.com')) {
    return formatUrl(handle);
  }
  
  // Otherwise, create a Twitter URL from the handle
  return `https://twitter.com/${handle}`;
}

/**
 * Formats a GitHub URL from repo or URL
 */
export function formatGithubUrl(repo?: string): string | undefined {
  if (!repo) return undefined;
  
  // Clean up the repo
  repo = repo.trim();
  
  if (!repo) return undefined;
  
  // If it's already a URL, format it
  if (repo.includes('github.com')) {
    return formatUrl(repo);
  }
  
  // Otherwise, create a GitHub URL from the repo
  return `https://github.com/${repo}`;
}

/**
 * Formats an Ethereum block explorer URL for a contract address
 */
export function formatExplorerUrl(contractAddress?: string, network: string = 'ethereum'): string | undefined {
  if (!contractAddress) return undefined;
  
  // Clean up the address
  contractAddress = contractAddress.trim();
  
  if (!contractAddress) return undefined;
  
  // Choose the appropriate explorer based on the network
  switch (network.toLowerCase()) {
    case 'eth':
    case 'ethereum':
      return `https://etherscan.io/token/${contractAddress}`;
    case 'bsc':
    case 'binance':
      return `https://bscscan.com/token/${contractAddress}`;
    case 'polygon':
      return `https://polygonscan.com/token/${contractAddress}`;
    case 'avalanche':
      return `https://snowtrace.io/token/${contractAddress}`;
    case 'arbitrum':
      return `https://arbiscan.io/token/${contractAddress}`;
    case 'optimism':
      return `https://optimistic.etherscan.io/token/${contractAddress}`;
    default:
      return `https://etherscan.io/token/${contractAddress}`;
  }
}

/**
 * Truncates an Ethereum address for display
 */
export function truncateAddress(address?: string, chars: number = 4): string {
  if (!address) return 'Unknown';
  if (address.length <= chars * 2) return address;
  
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Formats a date string for display
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'Unknown';
  }
}
