import { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import {
  LocateFixed,
  MapPinOff,
  Maximize2,
  Radar,
  Route as RouteIcon,
  SearchX,
  Zap,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Button, Spinner, Typography } from 'heroui-native';

import MapView from '@/components/MapView';
import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { LinearGradient } from '@/components/ui/primitives/LinearGradient';
import { Reveal } from '@/components/ui/Reveal';
import { Tappable } from '@/components/ui/Tappable';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { formatDistance, regionForRadius } from '@/lib/geo';
import {
  HERO_GRADIENT,
  ICON_COLORS,
  MAP_COLORS,
  ON_BRAND_LIVE_SURFACE,
  ON_BRAND_SURFACE,
} from '@/lib/mapTheme';
import { useTransportStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';
import type { MapMarker, MapPolyline } from '@/components/MapView.types';

const RADIUS_OPTIONS = [1, 2, 5, 10];

/**
 * Summary pill that sits on top of the gradient header. The `live` tone picks up
 * the green half of the brand, so "vehicles running" is green here for the same
 * reason it is green on every route card.
 */
function HeroStat({
  icon: Icon,
  label,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  label: string;
  tone?: 'neutral' | 'live';
}) {
  const isLive = tone === 'live';

  return (
    <View
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: isLive ? ON_BRAND_LIVE_SURFACE : ON_BRAND_SURFACE }}
    >
      <Icon color={isLive ? ICON_COLORS.onBrandMint : ICON_COLORS.onBrand} size={13} />
      <Typography type="body-xs" weight="semibold" className="text-white">
        {label}
      </Typography>
    </View>
  );
}

