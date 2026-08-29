import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { MapPin, Trash2, Undo2 } from 'lucide-react-native';
import { Button, Input, Surface, Typography, useThemeColor } from 'heroui-native';

import MapView from '@/components/MapView';
import { pathLengthKm, formatDistance, regionForRadius } from '@/lib/geo';
import { ISLAMABAD_CENTER, MAP_COLORS } from '@/lib/mapTheme';
import { createId } from '@/lib/utils';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useRouteDraftStore } from '@/lib/routeDraft';
import type { LatLng, MapMarker } from '@/components/MapView.types';

interface Waypoint {
  id: string;
  coordinate: LatLng;
  name: string;
}

export default function DrawRouteScreen() {
  const [muted] = useThemeColor(['muted']);
  const patch = useRouteDraftStore((state) => state.patch);
  const { coordinate } = useCurrentLocation();

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  const initialRegion = useMemo(
    () => regionForRadius(coordinate ?? ISLAMABAD_CENTER, 5),
    [coordinate],
  );

  const path = waypoints.map((waypoint) => waypoint.coordinate);
  const lengthKm = pathLengthKm(path);
  const startName = waypoints[0]?.name.trim() ?? '';
  const endName = waypoints.length > 1 ? (waypoints.at(-1)?.name.trim() ?? '') : '';
  const canContinue = waypoints.length >= 2 && startName.length > 1 && endName.length > 1;

  const addWaypoint = (point: LatLng) => {
    setWaypoints((current) => [...current, { id: createId('wp'), coordinate: point, name: '' }]);
  };

  const renameWaypoint = (id: string, name: string) => {
    setWaypoints((current) =>
      current.map((waypoint) => (waypoint.id === id ? { ...waypoint, name } : waypoint)),
    );
  };

  const markers: MapMarker[] = waypoints.map((waypoint, index) => ({
    id: waypoint.id,
    coordinate: waypoint.coordinate,
    title: waypoint.name || `Point ${index + 1}`,
    color:
      index === 0
        ? MAP_COLORS.start
        : index === waypoints.length - 1 && waypoints.length > 1
          ? MAP_COLORS.end
          : MAP_COLORS.stop,
  }));

  const handleContinue = () => {
    if (!canContinue) return;
    const middle = waypoints.slice(1, -1);
    patch({
      path,
      startName,
      endName,
      stops: middle
        .filter((waypoint) => waypoint.name.trim().length > 0)
        .map((waypoint) => ({
          id: waypoint.id,
          name: waypoint.name.trim(),
          coordinate: waypoint.coordinate,
        })),
    });
    router.push('/vendor/new/details');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="gap-1 px-4 pt-3 pb-3">
        <Typography type="body-xs" color="muted">
          Step 1 of 4
        </Typography>
        <Typography type="h5">Tap the map to trace your route</Typography>
        <Typography type="body-sm" color="muted">
          Start where you pick up, tap through the areas you pass, and finish at your last drop-off.
        </Typography>
      </View>

      <View className="border-border mx-4 overflow-hidden rounded-2xl border">
        <MapView
          style={{ width: '100%', height: 260 }}
          initialRegion={initialRegion}
          showsUserLocation
          onPress={(event) => addWaypoint(event.coordinate)}
          markers={markers}
          polylines={
            path.length > 1
              ? [
                  {
                    id: 'draft',
                    coordinates: path,
                    strokeColor: MAP_COLORS.routeDraft,
                    strokeWidth: 4,
                  },
                ]
              : []
          }
        />
      </View>

      <View className="flex-row items-center justify-between gap-2 px-4 py-3">
        <Typography type="body-xs" color="muted">
          {waypoints.length === 0
            ? 'No points yet'
            : `${waypoints.length} points · ${formatDistance(lengthKm)}`}
        </Typography>
        <View className="flex-row gap-2">
          {coordinate ? (
            <Button size="sm" variant="tertiary" onPress={() => addWaypoint(coordinate)}>
              <MapPin color={muted} size={14} />
              <Button.Label>My location</Button.Label>
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={waypoints.length === 0}
            onPress={() => setWaypoints((current) => current.slice(0, -1))}
          >
            <Undo2 color={muted} size={14} />
            <Button.Label>Undo</Button.Label>
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={waypoints.length === 0}
            onPress={() => setWaypoints([])}
          >
            <Trash2 color={muted} size={14} />
            <Button.Label>Clear</Button.Label>
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-4 pb-4"
        keyboardShouldPersistTaps="handled"
      >
        {waypoints.length === 0 ? (
          <Surface variant="secondary">
            <Typography type="body-sm" color="muted">
              Tap the map to add your first pick-up point. You can name the middle points to turn
              them into stops passengers can search.
            </Typography>
          </Surface>
        ) : (
          waypoints.map((waypoint, index) => {
            const isFirst = index === 0;
            const isLast = index === waypoints.length - 1 && waypoints.length > 1;
            const role = isFirst ? 'Start' : isLast ? 'End' : `Stop ${index}`;

            return (
              <View key={waypoint.id} className="gap-1.5">
                <Typography type="body-xs" weight="semibold" color="muted">
                  {role}
                  {isFirst || isLast ? '' : ' (optional name)'}
                </Typography>
                <Input
                  value={waypoint.name}
                  onChangeText={(text) => renameWaypoint(waypoint.id, text)}
                  placeholder={
                    isFirst
                      ? 'e.g. Faizabad'
                      : isLast
                        ? 'e.g. F-10 Markaz'
                        : 'e.g. G-9 Karachi Company'
                  }
                  autoCapitalize="words"
                />
              </View>
            );
          })
        )}
      </ScrollView>

      <View className="border-border bg-background pb-safe-offset-4 border-t px-4 pt-3">
        <Button isDisabled={!canContinue} onPress={handleContinue}>
          <Button.Label>
            {waypoints.length < 2
              ? 'Add at least two points'
              : !canContinue
                ? 'Name the start and end points'
                : 'Continue'}
          </Button.Label>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
