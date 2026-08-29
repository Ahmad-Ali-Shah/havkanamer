import { useMemo, useState } from 'react';
import { FlatList, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { SearchX, Zap } from 'lucide-react-native';
import { Chip, useThemeColor } from 'heroui-native';

import { EmptyState } from '@/components/EmptyState';
import { RouteCard } from '@/components/RouteCard';
import { RouteSearchField } from '@/components/RouteSearchField';
import { SectionHeader } from '@/components/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { describeRoute, matchesQuery } from '@/lib/transport';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import { tapFeedback } from '@/lib/haptics';
import { ICON_COLORS } from '@/lib/mapTheme';
import { useTransportStore } from '@/lib/store';
import type { RouteCategory } from '@/lib/types';

type CategoryFilter = RouteCategory | 'all';

export default function RoutesScreen() {
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);
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
        contentContainerClassName="gap-3 px-4 pb-10"
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
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="gap-2 pr-4"
            >
              <Chip
                size="sm"
                variant={liveOnly ? 'primary' : 'tertiary'}
                color={liveOnly ? 'success' : 'default'}
                onPress={() => {
                  tapFeedback('selection');
                  setLiveOnly((previous) => !previous);
                }}
              >
                <Zap color={liveOnly ? ICON_COLORS.onBrand : muted} size={13} />
                <Chip.Label>Running now</Chip.Label>
              </Chip>

              <Chip
                size="sm"
                variant={category === 'all' ? 'primary' : 'tertiary'}
                color={category === 'all' ? 'accent' : 'default'}
                onPress={() => {
                  tapFeedback('selection');
                  setCategory('all');
                }}
              >
                <Chip.Label>All types</Chip.Label>
              </Chip>

              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = category === option.value;
                const Icon = option.icon;
                return (
                  <Chip
                    key={option.value}
                    size="sm"
                    variant={isSelected ? 'primary' : 'tertiary'}
                    color={isSelected ? 'accent' : 'default'}
                    onPress={() => {
                      tapFeedback('selection');
                      setCategory(option.value);
                    }}
                  >
                    <Icon color={isSelected ? accentForeground : muted} size={13} />
                    <Chip.Label>{option.label}</Chip.Label>
                  </Chip>
                );
              })}
            </ScrollView>

            <SectionHeader
              title={`${items.length} ${items.length === 1 ? 'route' : 'routes'}`}
              meta="Running first"
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <Reveal index={index}>
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
