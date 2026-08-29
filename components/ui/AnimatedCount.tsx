import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Typography } from 'heroui-native';
import { withUniwind } from 'uniwind';

import { MOTION_DURATION } from '@/lib/motion';

const AnimatedView = withUniwind(Animated.View);

/** One intermediate value every this many ms while counting towards a target. */
const STEP_MS = 90;
/** Counting through more than this many values feels like a slot machine. */
const MAX_STEPS = 8;

type TypographyType = 'h4' | 'h5' | 'h6' | 'body' | 'body-sm' | 'body-xs';

interface AnimatedCountProps {
  value: number;
  /** Quiet unit rendered after the number. */
  unit?: string;
  type?: TypographyType;
  /** Draws attention while the value matters — a bus that is nearly here. */
  emphasis?: boolean;
  className?: string;
  unitClassName?: string;
}

/**
 * A number that moves to its new value instead of being replaced.
 *
 * An arrival time that jumps from 15 to 3 reads as a glitch; counting through
 * the values in between reads as information arriving. Each value settles with
 * a short upward roll so the change is visible even when it is only one digit.
 */
export function AnimatedCount({
  value,
  unit,
  type = 'h6',
  emphasis = false,
  className,
  unitClassName,
}: AnimatedCountProps) {
  const [displayed, setDisplayed] = useState(value);
  const roll = useSharedValue(0);
  const pulse = useSharedValue(0);
  const previous = useRef(value);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;

    if (from === value) return undefined;

    const distance = Math.abs(value - from);
    const steps = Math.min(distance, MAX_STEPS);
    const direction = value > from ? 1 : -1;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const next = step >= steps ? value : from + direction * Math.round((distance * step) / steps);
      setDisplayed(next);
      roll.value = direction > 0 ? -1 : 1;
      roll.value = withTiming(0, { duration: MOTION_DURATION.press });
      if (step >= steps) clearInterval(interval);
    }, STEP_MS);

    return () => clearInterval(interval);
  }, [value, roll]);

  useEffect(() => {
    if (!emphasis) {
      cancelAnimation(pulse);
      pulse.value = withTiming(0, { duration: MOTION_DURATION.enter });
      return undefined;
    }

    pulse.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => cancelAnimation(pulse);
  }, [emphasis, pulse]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: roll.value * 7 }, { scale: 1 + pulse.value * 0.04 }],
    opacity: 1 - Math.abs(roll.value) * 0.5,
  }));

  return (
    <View className="flex-row items-baseline gap-1">
      <AnimatedView style={numberStyle}>
        <Typography type={type} className={className}>
          {displayed}
        </Typography>
      </AnimatedView>
      {unit ? (
        <Typography type="body-xs" color="muted" className={unitClassName}>
          {unit}
        </Typography>
      ) : null}
    </View>
  );
}
