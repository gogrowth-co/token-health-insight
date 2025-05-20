
export const formatCurrency = (value: number): string => {
  if (!value && value !== 0) return "N/A";
  
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

export const formatNumber = (value: number): string => {
  if (!value && value !== 0) return "N/A";
  
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  } else {
    return value.toFixed(2);
  }
};

export const formatPercentage = (value: number): string => {
  if (!value && value !== 0) return "N/A";
  
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const formatRating = (value: number): string => {
  if (value >= 80) return "Excellent";
  if (value >= 70) return "Good";
  if (value >= 50) return "Average";
  if (value >= 30) return "Fair";
  return "Poor";
};

// Format time ago function
export const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  
  const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

