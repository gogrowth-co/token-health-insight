
/**
 * Utility functions for handling data display and fallbacks
 */

/**
 * Returns a fallback value if the provided value is null, undefined, or empty string
 * @param value The value to check
 * @param fallback The fallback value to return if value is empty (default: "N/A")
 * @returns The original value or the fallback
 */
export const withFallback = (value: any, fallback: string = "N/A"): string => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }
  
  // Convert numbers to strings
  if (typeof value === "number") {
    return value.toString();
  }
  
  // Handle boolean values
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  
  return String(value);
};

/**
 * Determines if the data field should be displayed as a fallback
 * @param value The value to check
 * @returns boolean indicating if the value is missing/empty
 */
export const isDataMissing = (value: any): boolean => {
  return value === null || value === undefined || value === "" || value === "N/A";
};

/**
 * Get tooltip text based on data availability
 * @param value The value to check
 * @param customMessage Optional custom message for missing data
 * @returns Tooltip text
 */
export const getTooltipText = (value: any, customMessage?: string): string => {
  if (isDataMissing(value)) {
    return customMessage || "Data unavailable or unsupported";
  }
  return "";
};

/**
 * Check if a user has access to pro scan features
 * @param isProScan Whether the current scan is a pro scan
 * @param freeScansRemaining Number of free scans remaining
 * @returns boolean indicating if the user has access
 */
export const hasProAccess = (isProScan?: boolean, freeScansRemaining?: number): boolean => {
  // If the scan is explicitly marked as pro, or user has free scans remaining
  return isProScan === true || (typeof freeScansRemaining === 'number' && freeScansRemaining > 0);
};
