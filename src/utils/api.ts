interface ApiOptions extends RequestInit {
  timeout?: number;
}

export async function apiClient<T = any>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...fetchOptions,
    signal: controller.signal,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    clearTimeout(id);

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      }
      throw new Error('Unauthorized session. Redirecting to login.');
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'API request failed');
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

apiClient.get = <T = any>(url: string, options?: ApiOptions) => 
  apiClient<T>(url, { ...options, method: 'GET' });

apiClient.post = <T = any>(url: string, body: any, options?: ApiOptions) => 
  apiClient<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) });

apiClient.put = <T = any>(url: string, body: any, options?: ApiOptions) => 
  apiClient<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) });

apiClient.delete = <T = any>(url: string, options?: ApiOptions) => 
  apiClient<T>(url, { ...options, method: 'DELETE' });
