import { ArrowRight, Clock, Footprints, Users } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, Chip, PressableFeedback, Typography, useThemeColor } from 'heroui-native';

import { RoutePathPreview } from '@/components/RoutePathPreview';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDistance, formatDuration, formatFare } from '@/lib/geo';
import { categoryLabel } from '@/lib/types';
import type { NearbyRoute } from '@/lib/transport';

interface RouteCardProps {
  item: NearbyRoute;
  onPress: () => void;
  /** Hidden when the passenger's location is unknown. */
  showAccessDistance?: boolean;
}

export function RouteCard({ item, onPress, showAccessDistance = true }: RouteCardProps) {
  const [muted] = useThemeColor(['muted']);
  const { route } = item;
  const isLive = item.activeVendorCount > 0;

  return (
    <PressableFeedback onPress={onPress}>
      <Card className="gap-3">
        <Card.Body className="gap-3 p-0">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Typography type="h6" numberOfLines={1}>
                {route.name}
              </Typography>
              <View className="flex-row items-center gap-1.5">
                <Typography type="body-sm" color="muted" numberOfLines={1} className="flex-shrink">
                  {route.start.name}
                </Typography>
                <ArrowRight color={muted} size={13} />
                <Typography type="body-sm" color="muted" numberOfLines={1} className="flex-shrink">
                  {route.end.name}
                </Typography>
              </View>
            </View>
            <RoutePathPreview path={route.path} muted={!isLive} className="w-24" />
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            <StatusBadge
              isLive={isLive}
              label={
                isLive
                  ? `${item.activeVendorCount} operating now`
                  : item.registeredVendorCount > 0
                    ? 'Nobody operating'
                    : 'No vendors yet'
              }
            />
            <Chip size="sm" variant="tertiary" color="default">
              <Chip.Label>{categoryLabel(route.category)}</Chip.Label>
            </Chip>
          </View>

          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5">
            {showAccessDistance ? (
              <View className="flex-row items-center gap-1.5">
                <Footprints color={muted} size={14} />
                <Typography type="body-xs" color="muted">
                  {formatDistance(item.accessDistanceKm)} away
                  {item.nearestStopName ? ` · ${item.nearestStopName}` : ''}
                </Typography>
              </View>
            ) : null}
            <View className="flex-row items-center gap-1.5">
              <Clock color={muted} size={14} />
              <Typography type="body-xs" color="muted">
                {formatDuration(route.estimatedDurationMinutes)}
              </Typography>
            </View>
            {item.fareFrom !== null ? (
              <View className="flex-row items-center gap-1.5">
                <Users color={muted} size={14} />
                <Typography type="body-xs" color="muted">
                  from {formatFare(item.fareFrom)}
                </Typography>
              </View>
            ) : null}
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
