import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Clock, MapPin, Repeat, Ruler, UserRoundX } from 'lucide-react-native';
import { Button, Card, Chip, Separator, Typography, useThemeColor } from 'heroui-native';

import MapView from '@/components/MapView';
import { DirectionSwitch } from '@/components/DirectionSwitch';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { StopList } from '@/components/StopList';
import { VendorRow } from '@/components/VendorRow';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { formatDistance, formatDuration, pathLengthKm, regionForCoordinates } from '@/lib/geo';
import { MAP_COLORS } from '@/lib/mapTheme';
import { vendorsForRoute } from '@/lib/transport';
import { categoryLabel, directionPath, directionStops } from '@/lib/types';
import { useRouteDraftStore } from '@/lib/routeDraft';
import { useSessionStore, useTransportStore } from '@/lib/store';
import type { MapMarker } from '@/components/MapView.types';
import type { RouteDirection } from '@/lib/types';

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [muted] = useThemeColor(['muted']);

  const route = useTransportStore((state) => state.routes.find((candidate) => candidate.id === id));
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const account = useSessionStore((state) => state.account);
  const startJoin = useRouteDraftStore((state) => state.startJoin);

  const { coordinate, status } = useCurrentLocation();
  const [direction, setDirection] = useState<RouteDirection>('forward');

  const vendors = useMemo(
    () => (route ? vendorsForRoute(registrations, journeys, route.id, direction) : []),
    [route, registrations, journeys, direction],
  );

  if (!route) {
    return (
      <View className="bg-background flex-1 justify-center">
        <Stack.Screen options={{ title: 'Route' }} />
        <EmptyState
          icon={UserRoundX}
          title="Route not found"
          description="This route may have been removed from this device."
          actionLabel="Back to explore"
          onAction={() => router.replace('/')}
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

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-4 pb-10">
      <Stack.Screen options={{ title: route.name }} />

      <View className="gap-2">
        <View className="flex-row flex-wrap items-center gap-2">
          <StatusBadge
            isLive={activeVendors.length > 0}
            label={
              activeVendors.length > 0
                ? `${activeVendors.length} operating now`
                : 'Nobody operating right now'
            }
          />
          <Chip size="sm" variant="tertiary" color="default">
            <Chip.Label>{categoryLabel(route.category)}</Chip.Label>
          </Chip>
          <Chip size="sm" variant="tertiary" color="default">
            <Chip.Label>{route.directionType === 'two-way' ? 'Two-way' : 'One-way'}</Chip.Label>
          </Chip>
        </View>
        <Typography type="h4">{route.name}</Typography>
      </View>

      <DirectionSwitch route={route} value={direction} onChange={setDirection} />

      <View className="border-border overflow-hidden rounded-2xl border">
        <MapView
          style={{ width: '100%', height: 260 }}
          initialRegion={regionForCoordinates(route.path)}
          showsUserLocation={status === 'granted'}
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
      </View>

      <View className="flex-row flex-wrap gap-x-5 gap-y-2">
        <View className="flex-row items-center gap-1.5">
          <Ruler color={muted} size={15} />
          <Typography type="body-sm" color="muted">
            {formatDistance(routeLengthKm)}
          </Typography>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Clock color={muted} size={15} />
          <Typography type="body-sm" color="muted">
            {formatDuration(route.estimatedDurationMinutes)}
          </Typography>
        </View>
        <View className="flex-row items-center gap-1.5">
          <MapPin color={muted} size={15} />
          <Typography type="body-sm" color="muted">
            {route.stopType === 'fixed' ? `${route.stops.length} fixed stops` : 'Flexible stops'}
          </Typography>
        </View>
        {route.directionType === 'two-way' ? (
          <View className="flex-row items-center gap-1.5">
            <Repeat color={muted} size={15} />
            <Typography type="body-sm" color="muted">
              Runs both ways
            </Typography>
          </View>
        ) : null}
      </View>

      <Separator />

      <View className="gap-4">
        <Typography type="h6">Vehicles on this route</Typography>

        {vendors.length === 0 ? (
          <EmptyState
            icon={UserRoundX}
            title="No vendors registered yet"
            description="This route exists but nobody has attached a vehicle and fares to it."
            actionLabel="I run this route"
            onAction={joinThisRoute}
          />
        ) : (
          <>
            <View className="gap-2">
              <View className="flex-row items-center gap-2">
                <StatusBadge isLive />
                <Typography type="body-xs" color="muted">
                  {route.directionType === 'two-way'
                    ? 'Running the direction you selected'
                    : 'Running this route right now'}
                </Typography>
              </View>
              {activeVendors.length > 0 ? (
                activeVendors.map((vendor) => (
                  <VendorRow key={vendor.registration.id} route={route} vendor={vendor} />
                ))
              ) : (
                <View className="border-border bg-surface-secondary gap-1 rounded-2xl border p-4">
                  <Typography type="body-sm" weight="semibold">
                    No vehicle is running right now
                  </Typography>
                  <Typography type="body-sm" color="muted">
                    {route.directionType === 'two-way'
                      ? 'Nobody has started a journey in this direction. Try the other direction, or contact a registered operator below.'
                      : 'Nobody has started a journey on this route yet. You can contact a registered operator below.'}
                  </Typography>
                </View>
              )}
            </View>

            {inactiveVendors.length > 0 ? (
              <View className="gap-2">
                <Separator />
                <View className="flex-row items-center gap-2 pt-1">
                  <StatusBadge isLive={false} label="Not running" />
                  <Typography type="body-xs" color="muted">
                    Registered on this route
                  </Typography>
                </View>
                {inactiveVendors.map((vendor) => (
                  <VendorRow key={vendor.registration.id} route={route} vendor={vendor} />
                ))}
              </View>
            ) : null}
          </>
        )}
      </View>

      <Separator />

      <View className="gap-3">
        <Typography type="h6">{route.stopType === 'fixed' ? 'Stops' : 'Route points'}</Typography>
        {route.stopType === 'flexible' ? (
          <Typography type="body-sm" color="muted">
            This vendor picks up and drops off anywhere along the route, so wait at any point on the
            path.
          </Typography>
        ) : null}
        <StopList route={route} direction={direction} origin={coordinate} />
      </View>

      {vendors.length > 0 ? (
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
      ) : null}
    </ScrollView>
  );
}
