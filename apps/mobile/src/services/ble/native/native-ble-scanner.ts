import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { BleScanner, RawBleDiscovery, BluetoothState } from '../types';

const { ProximityBleScanner: NativeScanner } = NativeModules;

/**
 * Native BLE scanner — bridges to iOS (CoreBluetooth) and Android (BluetoothLeScanner).
 *
 * Implements the BleScanner interface from @proximity/protocol.
 * Uses NativeEventEmitter to receive discovery events from the native layer.
 */
export class NativeBleScanner implements BleScanner {
  private emitter: NativeEventEmitter;
  private subscription: { remove: () => void } | null = null;
  private callbacks: Array<(discovery: RawBleDiscovery) => void> = [];

  constructor() {
    if (!NativeScanner) {
      throw new Error(
        'ProximityBleScanner native module not found. ' +
        'Make sure you are running on a real device with a dev client build (not Expo Go).'
      );
    }
    this.emitter = new NativeEventEmitter(NativeScanner);
  }

  async start(): Promise<void> {
    // Subscribe to native discovery events
    if (!this.subscription) {
      this.subscription = this.emitter.addListener('onBleDiscovery', (event: any) => {
        const discovery: RawBleDiscovery = {
          peripheralId: event.peripheralId,
          serviceUUIDs: event.serviceUUIDs ?? [],
          token: event.token,
          rssi: event.rssi,
          timestampMs: event.timestampMs,
        };
        for (const cb of this.callbacks) {
          cb(discovery);
        }
      });
    }

    await NativeScanner.start();
  }

  async stop(): Promise<void> {
    await NativeScanner.stop();
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  onDiscovery(callback: (discovery: RawBleDiscovery) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  async getState(): Promise<BluetoothState> {
    const state = await NativeScanner.getState();
    return state as BluetoothState;
  }
}
