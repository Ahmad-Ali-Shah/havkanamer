import { useCallback } from 'react';
import { Pressable, type PressableProps, type ViewStyle } from 'react-native';
import {
  createAnimatedComponent,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { tapFeedback, type HapticStrength } from '@/lib/haptics';

const AnimatedPressable = withUniwind(createAnimatedComponent(Pressable));

/** Generous default so small controls still clear the 44px comfortable target. */
const DEFAULT_HIT_SLOP = 10;

const PRESS_SPRING = { damping: 18, stiffness: 320, mass: 0.5 } as const;

export interface TappableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  /** How far the control shrinks while held. 1 disables the scale. */
  pressedScale?: number;
  /** Opacity while held. */
  pressedOpacity?: number;
  haptic?: HapticStrength | false;
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
  haptic = 'light',
  hitSlop = DEFAULT_HIT_SLOP,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: TappableProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - pressedScale) }],
    opacity: 1 - pressed.value * (1 - pressedOpacity),
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (event) => {
      pressed.value = withSpring(1, PRESS_SPRING);
      onPressIn?.(event);
    },
    [onPressIn, pressed],
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (event) => {
      pressed.value = withTiming(0, { duration: 180 });
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
