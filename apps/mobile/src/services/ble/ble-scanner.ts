import type { BleScanner, RawBleDiscovery, BluetoothState } from './types';

/**
 * PLACEHOLDER BLE Scanner implementation.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  THIS IS A PLACEHOLDER — BLE scanning requires native modules.         ║
 * ║  JavaScript-only BLE libraries (react-native-ble-plx, etc.) are NOT    ║
 * ║  sufficient for reliable background BLE scanning with custom service    ║
 * ║  UUIDs and characteristic reads.                                       ║
 * ║                                                                        ║
 * ║  NEXT STEP: Implement native modules that conform to this interface:   ║
 * ║                                                                        ║
 * ║  iOS (Swift):                                                          ║
 * ║    - Use CoreBluetooth CBCentralManager                                ║
 * ║    - scanForPeripherals(withServices: [proximityServiceUUID])          ║
 * ║    - On discover: connect, read token characteristic, emit to JS       ║
 * ║    - Support background mode: bluetooth-central                        ║
 * ║    - Handle state restoration for backgrounded scanning                ║
 * ║                                                                        ║
 * ║  Android (Kotlin):                                                     ║
 * ║    - Use BluetoothLeScanner from BluetoothAdapter                      ║
 * ║    - startScan(filters, settings, callback)                            ║
 * ║    - ScanFilter for SERVICE_UUID                                       ║
 * ║    - ScanSettings.SCAN_MODE_LOW_LATENCY for foreground                 ║
 * ║    - ScanSettings.SCAN_MODE_LOW_POWER for background                   ║
 * ║    - On result: connect GATT, read characteristic, emit to JS          ║
 * ║                                                                        ║
 * ║  Native module interface (both platforms):                             ║
 * ║    NativeModules.ProximityBleScanner.start(): Promise<void>            ║
 * ║    NativeModules.ProximityBleScanner.stop(): Promise<void>             ║
 * ║    NativeModules.ProximityBleScanner.getState(): Promise<string>       ║
 * ║    EventEmitter: 'onBleDiscovery' -> RawBleDiscovery                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export class PlaceholderBleScanner implements BleScanner {
  private callbacks: Array<(discovery: RawBleDiscovery) => void> = [];
  private scanning = false;

  async start(): Promise<void> {
    console.log('[BLE-SCANNER] PLACEHOLDER: Would start scanning for nearby devices');
    console.log('[BLE-SCANNER] In production, this calls NativeModules.ProximityBleScanner.start()');
    this.scanning = true;
  }

  async stop(): Promise<void> {
    console.log('[BLE-SCANNER] PLACEHOLDER: Would stop scanning');
    this.scanning = false;
  }

  onDiscovery(callback: (discovery: RawBleDiscovery) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  async getState(): Promise<BluetoothState> {
    console.log('[BLE-SCANNER] PLACEHOLDER: Would check Bluetooth state via native module');
    return 'poweredOn';
  }

  /**
   * Simulate a discovery for testing. NOT for production use.
   */
  _simulateDiscovery(discovery: RawBleDiscovery): void {
    for (const cb of this.callbacks) {
      cb(discovery);
    }
  }
}
