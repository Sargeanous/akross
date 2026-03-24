import Constants from 'expo-constants';
import { getTokens } from '../auth/token-storage';

const WS_URL = Constants.expoConfig?.extra?.wsUrl ?? 'ws://localhost:3000';

type MessageHandler = (data: { type: string; data: any }) => void;

/**
 * WebSocket connection manager for real-time chat.
 *
 * Connects to the server's /chat/ws endpoint with the JWT token.
 * Receives new messages in real-time and can send read receipts.
 * Handles reconnection with exponential backoff.
 */
class ChatWebSocket {
  private ws: WebSocket | null = null;
  private handlers: MessageHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private _isConnected = false;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    const tokens = await getTokens();
    if (!tokens?.accessToken) {
      console.log('[WS] No access token, skipping connection');
      return;
    }

    // Close existing connection
    this.disconnect();

    // Append token as query param (WebSocket doesn't support custom headers natively)
    this.ws = new WebSocket(`${WS_URL}/chat/ws?token=${tokens.accessToken}`);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this._isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        for (const handler of this.handlers) {
          handler(data);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this._isConnected = false;
      console.log('[WS] Disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // Prevent reconnect on intentional close
      this.ws.close();
      this.ws = null;
    }
    this._isConnected = false;
    this.reconnectAttempts = 0;
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  sendReadReceipt(threadId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'read', threadId }));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

export const chatWs = new ChatWebSocket();
