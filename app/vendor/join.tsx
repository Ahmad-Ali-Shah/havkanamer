import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { RouteOff } from 'lucide-react-native';
import { Typography } from 'heroui-native';

import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { useRouteDraftStore } from '@/lib/routeDraft';
import { useSessionStore, useTransportStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';

export default function JoinRouteScreen() {
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const account = useSessionStore((state) => state.account);
  const startJoin = useRouteDraftStore((state) => state.startJoin);
  const startCreate = useRouteDraftStore((state) => state.startCreate);
  const { coordinate } = useCurrentLocation();

  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    return routes
      .filter((route) => matchesQuery(route, query))
      .map((route) => describeRoute(route, registrations, journeys, coordinate))
      .sort((a, b) => a.accessDistanceKm - b.accessDistanceKm);
  }, [routes, registrations, journeys, coordinate, query]);

  const handleSelect = (routeId: string) => {
    if (!account) {
      router.push('/vendor/sign-in');
      return;
    }
    startJoin(routeId, { vendorName: account.name, contact: account.phone });
    router.push('/vendor/new/vehicle');
  };

  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName={cn('gap-4 p-4 pb-10', CONTENT_COLUMN)}
      keyboardShouldPersistTaps="handled"
    >
      <View className="gap-1">
        <Typography type="h5">Find your route</Typography>
        <Typography type="body-sm" color="muted">
          If another vendor already added the route you drive, attach your vehicle to it instead of
          creating a duplicate.
        </Typography>
      </View>

      <RouteSearchField
        value={query}
        onChange={setQuery}
        placeholder="Search by area, stop or route name"
      />

      {items.length === 0 ? (
        <EmptyState
          icon={RouteOff}
          title="No matching route"
          description="Nothing published matches that search yet. Create the route instead and passengers will find it."
          actionLabel="Create a new route"
          onAction={() => {
            if (!account) {
              router.push('/vendor/sign-in');
              return;
            }
            startCreate({ vendorName: account.name, contact: account.phone });
            router.replace('/vendor/new/path');
          }}
        />
      ) : (
        items.map((item) => (
          <RouteCard
            key={item.route.id}
            item={item}
            onPress={() => handleSelect(item.route.id)}
            showAccessDistance={coordinate !== null}
          />
        ))
      )}
    </ScrollView>
  );
}
