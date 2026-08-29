import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Link, router } from 'expo-router';
import { MapPinOff, Navigation, SearchX } from 'lucide-react-native';
import { Chip, Spinner, Typography } from 'heroui-native';

import MapView from '@/components/MapView';
import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { SafeAreaView } from '@/components/ui/primitives/SafeAreaView';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { formatDistance, regionForRadius } from '@/lib/geo';
import { MAP_COLORS } from '@/lib/mapTheme';
import { useTransportStore } from '@/lib/store';
import type { MapMarker, MapPolyline } from '@/components/MapView.types';

const RADIUS_OPTIONS = [1, 2, 5, 10];

export default function ExploreScreen() {
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);

  const { status, coordinate, mapCenter, request } = useCurrentLocation();
  const [radiusKm, setRadiusKm] = useState(5);
  const [query, setQuery] = useState('');

  const nearby = useMemo(() => {
    const described = routes
      .filter((route) => matchesQuery(route, query))
      .map((route) => describeRoute(route, registrations, journeys, coordinate));

    const withinRadius = coordinate
      ? described.filter((item) => item.accessDistanceKm <= radiusKm)
      : described;

    return withinRadius.sort((a, b) => {
      if (a.activeVendorCount !== b.activeVendorCount) {
        return b.activeVendorCount - a.activeVendorCount;
      }
      return a.accessDistanceKm - b.accessDistanceKm;
    });
  }, [routes, registrations, journeys, coordinate, radiusKm, query]);

  const polylines = useMemo<MapPolyline[]>(
    () =>
      nearby.map((item) => ({
        id: item.route.id,
        coordinates: item.route.path,
        strokeColor: item.activeVendorCount > 0 ? MAP_COLORS.route : MAP_COLORS.routeMuted,
        strokeWidth: item.activeVendorCount > 0 ? 4 : 2.5,
      })),
    [nearby],
  );

  const markers = useMemo<MapMarker[]>(
    () =>
      nearby.map((item) => ({
        id: `${item.route.id}-access`,
        coordinate: item.accessPoint,
        title: item.route.name,
        description: coordinate
          ? `Pickup ${formatDistance(item.accessDistanceKm)} away`
          : item.route.start.name,
        color: item.activeVendorCount > 0 ? MAP_COLORS.start : MAP_COLORS.routeMuted,
        onPress: () => router.push({ pathname: '/route/[id]', params: { id: item.route.id } }),
      })),
    [nearby, coordinate],
  );

  const region = useMemo(() => regionForRadius(mapCenter, radiusKm), [mapCenter, radiusKm]);

  return (
    <SafeAreaView className="bg-background flex-1" edges={['top']}>
      <FlatList
        data={nearby}
        keyExtractor={(item) => item.route.id}
        contentContainerClassName="gap-3 px-4 pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-4 pb-1">
            <View className="gap-1 pt-2">
              <Typography type="h3">Transport near you</Typography>
              <Typography type="body-sm" color="muted">
                {status === 'granted'
                  ? 'Local routes passing within your chosen radius.'
                  : 'Showing Islamabad routes. Enable location for accurate distances.'}
              </Typography>
            </View>

            <RouteSearchField
              value={query}
              onChange={setQuery}
              placeholder="Where do you want to go?"
            />

            <View className="border-border overflow-hidden rounded-2xl border">
              <MapView
                style={{ width: '100%', height: 240 }}
                region={region}
                showsUserLocation={status === 'granted'}
                polylines={polylines}
                markers={markers}
                circles={
                  coordinate
                    ? [
                        {
                          id: 'radius',
                          center: coordinate,
                          radius: radiusKm * 1000,
                          fillColor: MAP_COLORS.radiusFill,
                          strokeColor: MAP_COLORS.radiusStroke,
                          strokeWidth: 1.5,
                        },
                      ]
                    : []
                }
              />
            </View>

            <View className="flex-row items-center gap-2">
              <Typography type="body-xs" color="muted">
                Radius
              </Typography>
              {RADIUS_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  size="sm"
                  variant={option === radiusKm ? 'primary' : 'tertiary'}
                  color={option === radiusKm ? 'accent' : 'default'}
                  onPress={() => setRadiusKm(option)}
                >
                  <Chip.Label>{option} km</Chip.Label>
                </Chip>
              ))}
            </View>

            {status === 'loading' ? (
              <View className="bg-surface-secondary flex-row items-center gap-2 rounded-xl px-3 py-3">
                <Spinner size="sm" />
                <Typography type="body-sm" color="muted">
                  Finding your location…
                </Typography>
              </View>
            ) : null}

            {status === 'denied' || status === 'unavailable' ? (
              <View className="border-border bg-surface-secondary gap-2 rounded-2xl border p-4">
                <View className="flex-row items-center gap-2">
                  <MapPinOff color={MAP_COLORS.routeDraft} size={18} />
                  <Typography type="body" weight="semibold">
                    Location is off
                  </Typography>
                </View>
                <Typography type="body-sm" color="muted">
                  Without location we cannot measure how far a pickup point is. You can still browse
                  every published route.
                </Typography>
                <View className="flex-row flex-wrap gap-2 pt-1">
                  <Chip size="sm" onPress={() => void request()}>
                    <Navigation color="#FFFFFF" size={13} />
                    <Chip.Label>Enable location</Chip.Label>
                  </Chip>
                  <Link href="/routes" asChild>
                    <Chip size="sm" variant="tertiary" color="default">
                      <Chip.Label>Browse all routes</Chip.Label>
                    </Chip>
                  </Link>
                </View>
              </View>
            ) : null}

            {nearby.length > 0 ? (
              <Typography type="body-sm" weight="semibold">
                {nearby.length} {nearby.length === 1 ? 'route' : 'routes'}
                {coordinate ? ` within ${radiusKm} km` : ''}
              </Typography>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <RouteCard
            item={item}
            showAccessDistance={coordinate !== null}
            onPress={() => router.push({ pathname: '/route/[id]', params: { id: item.route.id } })}
          />
        )}
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <EmptyState
              icon={SearchX}
              title="No route matches that"
              description="Try a sector or landmark name, or clear the search to see everything nearby."
              actionLabel="Clear search"
              onAction={() => setQuery('')}
            />
          ) : (
            <EmptyState
              icon={MapPinOff}
              title="No routes within this radius"
              description="Nothing published near you yet. Widen the radius, or publish the route you run yourself."
              actionLabel={radiusKm < 10 ? 'Widen to 10 km' : 'Browse all routes'}
              onAction={() => {
                if (radiusKm < 10) setRadiusKm(10);
                else router.push('/routes');
              }}
              secondaryActionLabel="I run a route"
              onSecondaryAction={() => router.push('/vendor')}
            />
          )
        }
      />
    </SafeAreaView>
  );
}
