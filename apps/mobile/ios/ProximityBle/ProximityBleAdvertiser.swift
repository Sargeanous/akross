import CoreBluetooth
import React

/// Native BLE advertiser using CoreBluetooth CBPeripheralManager.
///
/// Advertises the proximity service UUID and serves the current token
/// via a readable GATT characteristic. When the scanner on another device
/// connects and reads the characteristic, it gets the current rotating token.
///
/// Background support: initialized with CBPeripheralManagerOptionRestoreIdentifierKey
/// and the app's Info.plist must include `bluetooth-peripheral` in UIBackgroundModes.
@objc(ProximityBleAdvertiser)
class ProximityBleAdvertiser: RCTEventEmitter, CBPeripheralManagerDelegate {

    private var peripheralManager: CBPeripheralManager!
    private var tokenCharacteristic: CBMutableCharacteristic!
    private var currentToken: String = ""
    private var isAdvertising = false
    private var serviceAdded = false
    private var hasListeners = false

    /// Queued requests that arrived before the service was fully set up
    private var pendingRequests: [CBATTRequest] = []

    override init() {
        super.init()
        peripheralManager = CBPeripheralManager(
            delegate: self,
            queue: DispatchQueue(label: "com.proximity.ble.advertiser", qos: .userInitiated),
            options: [
                CBPeripheralManagerOptionRestoreIdentifierKey: "com.proximity.advertiser",
                CBPeripheralManagerOptionShowPowerAlertKey: true
            ]
        )
    }

    // MARK: - RCTEventEmitter

    override static func requiresMainQueueSetup() -> Bool { false }

    override func supportedEvents() -> [String]! {
        ["onBleAdvertiserStateChange"]
    }

    override func startObserving() { hasListeners = true }
    override func stopObserving() { hasListeners = false }

    // MARK: - JS-callable methods

    @objc func start(_ token: String,
                     resolve: @escaping RCTPromiseResolveBlock,
                     reject: @escaping RCTPromiseRejectBlock) {
        guard peripheralManager.state == .poweredOn else {
            reject("BLE_NOT_READY", "Bluetooth is not powered on (state: \(peripheralManager.state.rawValue))", nil)
            return
        }

        currentToken = token

        if !serviceAdded {
            setupService()
        }

        startAdvertisingIfReady()
        resolve(nil)
    }

    @objc func stop(_ resolve: @escaping RCTPromiseResolveBlock,
                    reject: @escaping RCTPromiseRejectBlock) {
        peripheralManager.stopAdvertising()
        isAdvertising = false
        resolve(nil)
    }

    @objc func updateToken(_ token: String,
                           resolve: @escaping RCTPromiseResolveBlock,
                           reject: @escaping RCTPromiseRejectBlock) {
        currentToken = token
        resolve(nil)
    }

    @objc func getState(_ resolve: @escaping RCTPromiseResolveBlock,
                        reject: @escaping RCTPromiseRejectBlock) {
        resolve(mapState(peripheralManager.state))
    }

    // MARK: - Service Setup

    private func setupService() {
        // Create the token characteristic (readable by scanners)
        tokenCharacteristic = CBMutableCharacteristic(
            type: ProximityBleConstants.tokenCharacteristicUUID,
            properties: [.read],
            value: nil, // Dynamic value — we respond to read requests
            permissions: [.readable]
        )

        // Create the proximity service
        let service = CBMutableService(
            type: ProximityBleConstants.serviceUUID,
            primary: true
        )
        service.characteristics = [tokenCharacteristic]

        peripheralManager.add(service)
    }

    private func startAdvertisingIfReady() {
        guard serviceAdded, peripheralManager.state == .poweredOn else { return }

        peripheralManager.startAdvertising([
            CBAdvertisementDataServiceUUIDsKey: [ProximityBleConstants.serviceUUID],
            CBAdvertisementDataLocalNameKey: "Proximity"
        ])
        isAdvertising = true
    }

    // MARK: - CBPeripheralManagerDelegate

    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        let state = mapState(peripheral.state)
        if hasListeners {
            sendEvent(withName: "onBleAdvertiserStateChange", body: ["state": state])
        }

        if peripheral.state == .poweredOn && !currentToken.isEmpty {
            if !serviceAdded {
                setupService()
            } else {
                startAdvertisingIfReady()
            }
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager,
                           willRestoreState dict: [String: Any]) {
        // Restore advertising state after background termination
        if let services = dict[CBPeripheralManagerRestoredStateServicesKey] as? [CBMutableService] {
            for service in services {
                if let chars = service.characteristics {
                    for char in chars {
                        if char.uuid == ProximityBleConstants.tokenCharacteristicUUID {
                            tokenCharacteristic = char as? CBMutableCharacteristic
                        }
                    }
                }
            }
            serviceAdded = true
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager,
                           didAdd service: CBService, error: Error?) {
        if error == nil {
            serviceAdded = true
            startAdvertisingIfReady()
        }
    }

    /// Respond to read requests from scanning devices with the current token
    func peripheralManager(_ peripheral: CBPeripheralManager,
                           didReceiveRead request: CBATTRequest) {
        guard request.characteristic.uuid == ProximityBleConstants.tokenCharacteristicUUID else {
            peripheral.respond(to: request, withResult: .attributeNotFound)
            return
        }

        guard let data = currentToken.data(using: .utf8) else {
            peripheral.respond(to: request, withResult: .unlikelyError)
            return
        }

        // Handle offset reads (though tokens are small enough to fit in one read)
        if request.offset > data.count {
            peripheral.respond(to: request, withResult: .invalidOffset)
            return
        }

        request.value = data.subdata(in: request.offset..<data.count)
        peripheral.respond(to: request, withResult: .success)
    }

    // MARK: - Helpers

    private func mapState(_ state: CBPeripheralManagerState) -> String {
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
