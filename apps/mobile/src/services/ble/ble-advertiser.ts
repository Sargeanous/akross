import type { BleAdvertiser, BluetoothState } from './types';

/**
 * PLACEHOLDER BLE Advertiser implementation.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  THIS IS A PLACEHOLDER — BLE advertising requires native modules.      ║
 * ║  react-native-ble-plx and similar JS libraries do NOT support BLE      ║
 * ║  peripheral/advertiser mode. You MUST write native modules.            ║
 * ║                                                                        ║
 * ║  NEXT STEP: Implement native modules that conform to this interface:   ║
 * ║                                                                        ║
 * ║  iOS (Swift):                                                          ║
 * ║    - Use CoreBluetooth CBPeripheralManager                             ║
 * ║    - Create CBMutableService with proximityServiceUUID                 ║
 * ║    - Create CBMutableCharacteristic with tokenCharacteristicUUID       ║
 * ║    - startAdvertising([CBAdvertisementDataServiceUUIDsKey: [uuid]])    ║
 * ║    - On read request: respond with current token bytes                 ║
 * ║    - Support background mode: bluetooth-peripheral                     ║
 * ║    - Handle peripheralManager(_:didReceiveRead:) for token reads       ║
 * ║                                                                        ║
 * ║  Android (Kotlin):                                                     ║
 * ║    - Use BluetoothLeAdvertiser from BluetoothAdapter                   ║
 * ║    - BluetoothGattServer for hosting the GATT service                  ║
 * ║    - AdvertiseSettings.Builder().setAdvertiseMode(LOW_LATENCY)         ║
 * ║    - AdvertiseData.Builder().addServiceUuid(proximityServiceUUID)      ║
 * ║    - Handle onCharacteristicReadRequest for token value                ║
 * ║    - Use a foreground service for reliable background advertising      ║
 * ║                                                                        ║
 * ║  Native module interface (both platforms):                             ║
 * ║    NativeModules.ProximityBleAdvertiser.start(token): Promise<void>    ║
 * ║    NativeModules.ProximityBleAdvertiser.stop(): Promise<void>          ║
 * ║    NativeModules.ProximityBleAdvertiser.updateToken(token): void       ║
 * ║    NativeModules.ProximityBleAdvertiser.getState(): Promise<string>    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export class PlaceholderBleAdvertiser implements BleAdvertiser {
  private currentToken: string | null = null;
  private advertising = false;

  async start(token: string): Promise<void> {
    console.log(`[BLE-ADVERTISER] PLACEHOLDER: Would start advertising token: ${token.slice(0, 8)}...`);
    console.log('[BLE-ADVERTISER] In production, this calls NativeModules.ProximityBleAdvertiser.start()');
    this.currentToken = token;
    this.advertising = true;
  }

  async stop(): Promise<void> {
    console.log('[BLE-ADVERTISER] PLACEHOLDER: Would stop advertising');
    this.advertising = false;
    this.currentToken = null;
  }

  async updateToken(token: string): Promise<void> {
    console.log(`[BLE-ADVERTISER] PLACEHOLDER: Would update advertised token to: ${token.slice(0, 8)}...`);
    this.currentToken = token;
  }

  async getState(): Promise<BluetoothState> {
    console.log('[BLE-ADVERTISER] PLACEHOLDER: Would check Bluetooth state via native module');
    return 'poweredOn';
  }
}
