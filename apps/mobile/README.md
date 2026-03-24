# Proximity Mobile App

React Native (Expo bare workflow) mobile app for the proximity dating platform.

## Setup

```bash
# From the monorepo root
pnpm install

# Start the Expo dev server (requires a dev client build, NOT Expo Go)
pnpm --filter @proximity/mobile dev
```

## Build

```bash
# iOS
pnpm --filter @proximity/mobile build:ios

# Android
pnpm --filter @proximity/mobile build:android
```

## Architecture

- **Navigation**: expo-router (file-based) with auth gate
- **State**: Zustand stores (auth, profile, session, encounter, match, chat)
- **API**: Typed client with JWT auth + automatic token refresh
- **BLE**: Placeholder implementations — native modules required (see below)
- **Chat**: WebSocket real-time + REST API fallback

## BLE Native Modules (Required)

The BLE scanner and advertiser are **placeholder implementations**. They log what they would do but don't actually interact with Bluetooth hardware.

**You must build native modules for:**

- **iOS**: `CBCentralManager` (scanner) + `CBPeripheralManager` (advertiser)
- **Android**: `BluetoothLeScanner` + `BluetoothLeAdvertiser` + `BluetoothGattServer`

See `src/services/ble/ble-scanner.ts` and `src/services/ble/ble-advertiser.ts` for the exact interface spec and native module bridge comments.

**Important**: JS-only BLE libraries like `react-native-ble-plx` do NOT support BLE advertising (peripheral mode). Native modules are required.
