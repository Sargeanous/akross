import Constants from 'expo-constants';
import { getTokens, setTokens, clearTokens } from '../auth/token-storage';

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip auth header (for login/refresh endpoints) */
  noAuth?: boolean;
};

/**
 * Typed API client with JWT auth header injection and automatic token refresh.
 *
 * Every authenticated request includes the access token. If the server returns 401,
 * we attempt a single token refresh and retry the original request. If the refresh
 * also fails, we clear tokens and throw so the auth store can redirect to login.
 */
class ApiClient {
  private refreshPromise: Promise<void> | null = null;

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, noAuth = false } = options;

    if (!noAuth) {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
    }

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Attempt token refresh on 401
    if (response.status === 401 && !noAuth) {
      await this.refreshToken();
      // Retry with new token
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      }
      const retry = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retry.ok) {
        const err = await retry.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(retry.status, err.error ?? 'Request failed');
      }
      return retry.json();
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new ApiError(response.status, err.error ?? 'Request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;

    return response.json();
  }

  private async refreshToken(): Promise<void> {
    // Deduplicate concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.refreshToken) {
          await clearTokens();
          throw new ApiError(401, 'No refresh token');
        }

        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
          await clearTokens();
          throw new ApiError(401, 'Token refresh failed');
        }

        const newTokens = await response.json();
        await setTokens(newTokens.accessToken, newTokens.refreshToken);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ─── Convenience methods ─────────────────────────────────────────────

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown, noAuth = false) {
    return this.request<T>(path, { method: 'POST', body, noAuth });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, { method: 'PATCH', body });
  }

  del<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = new ApiClient();
