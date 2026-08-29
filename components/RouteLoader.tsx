import { useEffect, useState } from 'react';
import { Bus } from 'lucide-react-native';
import { View, type LayoutChangeEvent } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Typography } from 'heroui-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { ICON_COLORS } from '@/lib/mapTheme';
import { cn } from '@/lib/utils';

const STOP_COUNT = 4;
const BUS_SIZE = 28;
const SWEEP_MS = 1500;

interface RouteLoaderProps {
  label?: string;
  className?: string;
}

/**
 * The waiting state for a route that is being worked out.
 *
 * A spinner says only "busy". A vehicle covering ground along a line says what
 * the app is busy with, which is the difference between a wait that feels like
 * progress and one that feels like a stall.
 */
export function RouteLoader({
  label = 'Finding your fastest route…',
  className,
}: RouteLoaderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = 0;
    sweep.value = withRepeat(
      withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(sweep);
  }, [sweep]);

  const travelled = Math.max(0, trackWidth - BUS_SIZE);

  const busStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value * travelled }],
  }));

  const trailStyle = useAnimatedStyle(() => ({
    width: sweep.value * trackWidth,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View className={cn('items-center justify-center gap-4 px-6', className)}>
      <View className="w-full max-w-[220px] gap-3">
        <View className="h-7 justify-center">
          <AnimatedView
            className="bg-accent h-7 w-7 items-center justify-center rounded-full"
            style={busStyle}
          >
            <Bus color={ICON_COLORS.onBrand} size={15} />
          </AnimatedView>
        </View>

        <View className="h-2 justify-center" onLayout={handleLayout}>
          <View className="bg-border h-0.5 w-full rounded-full" />
          <AnimatedView className="bg-accent absolute h-0.5 rounded-full" style={trailStyle} />

          <View className="absolute w-full flex-row justify-between">
            {Array.from({ length: STOP_COUNT }, (_, index) => (
              <View key={index} className="border-accent bg-background h-2 w-2 rounded-full border" />
            ))}
          </View>
        </View>
      </View>

      <Typography type="body-sm" color="muted" align="center">
        {label}
      </Typography>
    </View>
  );
}
