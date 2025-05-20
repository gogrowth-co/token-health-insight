
/**
 * Utility functions for formatting data values
 */

/**
 * Format a date as a time ago string (e.g., "2 hours ago", "3 days ago")
 * @param dateString The date string to format
 * @returns Formatted string showing time passed since date
 */
export const formatTimeAgo = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) {
      return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
    }
    if (minutes < 60) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (days < 7) {
      return days === 1 ? '1 day ago' : `${days} days ago`;
    }
    if (weeks < 4) {
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    if (months < 12) {
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    return years === 1 ? '1 year ago' : `${years} years ago`;
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

/**
 * Format a number as a compact representation (e.g., 1.2K, 3.5M)
 * @param value The number to format
 * @returns Formatted string representation
 */
export const formatCompactNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Format a number as currency (USD)
 * @param value The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

/**
 * Format a percentage value
 * @param value The number to format as percentage
 * @param fractionDigits Number of decimal places
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, fractionDigits = 2): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value / 100);
};

/**
 * Format a string or number value to the appropriate format
 * @param value The value to format
 * @param type The type of formatting to apply
 * @returns Formatted string
 */
export const formatValue = (value: string | number, type: 'currency' | 'percentage' | 'compact' = 'compact'): string => {
  if (typeof value === 'string') {
    // Try to parse the string as a number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return value; // Return the original string if it's not a number
    }
    value = numValue;
  }

  switch (type) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'compact':
      return formatCompactNumber(value);
    default:
      return String(value);
  }
};
