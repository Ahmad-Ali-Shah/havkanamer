import { useEffect } from 'react';
import { View } from 'react-native';
import { Typography } from 'heroui-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isLive: boolean;
  /** Overrides the default "Running now" / "Not running" copy. */
  label?: string;
  className?: string;
}

/**
 * Journey status. Uses the dedicated live/idle tokens rather than the brand
 * accent so "running now" never reads as decoration, and pulses the dot while
 * a vehicle is actually moving.
 */
export function StatusBadge({ isLive, label, className }: StatusBadgeProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!isLive) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return undefined;
    }

    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );

    return () => cancelAnimation(pulse);
  }, [isLive, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.5,
    transform: [{ scale: 1 + pulse.value * 2 }],
  }));

  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1',
        isLive ? 'border-live-border bg-live-surface' : 'border-idle-border bg-idle-surface',
        className,
      )}
    >
      <View className="h-2 w-2 items-center justify-center">
        {isLive ? (
          <AnimatedView className="bg-live absolute h-2 w-2 rounded-full" style={haloStyle} />
        ) : null}
        <View className={cn('h-2 w-2 rounded-full', isLive ? 'bg-live' : 'bg-idle')} />
      </View>
      <Typography type="body-xs" weight="semibold" className={isLive ? 'text-live' : 'text-idle'}>
        {label ?? (isLive ? 'Running now' : 'Not running')}
      </Typography>
    </View>
  );
}
