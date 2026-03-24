import { Platform } from 'react-native';
import { BLE } from '@proximity/shared';
import { ClientTokenRotationManager } from '@proximity/protocol';
import { PlaceholderBleScanner } from './ble-scanner';
import { PlaceholderBleAdvertiser } from './ble-advertiser';
import { encountersApi, eventsApi } from '../api';
import type { BleObservation } from '@proximity/shared';
import type { RawBleDiscovery } from './types';

/**
 * ProximitySessionOrchestrator — coordinates the full BLE scanning session lifecycle.
 *
 * Flow:
 * 1. User joins an event → API returns token batch + session ID
 * 2. Orchestrator loads tokens into the rotation manager
 * 3. Starts the BLE scanner (listens for nearby tokens)
 * 4. Starts the BLE advertiser (broadcasts our current token)
 * 5. Token rotation manager cycles through tokens at the configured interval
 * 6. Scanner collects observations (other people's tokens + RSSI)
 * 7. On session end: uploads all observations to the API for backend validation
 */
export class ProximitySessionOrchestrator {
  private scanner = new PlaceholderBleScanner();
  private advertiser = new PlaceholderBleAdvertiser();
  private tokenManager = new ClientTokenRotationManager();
  private observations: BleObservation[] = [];
  private unsubscribeDiscovery: (() => void) | null = null;
  private tokenRotationUnsub: (() => void) | null = null;

  private sessionId: string | null = null;
  private eventId: string | null = null;
  private _isActive = false;

  get isActive(): boolean {
    return this._isActive;
  }

  get observationCount(): number {
    return this.observations.length;
  }

  get remainingTokens(): number {
    return this.tokenManager.remainingTokens();
  }

  /**
   * Start a proximity session for an event.
   * Joins the event, receives tokens, and begins scanning + advertising.
   */
  async startSession(eventId: string): Promise<void> {
    if (this._isActive) {
      throw new Error('Session already active. Stop current session first.');
    }

    // 1. Join the event and get tokens from the API
    const { session, tokens } = await eventsApi.join(eventId);
    this.sessionId = session.id;
    this.eventId = eventId;
    this.observations = [];
    this._isActive = true;

    // 2. Set up token rotation — when tokens run low, fetch more from the API
    this.tokenManager.onTokensLow(async (remaining) => {
      console.log(`[SESSION] Tokens running low (${remaining} remaining), fetching more...`);
      try {
        const { tokens: newTokens } = await encountersApi.requestTokens(this.sessionId!);
        this.tokenManager.start(
          newTokens.map((t) => t.token),
          BLE.TOKEN_ROTATION_INTERVAL_S * 1000,
        );
      } catch (err) {
        console.error('[SESSION] Failed to fetch new tokens:', err);
      }
    });

    // 3. Load tokens and start rotation
    const tokenStrings = tokens.map((t) => t.token);
    this.tokenManager.start(tokenStrings, BLE.TOKEN_ROTATION_INTERVAL_S * 1000);

    // 4. Start advertising with the first token
    const firstToken = this.tokenManager.getCurrentToken();
    if (firstToken) {
      await this.advertiser.start(firstToken);
    }

    // 5. Set up token rotation → update advertiser when token changes
    // Poll the token manager to detect token changes
    let lastToken = firstToken;
    const rotationInterval = setInterval(() => {
      const current = this.tokenManager.getCurrentToken();
      if (current && current !== lastToken) {
        lastToken = current;
        this.advertiser.updateToken(current);
      }
    }, 1000);
    this.tokenRotationUnsub = () => clearInterval(rotationInterval);

    // 6. Start scanning and collect observations
    this.unsubscribeDiscovery = this.scanner.onDiscovery((discovery: RawBleDiscovery) => {
      this.observations.push({
        observedToken: discovery.token,
        rssi: discovery.rssi,
        timestamp: new Date(discovery.timestampMs).toISOString(),
      });
    });

    await this.scanner.start();
    console.log(`[SESSION] Started session ${this.sessionId} for event ${eventId}`);
  }

  /**
   * Stop the session and upload observations to the backend.
   */
  async stopSession(): Promise<{ observationCount: number; uploaded: boolean }> {
    if (!this._isActive || !this.sessionId) {
      throw new Error('No active session.');
    }

    // Stop BLE
    await this.scanner.stop();
    await this.advertiser.stop();
    this.tokenManager.stop();

    // Clean up subscriptions
    this.unsubscribeDiscovery?.();
    this.tokenRotationUnsub?.();

    const count = this.observations.length;
    let uploaded = false;

    // Upload observations if we have any
    if (count > 0) {
      try {
        await encountersApi.upload({
          sessionId: this.sessionId,
          platform: Platform.OS,
          osVersion: Platform.Version?.toString() ?? 'unknown',
          observations: this.observations,
        });
        uploaded = true;
      } catch (err) {
        console.error('[SESSION] Failed to upload observations:', err);
        // Observations are lost — in production, persist to local storage for retry
      }
    }

    this._isActive = false;
    const result = { observationCount: count, uploaded };

    this.sessionId = null;
    this.eventId = null;
    this.observations = [];

    console.log(`[SESSION] Stopped. Observations: ${count}, Uploaded: ${uploaded}`);
    return result;
  }
}

/** Singleton orchestrator instance */
export const sessionOrchestrator = new ProximitySessionOrchestrator();
