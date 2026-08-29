import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Clock, MapPin, Maximize2, Ruler, SearchX, UserRoundX, Wallet } from 'lucide-react-native';
import { Button, Card, Separator, Surface, Typography } from 'heroui-native';

import MapView from '@/components/MapView';
import { CategoryTile } from '@/components/CategoryTile';
import { DirectionSwitch } from '@/components/DirectionSwitch';
import { EmptyState } from '@/components/EmptyState';
import { GroupLabel, SectionHeader } from '@/components/SectionHeader';
import { StatTile } from '@/components/Stat';
import { StatusBadge } from '@/components/StatusBadge';
import { StopList } from '@/components/StopList';
import { VendorRow } from '@/components/VendorRow';
import { Reveal } from '@/components/ui/Reveal';
import { Tappable } from '@/components/ui/Tappable';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  formatDistance,
  formatDuration,
  formatFare,
  pathLengthKm,
  regionForCoordinates,
  startingFare,
} from '@/lib/geo';
import { exitFlowTo } from '@/lib/navigation';
import { ICON_COLORS, MAP_COLORS } from '@/lib/mapTheme';
import { vendorsForRoute } from '@/lib/transport';
import { categoryLabel, directionPath, directionStops } from '@/lib/types';
import { useRouteDraftStore } from '@/lib/routeDraft';
import { useSessionStore, useTransportStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { MapMarker } from '@/components/MapView.types';
import type { RouteDirection } from '@/lib/types';

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const route = useTransportStore((state) => state.routes.find((candidate) => candidate.id === id));
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const account = useSessionStore((state) => state.account);
  const startJoin = useRouteDraftStore((state) => state.startJoin);

  const { coordinate, status } = useCurrentLocation();
  const [direction, setDirection] = useState<RouteDirection>('forward');
  // This map lives in a ScrollView; leaving gestures on means it swallows
  // vertical pans and the page stops scrolling.
  const [mapExpanded, setMapExpanded] = useState(false);

  const vendors = useMemo(
    () => (route ? vendorsForRoute(registrations, journeys, route.id, direction) : []),
    [route, registrations, journeys, direction],
  );

  const fareFrom = useMemo(() => {
    const fares = vendors
      .map((vendor) => startingFare(vendor.registration.fareSlabs))
      .filter((fare): fare is number => fare !== null);
    return fares.length > 0 ? Math.min(...fares) : null;
  }, [vendors]);

  if (!route) {
    return (
      <View className="bg-background flex-1 justify-center">
        <Stack.Screen options={{ title: 'Route' }} />
        <EmptyState
          icon={SearchX}
          title="Route not found"
          description="This route may have been removed from this device."
          actionLabel="Back to explore"
          onAction={() => exitFlowTo('/')}
        />
      </View>
    );
  }

  const orderedPath = directionPath(route, direction);
  const orderedStops = directionStops(route, direction);
  const activeVendors = vendors.filter((vendor) => vendor.activeJourney !== null);
  const inactiveVendors = vendors.filter((vendor) => vendor.activeJourney === null);
  const routeLengthKm = pathLengthKm(route.path);

  const joinThisRoute = () => {
    if (!account) {
      router.push('/vendor/sign-in');
      return;
    }
    startJoin(route.id, { vendorName: account.name, contact: account.phone });
    router.push('/vendor/new/vehicle');
  };

  const markers: MapMarker[] = [
    {
      id: 'origin',
      coordinate: orderedPath[0],
      title: direction === 'forward' ? route.start.name : route.end.name,
      description: 'Route start',
      color: MAP_COLORS.start,
    },
    ...orderedStops.map<MapMarker>((stop) => ({
      id: stop.id,
      coordinate: stop.coordinate,
      title: stop.name,
      description: 'Stop',
      color: MAP_COLORS.stop,
    })),
    {
      id: 'destination',
      coordinate: orderedPath.at(-1) ?? orderedPath[0],
      title: direction === 'forward' ? route.end.name : route.start.name,
      description: 'Route end',
      color: MAP_COLORS.end,
    },
  ];

  // How this route stops, plus one-way when there is no direction switch to
  // make it obvious.
  const habits = [
    route.stopType === 'fixed'
      ? `${route.stops.length} fixed stops`
      : 'Picks up anywhere on the path',
    route.directionType === 'one-way' ? 'One-way only' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="gap-5 p-4 pb-12"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: route.name }} />

      <DirectionSwitch route={route} value={direction} onChange={setDirection} />

      <Reveal>
        <Surface variant="secondary" className="gap-4 rounded-3xl">
          <View className="flex-row items-center gap-3">
            <CategoryTile
              category={route.category}
              size="lg"
              muted={activeVendors.length === 0}
              className="bg-background"
            />
            <View className="flex-1 gap-0.5">
              <Typography type="h6">{categoryLabel(route.category)}</Typography>
              <Typography type="body-xs" color="muted">
                {habits}
              </Typography>
            </View>
          </View>

          <StatusBadge
            isLive={activeVendors.length > 0}
            label={
              activeVendors.length > 0
                ? `${activeVendors.length} running right now`
                : 'Nobody running right now'
            }
          />

          <Separator />

          <View className="flex-row gap-3">
            <StatTile icon={Ruler} value={formatDistance(routeLengthKm)} label="Route length" />
            <StatTile
              icon={Clock}
              value={formatDuration(route.estimatedDurationMinutes)}
              label="Typical trip"
            />
            <StatTile
              icon={Wallet}
              value={fareFrom !== null ? formatFare(fareFrom) : 'Not shared'}
              label="Fare from"
              colorHex={fareFrom !== null ? ICON_COLORS.fare : undefined}
              valueClassName={fareFrom !== null ? 'text-fare' : undefined}
            />
          </View>
        </Surface>
      </Reveal>

      <Reveal index={1}>
        <View className="border-border bg-surface-secondary overflow-hidden rounded-3xl border">
          <MapView
            style={{ width: '100%', height: mapExpanded ? 360 : 260 }}
            initialRegion={regionForCoordinates(route.path)}
            showsUserLocation={status === 'granted'}
            scrollEnabled={mapExpanded}
            zoomEnabled={mapExpanded}
            polylines={[
              {
                id: route.id,
                coordinates: orderedPath,
                strokeColor: activeVendors.length > 0 ? MAP_COLORS.route : MAP_COLORS.routeMuted,
                strokeWidth: 4,
              },
            ]}
            markers={markers}
          />

          <Tappable
            onPress={() => setMapExpanded((previous) => !previous)}
            haptic="selection"
            accessibilityLabel={mapExpanded ? 'Shrink the map' : 'Expand and pan the map'}
            accessibilityState={{ expanded: mapExpanded }}
            className={cn(
              'border-border absolute top-3 right-3 h-11 w-11 items-center justify-center rounded-full border',
              mapExpanded ? 'bg-accent border-accent' : 'bg-background',
            )}
          >
            <Maximize2 color={mapExpanded ? ICON_COLORS.onBrand : MAP_COLORS.route} size={18} />
          </Tappable>
        </View>
      </Reveal>

      <Reveal index={2} className="gap-3">
        <SectionHeader
          title="Vehicles on this route"
          meta={vendors.length > 0 ? `${vendors.length} registered` : undefined}
        />

        {vendors.length === 0 ? (
          <EmptyState
            icon={UserRoundX}
            title="No vehicles registered yet"
            description="This route exists but nobody has attached a vehicle and fares to it."
            actionLabel="I run this route"
            onAction={joinThisRoute}
          />
        ) : (
          <View className="gap-3">
            {activeVendors.length > 0 ? (
              activeVendors.map((vendor) => (
                <VendorRow key={vendor.registration.id} route={route} vendor={vendor} />
              ))
            ) : (
              <Surface variant="secondary" className="gap-1 rounded-2xl">
                <Typography type="body-sm" weight="semibold">
                  Nothing on the road at this moment
                </Typography>
                <Typography type="body-sm" color="muted">
                  {route.directionType === 'two-way'
                    ? 'Try the other direction, or call an operator below to ask when they set off.'
                    : 'Call an operator below to ask when they set off.'}
                </Typography>
              </Surface>
            )}

            {inactiveVendors.length > 0 ? (
              <View className="gap-2 pt-1">
                <GroupLabel>Registered · not running</GroupLabel>
                {inactiveVendors.map((vendor) => (
                  <VendorRow key={vendor.registration.id} route={route} vendor={vendor} />
                ))}
              </View>
            ) : null}
          </View>
        )}
      </Reveal>

      <Reveal index={3} className="gap-3">
        <SectionHeader
          title={route.stopType === 'fixed' ? 'Stops in order' : 'Route points'}
          icon={MapPin}
          meta={coordinate ? 'Distance from you' : undefined}
        />
        <StopList route={route} direction={direction} origin={coordinate} />
      </Reveal>

      {vendors.length > 0 ? (
        <Reveal index={4}>
          <Card variant="secondary">
            <Card.Body className="gap-2 p-0">
              <Card.Title>Do you run this route too?</Card.Title>
              <Card.Description>
                Add your vehicle and fares to this route instead of creating a duplicate.
              </Card.Description>
            </Card.Body>
            <Card.Footer className="p-0 pt-3">
              <Button variant="tertiary" onPress={joinThisRoute}>
                <Button.Label>Join this route</Button.Label>
              </Button>
            </Card.Footer>
          </Card>
        </Reveal>
      ) : null}
    </ScrollView>
  );
}
