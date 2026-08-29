import { Clock, ChevronRight, Footprints, Wallet } from 'lucide-react-native';
import { View } from 'react-native';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Typography, useThemeColor } from 'heroui-native';

import { CategoryTile } from '@/components/CategoryTile';
import { IconStat } from '@/components/Stat';
import { RoutePathPreview } from '@/components/RoutePathPreview';
import { StatusBadge } from '@/components/StatusBadge';
import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Tappable } from '@/components/ui/Tappable';
import { ICON_COLORS } from '@/lib/mapTheme';
import { formatDistance, formatDuration, formatFare } from '@/lib/geo';
import { categoryLabel } from '@/lib/types';
import type { NearbyRoute } from '@/lib/transport';

interface RouteCardProps {
  item: NearbyRoute;
  onPress: () => void;
  /** Hidden when the passenger's location is unknown. */
  showAccessDistance?: boolean;
  /** Milliseconds before the route line traces itself, to match the row stagger. */
  drawDelay?: number;
}

export function RouteCard({
  item,
  onPress,
  showAccessDistance = true,
  drawDelay = 0,
}: RouteCardProps) {
  const [muted] = useThemeColor(['muted']);
  const { route } = item;
  const isLive = item.activeVendorCount > 0;

  // One press value for the whole card, so the lift, the chevron and the route
  // graphic all move as a single gesture rather than three separate animations.
  const press = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: press.value * 4 }],
    opacity: 0.85 + press.value * 0.15,
  }));

  // The route name already spells out the corridor, so the subtitle carries
  // what the name cannot: the vehicle type and how it stops.
  const subtitle = [
    categoryLabel(route.category),
    route.stopType === 'fixed' ? `${route.stops.length} stops` : 'stops anywhere',
  ].join(' · ');

  return (
    <Tappable
      onPress={onPress}
      accessibilityLabel={`${route.name}. ${subtitle}. Open route details.`}
      pressedScale={0.975}
      pressedLift={2}
      progress={press}
      className="border-border bg-surface gap-3 rounded-3xl border p-4"
    >
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

        <RoutePathPreview
          path={route.path}
          muted={!isLive}
          live={isLive}
          drawDelay={drawDelay}
          emphasis={press}
        />

        {/* Affordance: makes it obvious the whole card opens something, and it
            leans towards the edge while held so the press is acknowledged. */}
        <AnimatedView style={chevronStyle}>
          <ChevronRight color={muted} size={18} />
        </AnimatedView>
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
    </Tappable>
  );
}
