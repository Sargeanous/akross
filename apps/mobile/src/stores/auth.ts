import { create } from 'zustand';
import type { AuthMethod, User } from '@proximity/shared';
import { authApi } from '../services/api';
import { setTokens, clearTokens, getTokens } from '../services/auth/token-storage';

type AuthState = {
  user: Pick<User, 'id' | 'isVerified'> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  /** Check if tokens exist on app launch */
  checkAuth: () => Promise<void>;
  /** Request OTP or magic link */
  requestOtp: (target: string, method: AuthMethod) => Promise<void>;
  /** Verify OTP code */
  verifyOtp: (target: string, code: string, method: AuthMethod) => Promise<void>;
  /** Log out */
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  checkAuth: async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.accessToken) {
        // We have tokens; try to fetch the profile to validate them
        set({ isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  requestOtp: async (target, method) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.requestOtp(target, method);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Failed to send code' });
    }
  },

  verifyOtp: async (target, code, method) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authApi.verifyOtp(target, code, method);
      await setTokens(result.accessToken, result.refreshToken);
      set({
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message ?? 'Verification failed' });
    }
  },

  logout: async () => {
    try {
      const tokens = await getTokens();
      if (tokens?.refreshToken) {
        await authApi.logout(tokens.refreshToken).catch(() => {});
      }
    } finally {
      await clearTokens();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
