import { Clock, Footprints, Wallet } from 'lucide-react-native';
import { View } from 'react-native';
import { Card, PressableFeedback, Typography } from 'heroui-native';

import { CategoryTile } from '@/components/CategoryTile';
import { IconStat } from '@/components/Stat';
import { RoutePathPreview } from '@/components/RoutePathPreview';
import { StatusBadge } from '@/components/StatusBadge';
import { ICON_COLORS } from '@/lib/mapTheme';
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
  const { route } = item;
  const isLive = item.activeVendorCount > 0;

  // The route name already spells out the corridor, so the subtitle carries
  // what the name cannot: the vehicle type and how it stops.
  const subtitle = [
    categoryLabel(route.category),
    route.stopType === 'fixed' ? `${route.stops.length} stops` : 'stops anywhere',
  ].join(' · ');

  return (
    <PressableFeedback onPress={onPress} accessibilityRole="button" accessibilityLabel={route.name}>
      <Card className="gap-3">
        <Card.Body className="gap-3 p-0">
          <View className="flex-row items-center gap-3">
            <CategoryTile category={route.category} muted={!isLive} />

            <View className="flex-1 gap-0.5">
              <Typography type="h6" numberOfLines={1}>
                {route.name}
              </Typography>
              <Typography type="body-xs" color="muted" numberOfLines={1}>
                {subtitle}
              </Typography>
            </View>

            <RoutePathPreview path={route.path} muted={!isLive} className="w-16" />
          </View>

          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
            <StatusBadge
              isLive={isLive}
              label={
                isLive
                  ? `${item.activeVendorCount} running`
                  : item.registeredVendorCount > 0
                    ? 'Not running'
                    : 'No vehicles yet'
              }
            />

            {showAccessDistance ? (
              <IconStat
                icon={Footprints}
                label={`${formatDistance(item.accessDistanceKm)} away${
                  item.nearestStopName ? ` · ${item.nearestStopName}` : ''
                }`}
                className="flex-shrink"
              />
            ) : null}

            <IconStat icon={Clock} label={formatDuration(route.estimatedDurationMinutes)} />

            {item.fareFrom !== null ? (
              <IconStat
                icon={Wallet}
                label={`from ${formatFare(item.fareFrom)}`}
                colorHex={ICON_COLORS.fare}
                textClassName="text-fare font-medium"
              />
            ) : null}
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
