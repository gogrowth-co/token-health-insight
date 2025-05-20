
import { formatCurrency } from '@/lib/utils';

/**
 * Formats a value based on its type
 * @param value The value to format
 * @param type The type of formatting to apply: 'currency', 'percentage', 'number', etc.
 * @param fallback Fallback value if the input is missing
 * @returns Formatted string
 */
export function formatValue(
  value: string | number | undefined | null,
  type: 'currency' | 'percentage' | 'number' | 'raw' = 'raw',
  fallback: string = 'N/A'
): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  
  // Convert to number if it's a string that represents a number
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // If it's not a valid number, return the fallback
  if (typeof numValue !== 'number' || isNaN(numValue)) {
    return typeof value === 'string' ? value : fallback;
  }
  
  switch (type) {
    case 'currency':
      return formatCurrency(numValue);
    case 'percentage':
      return `${numValue.toFixed(2)}%`;
    case 'number':
      return numValue.toLocaleString();
    case 'raw':
    default:
      return String(value);
  }
}
