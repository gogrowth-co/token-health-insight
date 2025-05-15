
/**
 * Fetch with timeout utility
 * @param url URL to fetch
 * @param options Fetch options
 * @param timeout Timeout in milliseconds (default: 10000ms)
 * @returns Promise with fetch response
 */
export async function fetchWithTimeout<T = any>(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Alias for fetchWithTimeout with JSON response
 */
export const fetchJsonWithTimeout = fetchWithTimeout;
