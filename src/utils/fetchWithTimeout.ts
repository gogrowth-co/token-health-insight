
/**
 * Utility function to execute fetch requests with timeout support
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise with the fetch response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  
  clearTimeout(id);
  return response;
}

/**
 * Utility function to fetch JSON with timeout support
 */
export async function fetchJsonWithTimeout<T>(
  url: string, 
  options: RequestInit = {}, 
  timeoutMs: number = 10000
): Promise<T> {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json() as T;
}
