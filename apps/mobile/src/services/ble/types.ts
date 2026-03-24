/**
 * BLE service types — re-exported from @proximity/protocol for convenience.
 * All interfaces are implemented either as placeholders (JS) or native modules (Swift/Kotlin).
 */
export type {
  BleScanner,
  BleAdvertiser,
  BluetoothState,
  RawBleDiscovery,
  PermissionResult,
  ProximitySessionManager,
  TokenRotationManager,
} from '@proximity/protocol';
