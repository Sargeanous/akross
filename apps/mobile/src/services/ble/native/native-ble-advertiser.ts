import { NativeModules, NativeEventEmitter } from 'react-native';
import type { BleAdvertiser, BluetoothState } from '../types';

const { ProximityBleAdvertiser: NativeAdvertiser } = NativeModules;

/**
 * Native BLE advertiser — bridges to iOS (CBPeripheralManager) and Android (BluetoothLeAdvertiser).
 *
 * Implements the BleAdvertiser interface from @proximity/protocol.
 * Advertises the proximity service UUID and serves the current token via GATT.
 */
export class NativeBleAdvertiser implements BleAdvertiser {
  private emitter: NativeEventEmitter;

  constructor() {
    if (!NativeAdvertiser) {
      throw new Error(
        'ProximityBleAdvertiser native module not found. ' +
        'Make sure you are running on a real device with a dev client build (not Expo Go).'
      );
    }
    this.emitter = new NativeEventEmitter(NativeAdvertiser);
  }

  async start(token: string): Promise<void> {
    await NativeAdvertiser.start(token);
  }

  async stop(): Promise<void> {
    await NativeAdvertiser.stop();
  }

  async updateToken(token: string): Promise<void> {
    await NativeAdvertiser.updateToken(token);
  }

  async getState(): Promise<BluetoothState> {
    const state = await NativeAdvertiser.getState();
    return state as BluetoothState;
  }
}
