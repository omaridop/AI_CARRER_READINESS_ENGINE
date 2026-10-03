const API_BASE = 'http://localhost:3001/api';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      // Backend uses standard { data, error: string } for 400/500
      const errMsg = typeof json?.error === 'string' ? json.error : (json?.error?.message || response.statusText);
      return { data: null, error: errMsg };
    }

    // Backend uses { data: ... } for 200/201
    return { data: json?.data !== undefined ? json.data : json, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Network error' };
  }
}
