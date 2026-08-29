import { View } from 'react-native';
import { Typography } from 'heroui-native';

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

  return (
    <View className="gap-0">
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const away = origin ? distanceKm(origin, row.coordinate) : null;

        return (
          <View key={row.key} className="flex-row gap-3">
            <View className="w-4 items-center">
              <View
                className={
                  row.kind === 'start'
                    ? 'bg-live h-3.5 w-3.5 rounded-full'
                    : row.kind === 'end'
                      ? 'bg-danger h-3.5 w-3.5 rounded-full'
                      : 'border-accent bg-background mt-0.5 h-2.5 w-2.5 rounded-full border-2'
                }
              />
              {!isLast ? <View className="bg-border w-0.5 flex-1" /> : null}
            </View>
            <View className={isLast ? 'flex-1 pb-0' : 'flex-1 pb-4'}>
              <Typography type="body-sm" weight={row.kind === 'stop' ? 'normal' : 'semibold'}>
                {row.name}
              </Typography>
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
