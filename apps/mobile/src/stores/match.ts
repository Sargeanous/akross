import { create } from 'zustand';
import type { EncounterQuality } from '@proximity/shared';
import { swipeApi } from '../services/api';

type MatchItem = {
  id: string;
  otherUserId: string;
  encounterQuality: EncounterQuality;
  eventName: string;
  chatThreadId: string | null;
  lastMessageAt: string | null;
  createdAt: string;
};

type MatchState = {
  matches: MatchItem[];
  isLoading: boolean;
  error: string | null;

  fetchMatches: () => Promise<void>;
};

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  isLoading: false,
  error: null,

  fetchMatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const matches = await swipeApi.listMatches();
      set({ matches, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },
}));
