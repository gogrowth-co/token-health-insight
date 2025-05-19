
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null, options: Intl.NumberFormatOptions = {}): string {
  if (value === undefined || value === null) {
    return 'N/A';
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
