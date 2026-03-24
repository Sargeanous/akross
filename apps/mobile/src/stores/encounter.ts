import { create } from 'zustand';
import type { EncounterQuality } from '@proximity/shared';
import { encountersApi, swipeApi } from '../services/api';

type EncounterCard = {
  id: string;
  otherUserId: string;
  quality: EncounterQuality;
  eventName: string;
  venueName: string;
  occurredAt: string;
  /** Loaded from profile API */
  profile?: {
    displayName: string;
    age: number;
    bio: string | null;
    photos: Array<{ url: string }>;
  };
};

type EncounterState = {
  encounters: EncounterCard[];
  currentIndex: number;
  isLoading: boolean;
  lastMatchId: string | null;
  error: string | null;

  fetchEncounters: () => Promise<void>;
  swipe: (direction: 'LIKE' | 'PASS') => Promise<{ isMatch: boolean; matchId?: string }>;
  clearMatchCelebration: () => void;
};

export const useEncounterStore = create<EncounterState>((set, get) => ({
  encounters: [],
  currentIndex: 0,
  isLoading: false,
  lastMatchId: null,
  error: null,

  fetchEncounters: async () => {
    set({ isLoading: true, error: null });
    try {
      const encounters = await encountersApi.list();
      set({ encounters, currentIndex: 0, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  swipe: async (direction) => {
    const { encounters, currentIndex } = get();
    const card = encounters[currentIndex];
    if (!card) throw new Error('No encounter to swipe on');

    const result = await swipeApi.submit({
      encounterId: card.id,
      targetId: card.otherUserId,
      direction,
    });

    set({ currentIndex: currentIndex + 1 });

    if (result.isMatch) {
      set({ lastMatchId: result.match?.id ?? null });
    }

    return { isMatch: result.isMatch, matchId: result.match?.id };
  },

  clearMatchCelebration: () => set({ lastMatchId: null }),
}));
