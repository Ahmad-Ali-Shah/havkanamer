import { ArrowRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';

import { cn } from '@/lib/utils';
import { directionDestination, directionOrigin } from '@/lib/types';
import type { RouteDirection, TransportRoute } from '@/lib/types';

interface DirectionSwitchProps {
  route: TransportRoute;
  value: RouteDirection;
  onChange: (direction: RouteDirection) => void;
}

const DIRECTIONS: RouteDirection[] = ['forward', 'reverse'];

/**
 * Two-way routes are the same path travelled opposite ways, so direction is a
 * view toggle rather than two separate routes.
 */
export function DirectionSwitch({ route, value, onChange }: DirectionSwitchProps) {
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);

  if (route.directionType === 'one-way') return null;

  return (
    <View className="bg-surface-secondary flex-row gap-1.5 rounded-2xl p-1.5">
      {DIRECTIONS.map((direction) => {
        const isSelected = direction === value;
        return (
          <Pressable
            key={direction}
            onPress={() => onChange(direction)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={cn(
              'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2 py-2.5',
              isSelected ? 'bg-accent' : 'bg-transparent',
            )}
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
          </Pressable>
        );
      })}
    </View>
  );
}