export default function ExploreScreen() {
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);

  const { status, coordinate, mapCenter, request } = useCurrentLocation();
  const [radiusKm, setRadiusKm] = useState(5);
  const [query, setQuery] = useState('');
  // The preview map sits inside the list header. Leaving its gestures on means
  // it swallows vertical pans and the list stops scrolling, so panning is only
  // enabled once the passenger explicitly expands the map.
  const [mapExpanded, setMapExpanded] = useState(false);

  // The header bleeds into the status bar, so its icons have to invert while
  // this screen is the focused one.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('light');
      return () => setStatusBarStyle('dark');
    }, []),
  );

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

  const runningNow = useMemo(
    () => nearby.reduce((total, item) => total + item.activeVendorCount, 0),
    [nearby],
  );

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
    <View className="bg-background flex-1">
      <FlatList
        data={nearby}
        keyExtractor={(item) => item.route.id}
        contentContainerClassName={cn('gap-3 pb-10', CONTENT_COLUMN)}
        showsVerticalScrollIndicator={false}
        // Without this the first tap after typing is swallowed to dismiss the
        // keyboard, so cards and buttons appear to ignore the press.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-4">
            <LinearGradient
              colors={HERO_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="pt-safe-offset-4 gap-4 rounded-b-[32px] px-4 pb-6"
            >
              <View className="gap-1">
                <View className="flex-row items-center gap-1.5">
                  <Radar color={ICON_COLORS.onBrandMint} size={14} />
                  <Typography
                    type="body-xs"
                    weight="semibold"
                    className="tracking-wide text-white uppercase"
                  >
                    Transport near you
                  </Typography>
                </View>
                <Typography type="h3" className="text-white">
                  Where are you going?
                </Typography>
              </View>

              <RouteSearchField
                value={query}
                onChange={setQuery}
                placeholder="Sector, stop or landmark"
                className="bg-background"
              />

              <View className="flex-row flex-wrap items-center gap-2">
                <Reveal distance={0} delay={80}>
                  <HeroStat icon={Zap} label={`${runningNow} vehicles running`} tone="live" />
                </Reveal>
                <Reveal distance={0} delay={140}>
                  <HeroStat
                    icon={RouteIcon}
                    label={
                      coordinate
                        ? `${nearby.length} routes within ${radiusKm} km`
                        : `${nearby.length} routes published`
                    }
                  />
                </Reveal>
              </View>
            </LinearGradient>

            <View className="gap-4 px-4">
              <View className="border-border bg-surface-secondary overflow-hidden rounded-3xl border">
                <MapView
                  style={{ width: '100%', height: mapExpanded ? 340 : 232 }}
                  region={region}
                  showsUserLocation={status === 'granted'}
                  scrollEnabled={mapExpanded}
                  zoomEnabled={mapExpanded}
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

                <View className="absolute top-3 right-3 gap-2">
                  <Tappable
                    onPress={() => void request()}
                    haptic="medium"
                    accessibilityLabel="Update my location"
                    className="border-border bg-background h-11 w-11 items-center justify-center rounded-full border"
                  >
                    <LocateFixed
                      color={status === 'granted' ? MAP_COLORS.route : MAP_COLORS.routeMuted}
                      size={19}
                    />
                  </Tappable>

                  <Tappable
                    onPress={() => setMapExpanded((previous) => !previous)}
                    haptic="selection"
                    accessibilityLabel={mapExpanded ? 'Shrink the map' : 'Expand and pan the map'}
                    accessibilityState={{ expanded: mapExpanded }}
                    className={cn(
                      'border-border h-11 w-11 items-center justify-center rounded-full border',
                      mapExpanded ? 'bg-accent border-accent' : 'bg-background',
                    )}
                  >
                    <Maximize2
                      color={mapExpanded ? ICON_COLORS.onBrand : MAP_COLORS.route}
                      size={18}
                    />
                  </Tappable>
                </View>

                <View className="border-border bg-background absolute right-3 bottom-3 left-3 flex-row items-center gap-1 rounded-full border p-1">
                  {RADIUS_OPTIONS.map((option) => {
                    const isSelected = option === radiusKm;
                    return (
                      <Tappable
                        key={option}
                        onPress={() => setRadiusKm(option)}
                        haptic="selection"
                        pressedScale={0.93}
                        // Adjacent pills: horizontal slop would overlap the
                        // neighbour and select the wrong radius near the edge.
                        hitSlop={{ top: 8, bottom: 8 }}
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Search within ${option} kilometres`}
                        className={cn(
                          'min-h-9 flex-1 items-center justify-center rounded-full py-2',
                          isSelected ? 'bg-accent' : 'bg-transparent',
                        )}
                      >
                        <Typography
                          type="body-xs"
                          weight="semibold"
                          className={isSelected ? 'text-accent-foreground' : 'text-muted'}
                        >
                          {option} km
                        </Typography>
                      </Tappable>
                    );
                  })}
                </View>
              </View>

              {status === 'loading' ? (
                <View className="bg-surface-secondary flex-row items-center gap-2 rounded-2xl px-4 py-3">
                  <Spinner size="sm" />
                  <Typography type="body-sm" color="muted">
                    Finding your location…
                  </Typography>
                </View>
              ) : null}

              {status === 'denied' || status === 'unavailable' ? (
                <Reveal>
                  <View className="border-border bg-surface-secondary gap-3 rounded-2xl border p-4">
                    <View className="flex-row items-center gap-2">
                      <MapPinOff color={MAP_COLORS.routeDraft} size={18} />
                      <Typography type="body" weight="semibold">
                        Location is off
                      </Typography>
                    </View>
                    <Typography type="body-sm" color="muted">
                      Distances to pickup points need your location. You can still browse every
                      published route without it.
                    </Typography>
                    <View className="flex-row gap-2">
                      <Button size="sm" className="flex-1" onPress={() => void request()}>
                        <Button.Label>Turn on location</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="tertiary"
                        className="flex-1"
                        onPress={() => router.push('/routes')}
                      >
                        <Button.Label>Browse all</Button.Label>
                      </Button>
                    </View>
                  </View>
                </Reveal>
              ) : null}

              {nearby.length > 0 ? (
                <SectionHeader
                  title="Routes you can catch"
                  meta={coordinate ? 'Running first, then nearest' : 'Running first'}
                />
              ) : null}
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal index={index} className="px-4">
            <RouteCard
              item={item}
              showAccessDistance={coordinate !== null}
              onPress={() =>
                router.push({ pathname: '/route/[id]', params: { id: item.route.id } })
              }
            />
          </Reveal>
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
    </View>
  );
}
