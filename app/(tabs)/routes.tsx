import { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowUpDown, BusFront, Zap } from 'lucide-react-native';
import { Typography, useThemeColor } from 'heroui-native';

import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { RouteSuggestions } from '@/components/RouteSuggestions';
import { SectionHeader } from '@/components/SectionHeader';
import { FilterChip } from '@/components/ui/FilterChip';
import { Reveal } from '@/components/ui/Reveal';
import { Tappable } from '@/components/ui/Tappable';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import { buildSuggestions, type Suggestion } from '@/lib/search';
import { useTransportStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';
import type { RouteCategory } from '@/lib/types';

type CategoryFilter = RouteCategory | 'all';
type SortOrder = 'running' | 'name';

/** Row stagger, so each card's route line traces itself as the row lands. */
const DRAW_STAGGER_MS = 70;
const MAX_STAGGERED_ROWS = 8;

export default function RoutesScreen() {
  const [muted] = useThemeColor(['muted']);
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const { coordinate } = useCurrentLocation();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [liveOnly, setLiveOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('running');
  const [searchFocused, setSearchFocused] = useState(false);

  const items = useMemo(() => {
    return routes
      .filter((route) => matchesQuery(route, query))
      .filter((route) => category === 'all' || route.category === category)
      .map((route) => describeRoute(route, registrations, journeys, coordinate))
      .filter((item) => !liveOnly || item.activeVendorCount > 0)
      .sort((a, b) => {
        if (sortOrder === 'running' && a.activeVendorCount !== b.activeVendorCount) {
          return b.activeVendorCount - a.activeVendorCount;
        }
        return a.route.name.localeCompare(b.route.name);
      });
  }, [routes, registrations, journeys, coordinate, query, category, liveOnly, sortOrder]);

  // Suggestions only while the field is being used, so they never sit on top of
  // the results the passenger is already reading.
  const suggestions = useMemo(
    () => (searchFocused ? buildSuggestions(routes, query) : []),
    [routes, query, searchFocused],
  );

  const applySuggestion = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.query);
    setSearchFocused(false);

    if (suggestion.routeId) {
      router.push({ pathname: '/route/[id]', params: { id: suggestion.routeId } });
    }
  }, []);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('all');
    setLiveOnly(false);
  }, []);

  return (
    <View className="bg-background flex-1">
      <FlatList
        data={items}
        keyExtractor={(item) => item.route.id}
        contentContainerClassName={cn('gap-3 px-4 pb-10', CONTENT_COLUMN)}
        showsVerticalScrollIndicator={false}
        // Without this the first tap after typing is swallowed to dismiss the
        // keyboard, so cards and chips appear to ignore the press.
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View className="gap-3 pt-3">
            <RouteSearchField
              value={query}
              onChange={setQuery}
              placeholder="Search routes, sectors or stops"
              focusedPlaceholder="Try a sector like F-10, or a stop name"
              onFocusChange={setSearchFocused}
            />

            <RouteSuggestions suggestions={suggestions} onSelect={applySuggestion} />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-2 pr-4"
            >
              <FilterChip
                label="Running now"
                icon={Zap}
                tone="success"
                isSelected={liveOnly}
                onPress={() => setLiveOnly((previous) => !previous)}
              />

              <FilterChip
                label="All types"
                isSelected={category === 'all'}
                onPress={() => setCategory('all')}
              />

              {CATEGORY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  isSelected={category === option.value}
                  onPress={() => setCategory(option.value)}
                />
              ))}
            </ScrollView>

            <SectionHeader
              title={`${items.length} ${items.length === 1 ? 'route' : 'routes'}`}
              action={
                <Tappable
                  onPress={() =>
                    setSortOrder((previous) => (previous === 'running' ? 'name' : 'running'))
                  }
                  haptic="selection"
                  pressedScale={0.94}
                  accessibilityState={{ selected: sortOrder === 'running' }}
                  accessibilityLabel={
                    sortOrder === 'running'
                      ? 'Sorted with running routes first. Switch to A to Z.'
                      : 'Sorted A to Z. Switch to running routes first.'
                  }
                  className={cn(
                    'flex-row items-center gap-1.5 rounded-full border px-3 py-1.5',
                    sortOrder === 'running'
                      ? 'border-live-border bg-live-surface'
                      : 'border-border bg-surface-secondary',
                  )}
                >
                  <ArrowUpDown color={muted} size={12} />
                  <Typography
                    type="body-xs"
                    weight="semibold"
                    className={sortOrder === 'running' ? 'text-live' : 'text-muted'}
                  >
                    {sortOrder === 'running' ? 'Running first' : 'A–Z'}
                  </Typography>
                </Tappable>
              }
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal index={index} animateLayout>
            <RouteCard
              item={item}
              showAccessDistance={coordinate !== null}
              drawDelay={Math.min(index, MAX_STAGGERED_ROWS) * DRAW_STAGGER_MS}
              onPress={() =>
                router.push({ pathname: '/route/[id]', params: { id: item.route.id } })
              }
            />
          </Reveal>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={BusFront}
            title="No routes found"
            description="Try another sector or stop, or clear the filters to see every published route — including ones nobody is running right now."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        }
      />
    </View>
  );
}
