import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null, options: Intl.NumberFormatOptions = {}): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  // Handle very small values with scientific notation
  if (value > 0 && value < 0.000001) {
    return value.toExponential(2);
  }
  
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // For large numbers, use compact notation
  if (value >= 1_000_000_000) {
    return new Intl.NumberFormat('en-US', {
      ...mergedOptions,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value);
  }
  
  // For values less than 1, show more decimal places
  if (value < 1 && value > 0 && !options.maximumFractionDigits) {
    const decimals = value < 0.01 ? 6 : value < 0.1 ? 4 : 2;
    mergedOptions.maximumFractionDigits = decimals;
    mergedOptions.minimumFractionDigits = decimals;
  }
  
  return new Intl.NumberFormat('en-US', mergedOptions).format(value);
}

export function formatPercentage(value: number | undefined | null, minimumFractionDigits: number = 2): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
    signDisplay: 'exceptZero',
  }).format(value / 100);
}

export function formatNumber(value: number | undefined | null, options: Intl.NumberFormatOptions = {}): string {
  if (value === undefined || value === null) {
    return 'N/A';
  }
  
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return new Intl.NumberFormat('en-US', mergedOptions).format(value);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) {
    return 'N/A';
  }
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
}

// Check if a value is truly empty (null, undefined, empty string or NaN)
export function isEmpty(value: any): boolean {
  return value === null || 
         value === undefined || 
         value === '' || 
         (typeof value === 'number' && isNaN(value));
}

// Create a descriptor for a value with a fallback
export function withFallback<T>(value: T | null | undefined, fallback: T): T {
  return isEmpty(value) ? fallback : value as T;
}

// Normalize token identifiers consistently 
export function normalizeTokenId(tokenId: string | null | undefined): string {
  if (!tokenId) return '';
  
  // Remove $ prefix if present, lowercase, trim spaces
  return tokenId.replace(/^\$/, '').toLowerCase().trim();
}

// Get user-friendly display version of token (keeps $ if present)
export function formatTokenDisplay(token: string | null | undefined): string {
  if (!token) return '';
  
  // Uppercase but keep $ if present
  return token.startsWith('$') 
    ? `$${token.substring(1).toUpperCase()}` 
    : token.toUpperCase();
}
