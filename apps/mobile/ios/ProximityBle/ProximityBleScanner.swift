import CoreBluetooth
import React

/// Constants shared between scanner and advertiser.
/// These must match the values in @proximity/shared constants.ts
struct ProximityBleConstants {
    static let serviceUUID = CBUUID(string: "0000FE50-0000-1000-8000-00805F9B34FB")
    static let tokenCharacteristicUUID = CBUUID(string: "0000FE51-0000-1000-8000-00805F9B34FB")
}

// ─── Scanner ─────────────────────────────────────────────────────────────────

/// Native BLE scanner using CoreBluetooth CBCentralManager.
///
/// Scans for peripherals advertising the proximity service UUID, connects to
/// read the token characteristic, and emits discoveries to JavaScript.
///
/// Background support: The CBCentralManager is initialized with
/// `CBCentralManagerOptionRestoreIdentifierKey` so iOS can relaunch the app
/// and restore scanning state after it's been suspended.
@objc(ProximityBleScanner)
class ProximityBleScanner: RCTEventEmitter, CBCentralManagerDelegate, CBPeripheralDelegate {

    private var centralManager: CBCentralManager!
    private var isScanning = false
    private var hasListeners = false

    /// Track peripherals we're currently connecting to / reading from
    private var pendingPeripherals: [UUID: CBPeripheral] = [:]

    /// Debounce: don't re-read from the same peripheral within this interval
    private var lastReadTime: [UUID: Date] = [:]
    private let readDebounceInterval: TimeInterval = 2.0

    override init() {
        super.init()
        centralManager = CBCentralManager(
            delegate: self,
            queue: DispatchQueue(label: "com.proximity.ble.scanner", qos: .userInitiated),
            options: [
                CBCentralManagerOptionRestoreIdentifierKey: "com.proximity.scanner",
                CBCentralManagerOptionShowPowerAlertKey: true
            ]
        )
    }

    // MARK: - RCTEventEmitter

    override static func requiresMainQueueSetup() -> Bool { false }

    override func supportedEvents() -> [String]! {
        ["onBleDiscovery", "onBleScannerStateChange"]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving() { hasListeners = false }

    // MARK: - JS-callable methods

    @objc func start(_ resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
        guard centralManager.state == .poweredOn else {
            reject("BLE_NOT_READY", "Bluetooth is not powered on (state: \(centralManager.state.rawValue))", nil)
            return
        }

        centralManager.scanForPeripherals(
            withServices: [ProximityBleConstants.serviceUUID],
            options: [
                CBCentralManagerScanOptionAllowDuplicatesKey: true // Required for RSSI updates
            ]
        )
        isScanning = true
        resolve(nil)
    }

    @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
        centralManager.stopScan()
        isScanning = false

        // Disconnect any pending peripherals
        for (_, peripheral) in pendingPeripherals {
            centralManager.cancelPeripheralConnection(peripheral)
        }
        pendingPeripherals.removeAll()
        resolve(nil)
    }

    @objc func getState(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
        resolve(mapState(centralManager.state))
    }

    // MARK: - CBCentralManagerDelegate

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let state = mapState(central.state)
        if hasListeners {
            sendEvent(withName: "onBleScannerStateChange", body: ["state": state])
        }

        // Resume scanning after Bluetooth powers back on
        if central.state == .poweredOn && isScanning {
            central.scanForPeripherals(
                withServices: [ProximityBleConstants.serviceUUID],
                options: [CBCentralManagerScanOptionAllowDuplicatesKey: true]
            )
        }
    }

    /// Called when iOS restores the central manager after background termination
    func centralManager(_ central: CBCentralManager,
                        willRestoreState dict: [String: Any]) {
        // Recover any peripherals that were being connected to
        if let peripherals = dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral] {
            for peripheral in peripherals {
                peripheral.delegate = self
                pendingPeripherals[peripheral.identifier] = peripheral
            }
        }
    }

    func centralManager(_ central: CBCentralManager,
                        didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any],
                        rssi RSSI: NSNumber) {
        let now = Date()
        let peripheralId = peripheral.identifier

        // Debounce: skip if we read from this peripheral very recently
        if let lastRead = lastReadTime[peripheralId],
           now.timeIntervalSince(lastRead) < readDebounceInterval {
            return
        }

        // Connect to read the token characteristic
        if pendingPeripherals[peripheralId] == nil {
            peripheral.delegate = self
            pendingPeripherals[peripheralId] = peripheral
            centralManager.connect(peripheral, options: nil)
        }

        // Store RSSI for when we complete the read
        objc_setAssociatedObject(peripheral, "rssi", RSSI, .OBJC_ASSOCIATION_RETAIN)
    }

    func centralManager(_ central: CBCentralManager,
                        didConnect peripheral: CBPeripheral) {
        peripheral.discoverServices([ProximityBleConstants.serviceUUID])
    }

    func centralManager(_ central: CBCentralManager,
                        didFailToConnect peripheral: CBPeripheral, error: Error?) {
        pendingPeripherals.removeValue(forKey: peripheral.identifier)
    }

    // MARK: - CBPeripheralDelegate

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil,
              let service = peripheral.services?.first(where: {
                  $0.uuid == ProximityBleConstants.serviceUUID
              }) else {
            centralManager.cancelPeripheralConnection(peripheral)
            pendingPeripherals.removeValue(forKey: peripheral.identifier)
            return
        }
        peripheral.discoverCharacteristics(
            [ProximityBleConstants.tokenCharacteristicUUID],
            for: service
        )
    }

    func peripheral(_ peripheral: CBPeripheral,
                    didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil,
              let characteristic = service.characteristics?.first(where: {
                  $0.uuid == ProximityBleConstants.tokenCharacteristicUUID
              }) else {
            centralManager.cancelPeripheralConnection(peripheral)
            pendingPeripherals.removeValue(forKey: peripheral.identifier)
            return
        }
        peripheral.readValue(for: characteristic)
    }

    func peripheral(_ peripheral: CBPeripheral,
                    didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        defer {
            centralManager.cancelPeripheralConnection(peripheral)
            pendingPeripherals.removeValue(forKey: peripheral.identifier)
        }

        guard error == nil,
              let data = characteristic.value,
              let token = String(data: data, encoding: .utf8) else {
            return
        }

        let rssi = (objc_getAssociatedObject(peripheral, "rssi") as? NSNumber)?.intValue ?? -100
        lastReadTime[peripheral.identifier] = Date()

        if hasListeners {
            sendEvent(withName: "onBleDiscovery", body: [
                "peripheralId": peripheral.identifier.uuidString,
                "serviceUUIDs": [ProximityBleConstants.serviceUUID.uuidString],
                "token": token,
                "rssi": rssi,
                "timestampMs": Int(Date().timeIntervalSince1970 * 1000)
            ])
        }
    }

    // MARK: - Helpers

    private func mapState(_ state: CBManagerState) -> String {
        switch state {
        case .unknown: return "unknown"
        case .resetting: return "resetting"
        case .unsupported: return "unsupported"
        case .unauthorized: return "unauthorized"
        case .poweredOff: return "poweredOff"
        case .poweredOn: return "poweredOn"
        @unknown default: return "unknown"
        }
    }
}
