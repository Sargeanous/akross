const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Admin API client.
 * Uses the same JWT auth as the mobile app. In production, add an admin role check.
 */
class AdminApi {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error ?? `HTTP ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  // ─── Auth ──────────────────────────────────────────────────────────

  login(target: string, code: string, method: 'PHONE' | 'EMAIL') {
    return this.request<{
      user: { id: string };
      accessToken: string;
      refreshToken: string;
    }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ target, code, method }),
    });
  }

  requestOtp(target: string, method: 'PHONE' | 'EMAIL') {
    return this.request('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ target, method }),
    });
  }

  // ─── Reports ───────────────────────────────────────────────────────

  getReports(params?: { status?: string; cursor?: string }) {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.request<any[]>(`/admin/reports${qs ? `?${qs}` : ''}`);
  }

  updateReport(id: string, data: { status?: string; resolution?: string }) {
    return this.request(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Users ─────────────────────────────────────────────────────────

  banUser(userId: string) {
    return this.request(`/admin/users/${userId}/ban`, { method: 'POST' });
  }

  // ─── Events ────────────────────────────────────────────────────────

  getEvents() {
    return this.request<any[]>('/admin/events');
  }

  createEvent(data: any) {
    return this.request('/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateEvent(id: string, data: any) {
    return this.request(`/admin/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const adminApi = new AdminApi();
