package com.proximity.ble

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * React Native package that registers both BLE native modules.
 *
 * Add this to your MainApplication.kt getPackages():
 *   packages.add(ProximityBlePackage())
 */
class ProximityBlePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(
            ProximityBleScanner(reactContext),
            ProximityBleAdvertiser(reactContext)
        )
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
