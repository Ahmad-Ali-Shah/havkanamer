import { Footprints, PhoneCall, Timer } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { Button, Card, Typography, useThemeColor } from 'heroui-native';

import { FareSlabTable } from '@/components/FareSlabTable';
import { IconStat } from '@/components/Stat';
import { StatusBadge } from '@/components/StatusBadge';
import { ICON_COLORS } from '@/lib/mapTheme';
import { formatDuration, minutesSince } from '@/lib/geo';
import { directionLabel } from '@/lib/types';
import type { RouteVendor } from '@/lib/transport';
import type { TransportRoute } from '@/lib/types';

interface VendorRowProps {
  route: TransportRoute;
  vendor: RouteVendor;
  /** Fares are only worth expanding on the route detail screen. */
  showFares?: boolean;
}

export function VendorRow({ route, vendor, showFares = true }: VendorRowProps) {
  const [muted, accentForeground] = useThemeColor(['muted', 'accent-foreground']);
  const { registration, activeJourney } = vendor;
  const isLive = activeJourney !== null;

  return (
    <Card className="gap-3">
      <Card.Body className="gap-3 p-0">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Typography type="body" weight="semibold" numberOfLines={1}>
              {registration.vendorName}
            </Typography>
            <Typography type="body-xs" color="muted" numberOfLines={1}>
              {registration.vehicleRegistration} · {registration.vehicleDetails}
            </Typography>
          </View>
          <StatusBadge isLive={isLive} />
        </View>

        {activeJourney ? (
          <View className="bg-live-surface gap-0.5 rounded-xl px-3 py-2">
            <Typography type="body-xs" weight="semibold" className="text-live">
              {directionLabel(route, activeJourney.direction)}
            </Typography>
            <IconStat
              icon={Timer}
              label={`Set off ${minutesSince(activeJourney.startedAt)} min ago`}
              colorHex={ICON_COLORS.live}
              textClassName="text-live"
            />
          </View>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
          <IconStat
            icon={Timer}
            label={`Their trip ${formatDuration(registration.estimatedDurationMinutes)}`}
          />
          <IconStat
            icon={Footprints}
            label={registration.stopType === 'fixed' ? 'Stops at fixed points' : 'Stops on request'}
          />
        </View>

        {showFares ? <FareSlabTable slabs={registration.fareSlabs} /> : null}

        <Button
          size="sm"
          variant={isLive ? 'primary' : 'tertiary'}
          onPress={() => {
            void Linking.openURL(`tel:${registration.contact.replace(/\s+/g, '')}`);
          }}
        >
          <PhoneCall color={isLive ? accentForeground : muted} size={15} />
          <Button.Label>Call {registration.contact}</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}
