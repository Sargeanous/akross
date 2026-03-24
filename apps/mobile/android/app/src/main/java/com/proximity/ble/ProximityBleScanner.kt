package com.proximity.ble

import android.Manifest
import android.bluetooth.*
import android.bluetooth.le.*
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Native BLE scanner for Android.
 *
 * Uses BluetoothLeScanner to scan for peripherals advertising the proximity
 * service UUID, then connects via GATT to read the token characteristic.
 *
 * Scan modes:
 * - Foreground: SCAN_MODE_LOW_LATENCY for responsive discovery
 * - The app should use a foreground service for background scanning
 *   (Android kills background BLE scans after ~10 minutes)
 */
class ProximityBleScanner(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ProximityBleScanner"

    private var bluetoothAdapter: BluetoothAdapter? = null
    private var scanner: BluetoothLeScanner? = null
    private var isScanning = false

    /** Track peripherals currently being read to avoid duplicate connections */
    private val pendingDevices = mutableSetOf<String>()

    /** Debounce: don't re-read from the same device within this interval */
    private val lastReadTime = mutableMapOf<String, Long>()
    private val readDebounceMs = 2000L

    init {
        val manager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = manager?.adapter
        scanner = bluetoothAdapter?.bluetoothLeScanner
    }

    // MARK: - JS-callable methods

    @ReactMethod
    fun start(promise: Promise) {
        if (!checkPermissions()) {
            promise.reject("BLE_PERMISSION", "Bluetooth permissions not granted")
            return
        }

        val bleScanner = bluetoothAdapter?.bluetoothLeScanner
        if (bleScanner == null) {
            promise.reject("BLE_NOT_READY", "Bluetooth is not available or not enabled")
            return
        }
        scanner = bleScanner

        val filters = listOf(
            ScanFilter.Builder()
                .setServiceUuid(ProximityBleConstants.SERVICE_PARCEL_UUID)
                .build()
        )

        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
            .setReportDelay(0) // Immediate callbacks
            .build()

        try {
            scanner?.startScan(filters, settings, scanCallback)
            isScanning = true
            promise.resolve(null)
        } catch (e: SecurityException) {
            promise.reject("BLE_PERMISSION", "Bluetooth scan permission denied: ${e.message}")
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            scanner?.stopScan(scanCallback)
        } catch (_: SecurityException) {
            // Already stopped or permission revoked
        }
        isScanning = false
        pendingDevices.clear()
        promise.resolve(null)
    }

    @ReactMethod
    fun getState(promise: Promise) {
        val state = when {
            bluetoothAdapter == null -> "unsupported"
            !bluetoothAdapter!!.isEnabled -> "poweredOff"
            else -> "poweredOn"
        }
        promise.resolve(state)
    }

    // MARK: - Scan Callback

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device = result.device
            val address = device.address
            val now = System.currentTimeMillis()

            // Debounce
            val lastRead = lastReadTime[address] ?: 0
            if (now - lastRead < readDebounceMs) return

            // Don't connect if we're already reading from this device
            if (pendingDevices.contains(address)) return

            pendingDevices.add(address)

            // Connect via GATT to read the token characteristic
            try {
                device.connectGatt(
                    reactContext,
                    false, // autoConnect = false for faster connection
                    GattCallback(address, result.rssi),
                    BluetoothDevice.TRANSPORT_LE
                )
            } catch (e: SecurityException) {
                pendingDevices.remove(address)
            }
        }

        override fun onScanFailed(errorCode: Int) {
            sendEvent("onBleScannerStateChange", Arguments.createMap().apply {
                putString("error", "Scan failed with error code: $errorCode")
            })
        }
    }

    // MARK: - GATT Client Callback (reads token from discovered peripheral)

    private inner class GattCallback(
        private val address: String,
        private val rssi: Int
    ) : BluetoothGattCallback() {

        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                try {
                    gatt.discoverServices()
                } catch (e: SecurityException) {
                    cleanup(gatt)
                }
            } else {
                cleanup(gatt)
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            if (status != BluetoothGatt.GATT_SUCCESS) {
                cleanup(gatt)
                return
            }

            val service = gatt.getService(ProximityBleConstants.SERVICE_UUID)
            val characteristic = service?.getCharacteristic(ProximityBleConstants.TOKEN_CHARACTERISTIC_UUID)

            if (characteristic == null) {
                cleanup(gatt)
                return
            }

            try {
                gatt.readCharacteristic(characteristic)
            } catch (e: SecurityException) {
                cleanup(gatt)
            }
        }

        @Suppress("DEPRECATION")
        override fun onCharacteristicRead(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            status: Int
        ) {
            if (status == BluetoothGatt.GATT_SUCCESS) {
                val token = characteristic.value?.toString(Charsets.UTF_8)
                if (token != null) {
                    lastReadTime[address] = System.currentTimeMillis()

                    val event = Arguments.createMap().apply {
                        putString("peripheralId", address)
                        putArray("serviceUUIDs", Arguments.createArray().apply {
                            pushString(ProximityBleConstants.SERVICE_UUID.toString())
                        })
                        putString("token", token)
                        putInt("rssi", rssi)
                        putDouble("timestampMs", System.currentTimeMillis().toDouble())
                    }
                    sendEvent("onBleDiscovery", event)
                }
            }
            cleanup(gatt)
        }

        private fun cleanup(gatt: BluetoothGatt) {
            pendingDevices.remove(address)
            try {
                gatt.close()
            } catch (_: Exception) {}
        }
    }

    // MARK: - Helpers

    private fun checkPermissions(): Boolean {
        val context = reactContext
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_SCAN) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) == PackageManager.PERMISSION_GRANTED
        } else {
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
