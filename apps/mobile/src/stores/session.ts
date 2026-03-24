import { create } from 'zustand';
import { sessionOrchestrator } from '../services/ble/session-manager';
import { eventsApi } from '../services/api';
import type { ProximityEvent } from '@proximity/shared';

type SessionState = {
  events: Array<ProximityEvent & { _count: { sessions: number } }>;
  activeEventId: string | null;
  isScanning: boolean;
  observationCount: number;
  sessionStartedAt: Date | null;
  isLoading: boolean;
  error: string | null;

  fetchEvents: () => Promise<void>;
  startSession: (eventId: string) => Promise<void>;
  stopSession: () => Promise<{ observationCount: number; uploaded: boolean }>;
  /** Poll the orchestrator for latest observation count */
  refreshCount: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  events: [],
  activeEventId: null,
  isScanning: false,
  observationCount: 0,
  sessionStartedAt: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const events = await eventsApi.list();
      set({ events, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  startSession: async (eventId) => {
    set({ isLoading: true, error: null });
    try {
      await sessionOrchestrator.startSession(eventId);
      set({
        activeEventId: eventId,
        isScanning: true,
        sessionStartedAt: new Date(),
        observationCount: 0,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  stopSession: async () => {
    set({ isLoading: true });
    try {
      const result = await sessionOrchestrator.stopSession();
      set({
        activeEventId: null,
        isScanning: false,
        sessionStartedAt: null,
        observationCount: result.observationCount,
        isLoading: false,
      });
      return result;
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  refreshCount: () => {
    set({ observationCount: sessionOrchestrator.observationCount });
  },
}));
