#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

// ─── Scanner Bridge ──────────────────────────────────────────────────────────

@interface RCT_EXTERN_MODULE(ProximityBleScanner, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getState:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end

// ─── Advertiser Bridge ───────────────────────────────────────────────────────

@interface RCT_EXTERN_MODULE(ProximityBleAdvertiser, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSString *)token
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateToken:(NSString *)token
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getState:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
