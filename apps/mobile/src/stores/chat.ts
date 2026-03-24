import { create } from 'zustand';
import type { Message } from '@proximity/shared';
import { chatApi } from '../services/api';
import { chatWs } from '../services/chat/websocket';

type ThreadPreview = {
  id: string;
  matchId: string;
  otherUserId: string;
  lastMessage: Message | null;
  unreadCount: number;
  lastMessageAt: string | null;
};

type ChatState = {
  threads: ThreadPreview[];
  activeThreadId: string | null;
  messages: Message[];
  hasMore: boolean;
  cursor: string | null;
  isLoading: boolean;
  error: string | null;

  fetchThreads: () => Promise<void>;
  openThread: (threadId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  markRead: (threadId: string) => Promise<void>;
  /** Handle incoming WebSocket messages */
  handleIncoming: (message: Message) => void;
  connectWs: () => Promise<void>;
  disconnectWs: () => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  threads: [],
  activeThreadId: null,
  messages: [],
  hasMore: false,
  cursor: null,
  isLoading: false,
  error: null,

  fetchThreads: async () => {
    set({ isLoading: true, error: null });
    try {
      const threads = await chatApi.listThreads();
      set({ threads, isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  openThread: async (threadId) => {
    set({ activeThreadId: threadId, messages: [], cursor: null, hasMore: false, isLoading: true });
    try {
      const result = await chatApi.getMessages(threadId);
      set({
        messages: result.data.reverse(), // API returns newest first; we display oldest first
        cursor: result.cursor,
        hasMore: result.hasMore,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  loadMoreMessages: async () => {
    const { activeThreadId, cursor, hasMore } = get();
    if (!activeThreadId || !cursor || !hasMore) return;

    const result = await chatApi.getMessages(activeThreadId, cursor);
    set((state) => ({
      messages: [...result.data.reverse(), ...state.messages],
      cursor: result.cursor,
      hasMore: result.hasMore,
    }));
  },

  sendMessage: async (content) => {
    const { activeThreadId } = get();
    if (!activeThreadId) return;

    const message = await chatApi.sendMessage(activeThreadId, content);
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  markRead: async (threadId) => {
    await chatApi.markRead(threadId);
    chatWs.sendReadReceipt(threadId);
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t,
      ),
    }));
  },

  handleIncoming: (message) => {
    const { activeThreadId } = get();

    // If this message belongs to the active thread, append it
    if (message.threadId === activeThreadId) {
      set((state) => ({ messages: [...state.messages, message] }));
    }

    // Update thread preview
    set((state) => ({
      threads: state.threads.map((t) =>
        t.id === message.threadId
          ? {
              ...t,
              lastMessage: message,
              lastMessageAt: message.createdAt as unknown as string,
              unreadCount: message.threadId === activeThreadId ? t.unreadCount : t.unreadCount + 1,
            }
          : t,
      ),
    }));
  },

  connectWs: async () => {
    await chatWs.connect();
    chatWs.onMessage((data) => {
      if (data.type === 'message') {
        get().handleIncoming(data.data);
      }
    });
  },

  disconnectWs: () => {
    chatWs.disconnect();
  },
}));
