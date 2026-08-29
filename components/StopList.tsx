import { Footprints } from 'lucide-react-native';
import { View } from 'react-native';
import { Typography } from 'heroui-native';

import { MAP_COLORS } from '@/lib/mapTheme';
import { cn } from '@/lib/utils';
import { distanceKm, formatDistance } from '@/lib/geo';
import { directionDestination, directionOrigin, directionStops } from '@/lib/types';
import type { LatLng } from '@/components/MapView.types';
import type { RouteDirection, TransportRoute } from '@/lib/types';

interface StopListProps {
  route: TransportRoute;
  direction: RouteDirection;
  /** When known, each stop shows how far the passenger is from it. */
  origin?: LatLng | null;
}

interface Row {
  key: string;
  name: string;
  kind: 'start' | 'stop' | 'end';
  coordinate: LatLng;
}

const RAIL_DOTS: Record<Row['kind'], string> = {
  start: 'bg-live h-3.5 w-3.5 rounded-full',
  end: 'bg-danger h-3.5 w-3.5 rounded-full',
  stop: 'border-accent bg-background mt-0.5 h-2.5 w-2.5 rounded-full border-2',
};

export function StopList({ route, direction, origin }: StopListProps) {
  const start = directionOrigin(route, direction);
  const end = directionDestination(route, direction);

  const rows: Row[] = [
    { key: 'start', name: start.name, kind: 'start', coordinate: start.coordinate },
    ...directionStops(route, direction).map<Row>((stop) => ({
      key: stop.id,
      name: stop.name,
      kind: 'stop',
      coordinate: stop.coordinate,
    })),
    { key: 'end', name: end.name, kind: 'end', coordinate: end.coordinate },
  ];

  const distances = origin ? rows.map((row) => distanceKm(origin, row.coordinate)) : null;
  // Calling out the closest boarding point saves the passenger the comparison.
  const nearestIndex = distances ? distances.indexOf(Math.min(...distances.slice(0, -1))) : -1;

  return (
    <View className="gap-0">
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const away = distances?.[index] ?? null;
        const isNearest = index === nearestIndex;

        return (
          <View key={row.key} className="flex-row gap-3">
            <View className="w-4 items-center">
              <View className={RAIL_DOTS[row.kind]} />
              {!isLast ? <View className="bg-border w-0.5 flex-1" /> : null}
            </View>
            <View className={cn('flex-1', isLast ? 'pb-0' : 'pb-4')}>
              <View className="flex-row items-center gap-2">
                <Typography
                  type="body-sm"
                  weight={row.kind === 'stop' ? 'normal' : 'semibold'}
                  className="flex-shrink"
                  numberOfLines={1}
                >
                  {row.name}
                </Typography>
                {isNearest ? (
                  <View className="bg-route-surface flex-row items-center gap-1 rounded-full px-2 py-0.5">
                    <Footprints color={MAP_COLORS.route} size={11} />
                    <Typography type="body-xs" weight="semibold" className="text-accent">
                      Closest
                    </Typography>
                  </View>
                ) : null}
              </View>
              {away !== null ? (
                <Typography type="body-xs" color="muted">
                  {formatDistance(away)} from you
                </Typography>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
