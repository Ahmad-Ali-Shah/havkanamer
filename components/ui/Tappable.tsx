import { useCallback } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { tapFeedback, type HapticStrength } from '@/lib/haptics';
import { MOTION_DURATION, SPRING_SNAP } from '@/lib/motion';

const AnimatedPressable = withUniwind(createAnimatedComponent(Pressable));

/** Generous default so small controls still clear the 44px comfortable target. */
const DEFAULT_HIT_SLOP = 10;

export interface TappableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  /** How far the control shrinks while held. 1 disables the scale. */
  pressedScale?: number;
  /** Opacity while held. */
  pressedOpacity?: number;
  /** Pixels the surface rises while held, for a card that should feel picked up. */
  pressedLift?: number;
  haptic?: HapticStrength | false;
  /**
   * Optional shared value mirroring the press state, 0 → 1. Pass one in when a
   * child needs to react to the press too — a chevron sliding towards the edge,
   * a route line brightening — so the whole card responds as one gesture
   * instead of each part animating on its own clock.
   */
  progress?: SharedValue<number>;
}

/**
 * The single press primitive for anything that is not a HeroUI Button.
 *
 * Every tappable surface in the app goes through this so that press feedback,
 * haptics and touch-target padding are consistent instead of being re-invented
 * per screen. Feedback runs on the UI thread, so it stays smooth even while the
 * navigator is committing a transition.
 */
export function Tappable({
  children,
  className,
  style,
  pressedScale = 0.97,
  pressedOpacity = 0.9,
  pressedLift = 0,
  haptic = 'light',
  hitSlop = DEFAULT_HIT_SLOP,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  progress,
  ...rest
}: TappableProps) {
  const internalProgress = useSharedValue(0);
  const pressed = progress ?? internalProgress;

  const animatedStyle = useAnimatedStyle(() => {
    const value = pressed.get();
    return {
      transform: [{ scale: 1 - value * (1 - pressedScale) }, { translateY: -value * pressedLift }],
      opacity: 1 - value * (1 - pressedOpacity),
    };
  });

  // `.set()` rather than assigning to `.value`: the shared value may come from a
  // prop, and writing through that alias reads as mutating someone else's return
  // value, which the React Compiler rejects.
  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      pressed.set(withSpring(1, SPRING_SNAP));
      onPressIn?.(event);
    },
    [onPressIn, pressed],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      pressed.set(withTiming(0, { duration: MOTION_DURATION.press }));
      onPressOut?.(event);
    },
    [onPressOut, pressed],
  );

  const handlePress = useCallback<NonNullable<PressableProps['onPress']>>(
    (event) => {
      if (haptic !== false) tapFeedback(haptic);
      onPress?.(event);
    },
    [haptic, onPress],
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={hitSlop}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
