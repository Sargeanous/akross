import React from 'react';
import { StyleSheet, Dimensions, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SNAP_VELOCITY = 500;

type SwipeableCardProps = {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled?: boolean;
};

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  enabled = true,
}: SwipeableCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

  const dismissCard = (direction: 'left' | 'right') => {
    'worklet';
    const target = direction === 'left' ? -SCREEN_WIDTH * 1.5 : SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(target, { duration: 300 });
    cardOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(direction === 'left' ? onSwipeLeft : onSwipeRight)();
    });
  };

  const resetCard = () => {
    'worklet';
    translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  };

  const pan = Gesture.Pan()
    .enabled(enabled)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5; // Dampen vertical movement
    })
    .onEnd((event) => {
      // Fling detection: fast swipe in either direction
      if (Math.abs(event.velocityX) > SNAP_VELOCITY) {
        dismissCard(event.velocityX < 0 ? 'left' : 'right');
        return;
      }
      // Threshold detection: dragged far enough
      if (Math.abs(translateX.value) > SWIPE_THRESHOLD) {
        dismissCard(translateX.value < 0 ? 'left' : 'right');
        return;
      }
      // Snap back
      resetCard();
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
      opacity: cardOpacity.value,
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, cardStyle]}>
        {children}
        {/* LIKE overlay */}
        <Animated.View style={[styles.labelContainer, styles.likeLabel, likeOpacity]}>
          <Text style={[styles.labelText, styles.likeLabelText]}>LIKE</Text>
        </Animated.View>
        {/* PASS overlay */}
        <Animated.View style={[styles.labelContainer, styles.passLabel, passOpacity]}>
          <Text style={[styles.labelText, styles.passLabelText]}>PASS</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  labelContainer: {
    position: 'absolute',
    top: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeLabel: {
    right: 20,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    transform: [{ rotate: '-15deg' }],
  },
  passLabel: {
    left: 20,
    borderColor: '#FF5252',
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    transform: [{ rotate: '15deg' }],
  },
  labelText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
  },
  likeLabelText: {
    color: '#4CAF50',
  },
  passLabelText: {
    color: '#FF5252',
  },
});
