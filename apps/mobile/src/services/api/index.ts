import { api } from './client';
import type {
  AuthMethod,
  Profile,
  ProfilePhoto,
  ProximityEvent,
  Encounter,
  Match,
  ChatThread,
  Message,
  Block,
  PaginatedResponse,
  EncounterQuality,
} from '@proximity/shared';

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  requestOtp: (target: string, method: AuthMethod) =>
    api.post<{ sent: boolean }>('/auth/otp/request', { target, method }, true),

  verifyOtp: (target: string, code: string, method: AuthMethod) =>
    api.post<{
      user: { id: string; isVerified: boolean };
      accessToken: string;
      refreshToken: string;
    }>('/auth/otp/verify', { target, code, method }, true),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
      true,
    ),

  logout: (refreshToken: string) =>
    api.post<{ success: boolean }>('/auth/logout', { refreshToken }),
};

// ─── Profile API ───────────────────────────────────────────────────────────

export const profileApi = {
  create: (data: {
    displayName: string;
    birthDate: string;
    gender: string;
    genderPreferences: string[];
    bio?: string;
  }) => api.post<Profile & { photos: ProfilePhoto[] }>('/profile', data),

  getMe: () => api.get<Profile & { photos: ProfilePhoto[] }>('/profile/me'),

  update: (data: Partial<{
    displayName: string;
    gender: string;
    genderPreferences: string[];
    bio: string | null;
  }>) => api.patch<Profile & { photos: ProfilePhoto[] }>('/profile', data),

  uploadPhoto: (contentType: string) =>
    api.post<{ photo: ProfilePhoto; uploadUrl: string }>('/profile/photos', { contentType }),

  deletePhoto: (id: string) =>
    api.del<{ deleted: boolean }>(`/profile/photos/${id}`),

  getById: (id: string) =>
    api.get<Omit<Profile, 'birthDate'> & { age: number; photos: ProfilePhoto[] }>(
      `/profile/${id}`,
    ),
};

// ─── Events API ────────────────────────────────────────────────────────────

export const eventsApi = {
  list: () =>
    api.get<Array<ProximityEvent & { _count: { sessions: number } }>>('/events'),

  getById: (id: string) => api.get<ProximityEvent>(`/events/${id}`),

  join: (eventId: string) =>
    api.post<{
      session: { id: string; eventId: string; isActive: boolean };
      tokens: Array<{ token: string; issuedAt: string; expiresAt: string }>;
    }>(`/events/${eventId}/join`),
};

// ─── Encounters API ────────────────────────────────────────────────────────

export const encountersApi = {
  requestTokens: (sessionId: string) =>
    api.post<{
      tokens: Array<{ token: string; issuedAt: string; expiresAt: string }>;
    }>('/encounters/tokens', { sessionId }),

  upload: (data: {
    sessionId: string;
    platform: string;
    osVersion: string;
    observations: Array<{ observedToken: string; rssi: number; timestamp: string }>;
  }) => api.post<{ uploadId: string; observationCount: number }>('/encounters/upload', data),

  list: () =>
    api.get<
      Array<{
        id: string;
        otherUserId: string;
        quality: EncounterQuality;
        eventName: string;
        venueName: string;
        occurredAt: string;
      }>
    >('/encounters'),
};

// ─── Swipe / Match API ─────────────────────────────────────────────────────

export const swipeApi = {
  submit: (data: { encounterId: string; targetId: string; direction: 'LIKE' | 'PASS' }) =>
    api.post<{ swipe: any; match: any | null; isMatch: boolean }>('/swipe', data),

  listMatches: () =>
    api.get<
      Array<{
        id: string;
        otherUserId: string;
        encounterQuality: EncounterQuality;
        eventName: string;
        chatThreadId: string | null;
        lastMessageAt: string | null;
        createdAt: string;
      }>
    >('/swipe/matches'),
};

// ─── Chat API ──────────────────────────────────────────────────────────────

export const chatApi = {
  listThreads: () =>
    api.get<
      Array<{
        id: string;
        matchId: string;
        otherUserId: string;
        lastMessage: Message | null;
        unreadCount: number;
        lastMessageAt: string | null;
        createdAt: string;
      }>
    >('/chat/threads'),

  getMessages: (threadId: string, cursor?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return api.get<PaginatedResponse<Message>>(`/chat/threads/${threadId}/messages${qs ? `?${qs}` : ''}`);
  },

  sendMessage: (threadId: string, content: string, type: 'TEXT' | 'IMAGE' = 'TEXT') =>
    api.post<Message>(`/chat/threads/${threadId}/messages`, { content, type }),

  markRead: (threadId: string) =>
    api.post<{ success: boolean }>(`/chat/threads/${threadId}/read`),
};

// ─── Report / Block API ────────────────────────────────────────────────────

export const reportApi = {
  create: (data: { reportedId: string; reason: string; description?: string }) =>
    api.post('/report', data),

  block: (blockedId: string) => api.post<Block>('/block', { blockedId }),

  unblock: (blockId: string) => api.del(`/block/${blockId}`),

  listBlocks: () => api.get<Block[]>('/blocks'),
};
