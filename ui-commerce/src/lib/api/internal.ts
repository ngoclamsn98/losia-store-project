/**
 * Internal API client for Next.js API routes
 * Used for calling /api/* and /orders/* routes within the same Next.js app
 */

export interface InternalApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * Generic internal API fetch wrapper
 */
async function internalApiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    credentials: 'include', // Include cookies for session/auth
    cache: 'no-store',
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(endpoint, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const error: InternalApiError = data;
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Internal API Error:', error);
    throw error;
  }
}

/**
 * GET request to internal API
 */
export async function internalGet<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
  const queryString = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : '';

  return internalApiClient<T>(`${endpoint}${queryString}`, {
    method: 'GET',
  });
}

/**
 * POST request to internal API
 */
export async function internalPost<T>(endpoint: string, body?: any): Promise<T> {
  return internalApiClient<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request to internal API
 */
export async function internalPatch<T>(endpoint: string, body?: any): Promise<T> {
  return internalApiClient<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request to internal API
 */
export async function internalDelete<T>(endpoint: string): Promise<T> {
  return internalApiClient<T>(endpoint, {
    method: 'DELETE',
  });
}

