import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { CircleOff, Clock, Radio } from 'lucide-react-native';
import { Button, Card, Surface, Typography } from 'heroui-native';

import MapView from '@/components/MapView';
import { DirectionSwitch } from '@/components/DirectionSwitch';
import { EmptyState } from '@/components/EmptyState';
import { Reveal } from '@/components/ui/Reveal';
import { formatClockTime, minutesSince, regionForCoordinates } from '@/lib/geo';
import { exitFlowTo, goBackOrReplace } from '@/lib/navigation';
import { tapFeedback } from '@/lib/haptics';
import { ICON_COLORS, MAP_COLORS } from '@/lib/mapTheme';
import { directionLabel, directionPath } from '@/lib/types';
import { findActiveJourneyForRegistration } from '@/lib/transport';
import { useTransportStore } from '@/lib/store';
import type { RouteDirection } from '@/lib/types';

export default function JourneyScreen() {
  const { registrationId } = useLocalSearchParams<{ registrationId: string }>();

  const registration = useTransportStore((state) =>
    state.registrations.find((candidate) => candidate.id === registrationId),
  );
  const route = useTransportStore((state) =>
    state.routes.find((candidate) => candidate.id === registration?.routeId),
  );
  const journeys = useTransportStore((state) => state.journeys);
  const startJourney = useTransportStore((state) => state.startJourney);
  const endJourney = useTransportStore((state) => state.endJourney);

  const [direction, setDirection] = useState<RouteDirection>('forward');
  const [confirmingEnd, setConfirmingEnd] = useState(false);

  if (!registration || !route) {
    return (
      <View className="bg-background flex-1 justify-center">
        <Stack.Screen options={{ title: 'Journey' }} />
        <EmptyState
          icon={CircleOff}
          title="Registration not found"
          description="This vehicle is no longer registered on a route."
          actionLabel="Back to my routes"
          onAction={() => exitFlowTo('/vendor')}
        />
      </View>
    );
  }

  const activeJourney = findActiveJourneyForRegistration(journeys, registration.id);
  const shownDirection = activeJourney ? activeJourney.direction : direction;
  const path = directionPath(route, shownDirection);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-4 pb-10">
      <Stack.Screen options={{ title: activeJourney ? 'Active journey' : 'Start journey' }} />

      <View className="gap-1">
        <Typography type="body-sm" color="muted">
          {registration.vehicleRegistration}
        </Typography>
        <Typography type="h5">{route.name}</Typography>
      </View>

      {activeJourney ? (
        <Card className="border-live bg-live-surface">
          <Card.Body className="gap-2 p-0">
            <View className="flex-row items-center gap-2">
              <Radio color={ICON_COLORS.live} size={16} />
              <Typography type="body-sm" weight="semibold" className="text-live">
                Running now
              </Typography>
            </View>
            <Typography type="h6">{directionLabel(route, activeJourney.direction)}</Typography>
            <View className="flex-row items-center gap-1.5">
              <Clock color={ICON_COLORS.live} size={14} />
              <Typography type="body-sm" className="text-live">
                Started {formatClockTime(activeJourney.startedAt)} ·{' '}
                {minutesSince(activeJourney.startedAt)} min ago
              </Typography>
            </View>
          </Card.Body>
        </Card>
      ) : (
        <View className="gap-3">
          <Typography type="body-sm" color="muted">
            Passengers only see you in live results while a journey is running. Pick the direction
            you are heading.
          </Typography>
          <DirectionSwitch route={route} value={direction} onChange={setDirection} />
          {route.directionType === 'one-way' ? (
            <Surface variant="secondary">
              <Typography type="body-sm" weight="semibold">
                {directionLabel(route, 'forward')}
              </Typography>
              <Typography type="body-xs" color="muted">
                This route runs one way only.
              </Typography>
            </Surface>
          ) : null}
        </View>
      )}

      <View className="border-border overflow-hidden rounded-2xl border">
        <MapView
          style={{ width: '100%', height: 220 }}
          initialRegion={regionForCoordinates(route.path)}
          showsUserLocation
          polylines={[
            {
              id: route.id,
              coordinates: path,
              strokeColor: activeJourney ? MAP_COLORS.route : MAP_COLORS.routeMuted,
              strokeWidth: 4,
            },
          ]}
          markers={[
            {
              id: 'from',
              coordinate: path[0],
              title: 'Start',
              color: MAP_COLORS.start,
            },
            {
              id: 'to',
              coordinate: path[path.length - 1],
              title: 'End',
              color: MAP_COLORS.end,
            },
          ]}
        />
      </View>

      {activeJourney ? (
        <View className="gap-2">
          <Button
            variant={confirmingEnd ? 'danger' : 'danger-soft'}
            onPress={() => {
              if (!confirmingEnd) {
                tapFeedback('warning');
                setConfirmingEnd(true);
                return;
              }
              endJourney(activeJourney.id);
              setConfirmingEnd(false);
              tapFeedback('success');
              goBackOrReplace('/vendor');
            }}
          >
            <Button.Label>{confirmingEnd ? 'Yes, end this journey' : 'End journey'}</Button.Label>
          </Button>
          {confirmingEnd ? (
            <Reveal distance={6}>
              <Button variant="ghost" onPress={() => setConfirmingEnd(false)}>
                <Button.Label>Keep running</Button.Label>
              </Button>
            </Reveal>
          ) : (
            <Typography type="body-xs" color="muted" className="text-center">
              Ending the journey removes you from live results.
            </Typography>
          )}
        </View>
      ) : (
        <Button
          onPress={() => {
            startJourney(registration.id, route.id, direction);
            tapFeedback('success');
            goBackOrReplace('/vendor');
          }}
        >
          <Button.Label>Start journey</Button.Label>
        </Button>
      )}
    </ScrollView>
  );
}
