import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

type ScanningAnimationProps = {
  isActive: boolean;
  size?: number;
};

/**
 * Pulsing rings animation to indicate active BLE scanning.
 */
export function ScanningAnimation({ isActive, size = 200 }: ScanningAnimationProps) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) {
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
      return;
    }

    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const animation = Animated.parallel([
      createPulse(pulse1, 0),
      createPulse(pulse2, 600),
      createPulse(pulse3, 1200),
    ]);

    animation.start();
    return () => animation.stop();
  }, [isActive]);

  const makeRingStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, makeRingStyle(pulse1)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, makeRingStyle(pulse2)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, makeRingStyle(pulse3)]} />
      <View style={[styles.center, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  center: { backgroundColor: '#FF6B6B' },
});
