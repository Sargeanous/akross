package com.proximity.ble

import android.os.ParcelUuid
import java.util.UUID

/**
 * BLE protocol constants — must match @proximity/shared constants.ts
 */
object ProximityBleConstants {
    val SERVICE_UUID: UUID = UUID.fromString("0000FE50-0000-1000-8000-00805F9B34FB")
    val TOKEN_CHARACTERISTIC_UUID: UUID = UUID.fromString("0000FE51-0000-1000-8000-00805F9B34FB")
    val SERVICE_PARCEL_UUID: ParcelUuid = ParcelUuid(SERVICE_UUID)
}
