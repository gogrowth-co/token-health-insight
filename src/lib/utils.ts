
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
