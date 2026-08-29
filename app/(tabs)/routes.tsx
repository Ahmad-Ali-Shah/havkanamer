import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SearchX } from 'lucide-react-native';
import { Chip, Typography } from 'heroui-native';

import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { ROUTE_CATEGORIES } from '@/lib/types';
import { useTransportStore } from '@/lib/store';
import type { RouteCategory } from '@/lib/types';

type CategoryFilter = RouteCategory | 'all';

export default function RoutesScreen() {
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const { coordinate } = useCurrentLocation();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [liveOnly, setLiveOnly] = useState(false);

  const items = useMemo(() => {
    return routes
      .filter((route) => matchesQuery(route, query))
      .filter((route) => category === 'all' || route.category === category)
      .map((route) => describeRoute(route, registrations, journeys, coordinate))
      .filter((item) => !liveOnly || item.activeVendorCount > 0)
      .sort((a, b) => {
        if (a.activeVendorCount !== b.activeVendorCount) {
          return b.activeVendorCount - a.activeVendorCount;
        }
        return a.route.name.localeCompare(b.route.name);
      });
  }, [routes, registrations, journeys, coordinate, query, category, liveOnly]);

  return (
    <View className="bg-background flex-1">
      <FlatList
        data={items}
        keyExtractor={(item) => item.route.id}
        contentContainerClassName="gap-3 px-4 pb-8"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-3 pt-3 pb-1">
            <RouteSearchField
              value={query}
              onChange={setQuery}
              placeholder="Search routes, sectors or stops"
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2 pr-4"
            >
              <Chip
                size="sm"
                variant={liveOnly ? 'primary' : 'tertiary'}
                color={liveOnly ? 'success' : 'default'}
                onPress={() => setLiveOnly((previous) => !previous)}
              >
                <Chip.Label>Operating now</Chip.Label>
              </Chip>
              <Chip
                size="sm"
                variant={category === 'all' ? 'primary' : 'tertiary'}
                color={category === 'all' ? 'accent' : 'default'}
                onPress={() => setCategory('all')}
              >
                <Chip.Label>All types</Chip.Label>
              </Chip>
              {ROUTE_CATEGORIES.map((option) => (
                <Chip
                  key={option.value}
                  size="sm"
                  variant={category === option.value ? 'primary' : 'tertiary'}
                  color={category === option.value ? 'accent' : 'default'}
                  onPress={() => setCategory(option.value)}
                >
                  <Chip.Label>{option.label}</Chip.Label>
                </Chip>
              ))}
            </ScrollView>

            <Typography type="body-sm" weight="semibold">
              {items.length} {items.length === 1 ? 'route' : 'routes'}
            </Typography>
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
          <EmptyState
            icon={SearchX}
            title="Nothing matches these filters"
            description="Clear the filters to see every published route, including ones nobody is running right now."
            actionLabel="Clear filters"
            onAction={() => {
              setQuery('');
              setCategory('all');
              setLiveOnly(false);
            }}
          />
        }
      />
    </View>
  );
}
