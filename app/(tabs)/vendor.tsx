import { ArrowRight, BusFront, MapPlus, PlusCircle, Route as RouteIcon } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Surface, Typography, useThemeColor } from 'heroui-native';

import { CategoryTile } from '@/components/CategoryTile';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Reveal } from '@/components/ui/Reveal';
import { Tappable } from '@/components/ui/Tappable';
import { formatFare, minutesSince, startingFare } from '@/lib/geo';
import { directionLabel } from '@/lib/types';
import { findActiveJourneyForRegistration, registrationsForAccount } from '@/lib/transport';
import { useSessionStore, useTransportStore } from '@/lib/store';
import { useRouteDraftStore } from '@/lib/routeDraft';

export default function VendorScreen() {
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const account = useSessionStore((state) => state.account);
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const startCreate = useRouteDraftStore((state) => state.startCreate);

  if (!account) {
    return (
      <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-4">
        <Card>
          <Card.Body className="gap-3 p-0">
            <View className="bg-route-surface h-12 w-12 items-center justify-center rounded-2xl">
              <BusFront color={accent} size={24} />
            </View>
            <Card.Title>Publish the route you already run</Card.Title>
            <Card.Description>
              Wagon, van, coaster, shuttle — if you drive a fixed route every day, add it once and
              passengers nearby can find it. The transport isn&apos;t missing; the data is.
            </Card.Description>
          </Card.Body>
          <Card.Footer className="p-0 pt-4">
            <Button onPress={() => router.push('/vendor/sign-in')}>
              <Button.Label>Sign in as a vendor</Button.Label>
            </Button>
          </Card.Footer>
        </Card>

        <View className="gap-3">
          <SectionHeader title="How it works" />
          {[
            'Draw your route on the map, or join a route someone already published.',
            'Add your vehicle, trip time and fare slabs.',
            'Start a journey when you set off so passengers can see you are running.',
          ].map((line, index) => (
            <Surface key={line} variant="secondary" className="flex-row items-start gap-3">
              <View className="bg-accent h-6 w-6 items-center justify-center rounded-full">
                <Typography type="body-xs" weight="bold" className="text-accent-foreground">
                  {index + 1}
                </Typography>
              </View>
              <Typography type="body-sm" className="flex-1">
                {line}
              </Typography>
            </Surface>
          ))}
        </View>
      </ScrollView>
    );
  }

  const myRegistrations = registrationsForAccount(registrations, account.id);

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-4 pb-10">
      <View className="gap-1">
        <Typography type="body-sm" color="muted">
          Signed in as
        </Typography>
        <Typography type="h5">{account.name}</Typography>
      </View>

      <View className="gap-3">
        <Tappable
          onPress={() => {
            startCreate({ vendorName: account.name, contact: account.phone });
            router.push('/vendor/new/path');
          }}
          accessibilityLabel="Create a new route. Draw the path you drive and publish it."
          className="border-border bg-surface flex-row items-center gap-3 rounded-3xl border p-4"
        >
          <View className="bg-route-surface h-11 w-11 items-center justify-center rounded-2xl">
            <MapPlus color={accent} size={22} />
          </View>
          <View className="flex-1">
            <Typography type="body" weight="semibold">
              Create a new route
            </Typography>
            <Typography type="body-sm" color="muted">
              Draw the path you drive and publish it
            </Typography>
          </View>
          <ArrowRight color={muted} size={18} />
        </Tappable>

        <Tappable
          onPress={() => router.push('/vendor/join')}
          accessibilityLabel="Join an existing route and add your vehicle to it."
          className="border-border bg-surface flex-row items-center gap-3 rounded-3xl border p-4"
        >
          <View className="bg-surface-secondary h-11 w-11 items-center justify-center rounded-2xl">
            <PlusCircle color={muted} size={22} />
          </View>
          <View className="flex-1">
            <Typography type="body" weight="semibold">
              Join an existing route
            </Typography>
            <Typography type="body-sm" color="muted">
              Someone already added your route — add your vehicle to it
            </Typography>
          </View>
          <ArrowRight color={muted} size={18} />
        </Tappable>
      </View>

      <View className="gap-3">
        <SectionHeader
          title="My routes"
          meta={myRegistrations.length > 0 ? `${myRegistrations.length} registered` : undefined}
        />
        {myRegistrations.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title="No routes published yet"
            description="Add the route you run and it becomes searchable for passengers around you."
            actionLabel="Create a route"
            onAction={() => {
              startCreate({ vendorName: account.name, contact: account.phone });
              router.push('/vendor/new/path');
            }}
          />
        ) : (
          myRegistrations.map((registration, index) => {
            const route = routes.find((candidate) => candidate.id === registration.routeId);
            if (!route) return null;
            const journey = findActiveJourneyForRegistration(journeys, registration.id);
            const fareFrom = startingFare(registration.fareSlabs);

            return (
              <Reveal key={registration.id} index={index}>
                <Card>
                  <Card.Body className="gap-3 p-0">
                    <View className="flex-row items-center justify-between gap-3">
                      <CategoryTile category={route.category} size="sm" muted={journey === null} />
                      <View className="flex-1">
                        <Typography type="body" weight="semibold" numberOfLines={1}>
                          {route.name}
                        </Typography>
                        <Typography type="body-xs" color="muted" numberOfLines={1}>
                          {registration.vehicleRegistration}
                          {fareFrom !== null ? ` · from ${formatFare(fareFrom)}` : ''}
                        </Typography>
                      </View>
                      <StatusBadge isLive={journey !== null} />
                    </View>

                    {journey ? (
                      <View className="bg-live-surface rounded-xl px-3 py-2">
                        <Typography type="body-xs" weight="semibold" className="text-live">
                          {directionLabel(route, journey.direction)}
                        </Typography>
                        <Typography type="body-xs" className="text-live">
                          Running for {minutesSince(journey.startedAt)} min
                        </Typography>
                      </View>
                    ) : null}

                    <View className="flex-row gap-2">
                      <Button
                        size="sm"
                        variant={journey ? 'danger-soft' : 'primary'}
                        className="flex-1"
                        onPress={() =>
                          router.push({
                            pathname: '/journey/[registrationId]',
                            params: { registrationId: registration.id },
                          })
                        }
                      >
                        <Button.Label>{journey ? 'End journey' : 'Start journey'}</Button.Label>
                      </Button>
                      <Button
                        size="sm"
                        variant="tertiary"
                        className="flex-1"
                        onPress={() =>
                          router.push({
                            pathname: '/vendor/registration/[id]',
                            params: { id: registration.id },
                          })
                        }
                      >
                        <Button.Label>Manage</Button.Label>
                      </Button>
                    </View>
                  </Card.Body>
                </Card>
              </Reveal>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
