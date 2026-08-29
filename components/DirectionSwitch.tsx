import { useState } from 'react';
import { ArrowRight } from 'lucide-react-native';
import { View, type LayoutChangeEvent } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { Tappable } from '@/components/ui/Tappable';
import { cn } from '@/lib/utils';
import { directionDestination, directionOrigin } from '@/lib/types';
import type { RouteDirection, TransportRoute } from '@/lib/types';

const AnimatedView = withUniwind(Animated.View);

interface DirectionSwitchProps {
  route: TransportRoute;
  value: RouteDirection;
  onChange: (direction: RouteDirection) => void;
}

const DIRECTIONS: RouteDirection[] = ['forward', 'reverse'];

const PADDING = 6;
const THUMB_SPRING = { damping: 20, stiffness: 220, mass: 0.6 } as const;

/**
 * Two-way routes are the same path travelled opposite ways, so direction is a
 * view toggle rather than two separate routes.
 *
 * The selected pill is a single sliding thumb rather than a per-option
 * background, so switching direction reads as one continuous movement.
 */
export function DirectionSwitch({ route, value, onChange }: DirectionSwitchProps) {
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);
  const [trackWidth, setTrackWidth] = useState(0);

  const selectedIndex = DIRECTIONS.indexOf(value);
  const segmentWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / DIRECTIONS.length : 0;

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: withSpring(selectedIndex * segmentWidth, THUMB_SPRING) }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  if (route.directionType === 'one-way') return null;

  return (
    <View
      onLayout={handleLayout}
      className="bg-surface-secondary relative flex-row rounded-2xl"
      style={{ padding: PADDING }}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <AnimatedView
          pointerEvents="none"
          className="bg-accent absolute rounded-xl"
          style={[{ top: PADDING, bottom: PADDING, left: PADDING }, thumbStyle]}
        />
      ) : null}

      {DIRECTIONS.map((direction) => {
        const isSelected = direction === value;
        return (
          <Tappable
            key={direction}
            onPress={() => onChange(direction)}
            haptic="selection"
            pressedScale={0.96}
            pressedOpacity={0.75}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            // Adjacent segments: horizontal slop would overlap the neighbour and
            // let a near-boundary tap select the wrong direction.
            hitSlop={{ top: 8, bottom: 8 }}
            accessibilityLabel={`${directionOrigin(route, direction).name} to ${
              directionDestination(route, direction).name
            }`}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 px-2 py-2.5"
          >
            <Typography
              type="body-xs"
              weight="semibold"
              numberOfLines={1}
              className={cn('flex-shrink', isSelected ? 'text-accent-foreground' : 'text-muted')}
            >
              {directionOrigin(route, direction).name}
            </Typography>
            <ArrowRight color={isSelected ? accentForeground : muted} size={13} />
            <Typography
              type="body-xs"
              weight="semibold"
              numberOfLines={1}
              className={cn('flex-shrink', isSelected ? 'text-accent-foreground' : 'text-muted')}
            >
              {directionDestination(route, direction).name}
            </Typography>
          </Tappable>
        );
      })}
    </View>
  );
}
