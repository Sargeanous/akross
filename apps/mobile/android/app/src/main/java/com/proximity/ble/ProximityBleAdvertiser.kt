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
 * Native BLE advertiser for Android.
 *
 * Uses BluetoothLeAdvertiser to advertise the proximity service UUID and
 * BluetoothGattServer to host the GATT service with the token characteristic.
 *
 * When a scanner connects and reads the characteristic, it receives the
 * current rotating token value.
 *
 * For reliable background advertising, the app should run this within a
 * foreground service with a persistent notification.
 */
class ProximityBleAdvertiser(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "ProximityBleAdvertiser"

    private var bluetoothAdapter: BluetoothAdapter? = null
    private var advertiser: BluetoothLeAdvertiser? = null
    private var gattServer: BluetoothGattServer? = null
    private var isAdvertising = false
    private var currentToken: String = ""

    init {
        val manager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        bluetoothAdapter = manager?.adapter
        advertiser = bluetoothAdapter?.bluetoothLeAdvertiser
    }

    // MARK: - JS-callable methods

    @ReactMethod
    fun start(token: String, promise: Promise) {
        if (!checkPermissions()) {
            promise.reject("BLE_PERMISSION", "Bluetooth permissions not granted")
            return
        }

        currentToken = token

        // Set up GATT server first
        if (gattServer == null) {
            setupGattServer()
        }

        // Start advertising
        val bleAdvertiser = bluetoothAdapter?.bluetoothLeAdvertiser
        if (bleAdvertiser == null) {
            promise.reject("BLE_NOT_READY", "BLE advertising not supported on this device")
            return
        }
        advertiser = bleAdvertiser

        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
            .setConnectable(true) // Scanners need to connect to read the token
            .setTimeout(0) // Advertise indefinitely
            .build()

        val data = AdvertiseData.Builder()
            .addServiceUuid(ProximityBleConstants.SERVICE_PARCEL_UUID)
            .setIncludeDeviceName(false) // Save advertisement space
            .setIncludeTxPowerLevel(false)
            .build()

        try {
            advertiser?.startAdvertising(settings, data, advertiseCallback)
            isAdvertising = true
            promise.resolve(null)
        } catch (e: SecurityException) {
            promise.reject("BLE_PERMISSION", "Bluetooth advertise permission denied: ${e.message}")
        }
    }

    @ReactMethod
    fun stop(promise: Promise) {
        try {
            advertiser?.stopAdvertising(advertiseCallback)
        } catch (_: SecurityException) {}

        try {
            gattServer?.close()
        } catch (_: Exception) {}

        gattServer = null
        isAdvertising = false
        promise.resolve(null)
    }

    @ReactMethod
    fun updateToken(token: String, promise: Promise) {
        currentToken = token
        promise.resolve(null)
    }

    @ReactMethod
    fun getState(promise: Promise) {
        val state = when {
            bluetoothAdapter == null -> "unsupported"
            !bluetoothAdapter!!.isEnabled -> "poweredOff"
            advertiser == null -> "unsupported" // Device doesn't support BLE advertising
            else -> "poweredOn"
        }
        promise.resolve(state)
    }

    // MARK: - GATT Server Setup

    private fun setupGattServer() {
        val manager = reactContext.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            ?: return

        try {
            gattServer = manager.openGattServer(reactContext, gattServerCallback)
        } catch (e: SecurityException) {
            return
        }

        val tokenCharacteristic = BluetoothGattCharacteristic(
            ProximityBleConstants.TOKEN_CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ,
            BluetoothGattCharacteristic.PERMISSION_READ
        )

        val service = BluetoothGattService(
            ProximityBleConstants.SERVICE_UUID,
            BluetoothGattService.SERVICE_TYPE_PRIMARY
        )
        service.addCharacteristic(tokenCharacteristic)

        try {
            gattServer?.addService(service)
        } catch (e: SecurityException) {
            gattServer?.close()
            gattServer = null
        }
    }

    // MARK: - GATT Server Callback (responds to read requests from scanners)

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            // Connection tracking could be added here for metrics
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic
        ) {
            if (characteristic.uuid == ProximityBleConstants.TOKEN_CHARACTERISTIC_UUID) {
                val tokenBytes = currentToken.toByteArray(Charsets.UTF_8)
                val responseBytes = if (offset < tokenBytes.size) {
                    tokenBytes.copyOfRange(offset, tokenBytes.size)
                } else {
                    byteArrayOf()
                }

                try {
                    gattServer?.sendResponse(
                        device,
                        requestId,
                        BluetoothGatt.GATT_SUCCESS,
                        offset,
                        responseBytes
                    )
                } catch (_: SecurityException) {}
            } else {
                try {
                    gattServer?.sendResponse(
                        device,
                        requestId,
                        BluetoothGatt.GATT_REQUEST_NOT_SUPPORTED,
                        0,
                        null
                    )
                } catch (_: SecurityException) {}
            }
        }
    }

    // MARK: - Advertise Callback

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            isAdvertising = true
        }

        override fun onStartFailure(errorCode: Int) {
            isAdvertising = false
            sendEvent("onBleAdvertiserStateChange", Arguments.createMap().apply {
                putString("error", "Advertising failed with error code: $errorCode")
            })
        }
    }

    // MARK: - Helpers

    private fun checkPermissions(): Boolean {
        val context = reactContext
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ContextCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_ADVERTISE) == PackageManager.PERMISSION_GRANTED &&
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
