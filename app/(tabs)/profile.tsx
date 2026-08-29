import { useState } from 'react';
import { Database, Info, RotateCcw, UserRound } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Separator, Surface, Typography, useThemeColor } from 'heroui-native';

import { SectionHeader } from '@/components/SectionHeader';
import { Reveal } from '@/components/ui/Reveal';
import { tapFeedback } from '@/lib/haptics';
import { ICON_COLORS } from '@/lib/mapTheme';
import { registrationsForAccount } from '@/lib/transport';
import { useSessionStore, useTransportStore } from '@/lib/store';

export default function ProfileScreen() {
  const [accent] = useThemeColor(['accent']);
  const account = useSessionStore((state) => state.account);
  const signOut = useSessionStore((state) => state.signOut);
  const routes = useTransportStore((state) => state.routes);
  const registrations = useTransportStore((state) => state.registrations);
  const journeys = useTransportStore((state) => state.journeys);
  const resetDemoData = useTransportStore((state) => state.resetDemoData);

  // Both of these throw work away, so neither fires on a single tap.
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const myRegistrations = account ? registrationsForAccount(registrations, account.id) : [];
  const myRoutes = account ? routes.filter((route) => route.createdByAccountId === account.id) : [];
  const myJourneys = account
    ? journeys.filter((journey) =>
        myRegistrations.some((registration) => registration.id === journey.registrationId),
      )
    : [];

  return (
    <ScrollView className="bg-background flex-1" contentContainerClassName="gap-5 p-4 pb-10">
      <Card>
        <Card.Body className="gap-3 p-0">
          <View className="flex-row items-center gap-3">
            <View className="bg-route-surface h-12 w-12 items-center justify-center rounded-full">
              <UserRound color={accent} size={24} />
            </View>
            <View className="flex-1">
              <Typography type="h6">{account ? account.name : 'Browsing as passenger'}</Typography>
              <Typography type="body-sm" color="muted">
                {account ? account.phone : 'Sign in only if you operate transport'}
              </Typography>
            </View>
          </View>
        </Card.Body>
        <Card.Footer className="gap-2 p-0 pt-4">
          {account ? (
            <>
              <Button
                variant={confirmingSignOut ? 'danger' : 'tertiary'}
                onPress={() => {
                  if (!confirmingSignOut) {
                    tapFeedback('warning');
                    setConfirmingSignOut(true);
                    return;
                  }
                  signOut();
                  setConfirmingSignOut(false);
                  tapFeedback('success');
                }}
              >
                <Button.Label>{confirmingSignOut ? 'Yes, sign out' : 'Sign out'}</Button.Label>
              </Button>
              {confirmingSignOut ? (
                <Reveal distance={6}>
                  <Button variant="ghost" onPress={() => setConfirmingSignOut(false)}>
                    <Button.Label>Stay signed in</Button.Label>
                  </Button>
                </Reveal>
              ) : null}
            </>
          ) : (
            <Button onPress={() => router.push('/vendor/sign-in')}>
              <Button.Label>Sign in as a vendor</Button.Label>
            </Button>
          )}
        </Card.Footer>
      </Card>

      {account ? (
        <Surface variant="secondary" className="flex-row">
          {[
            { label: 'Routes created', value: myRoutes.length },
            { label: 'Registrations', value: myRegistrations.length },
            { label: 'Journeys', value: myJourneys.length },
          ].map((stat, index) => (
            <View key={stat.label} className="flex-1 flex-row">
              {index > 0 ? <Separator orientation="vertical" className="mr-3" /> : null}
              <View className="flex-1 gap-0.5">
                <Typography type="h5">{stat.value}</Typography>
                <Typography type="body-xs" color="muted">
                  {stat.label}
                </Typography>
              </View>
            </View>
          ))}
        </Surface>
      ) : null}

      <View className="gap-2">
        <SectionHeader title="About this app" icon={Info} />
        <Typography type="body-sm" color="muted">
          Local vans, wagons and shuttles run fixed routes every day, but almost none of them exist
          online. Vendors publish the routes they already drive; passengers nearby can finally
          search them.
        </Typography>
        <Typography type="body-sm" weight="semibold" className="text-accent">
          The transport isn&apos;t missing. The data is.
        </Typography>
      </View>

      <View className="gap-2">
        <SectionHeader title="Demo data" icon={Database} />
        <Typography type="body-sm" color="muted">
          Routes, vendors and journeys are stored on this device. Resetting restores the seeded
          Islamabad routes and clears anything you published.
        </Typography>
        <Button
          variant={confirmingReset ? 'danger' : 'danger-soft'}
          onPress={() => {
            if (!confirmingReset) {
              tapFeedback('warning');
              setConfirmingReset(true);
              return;
            }
            resetDemoData();
            setConfirmingReset(false);
            tapFeedback('success');
          }}
        >
          <RotateCcw color={ICON_COLORS.danger} size={16} />
          <Button.Label>
            {confirmingReset ? 'Yes, reset everything' : 'Reset demo data'}
          </Button.Label>
        </Button>
        {confirmingReset ? (
          <Reveal distance={6}>
            <Button variant="ghost" onPress={() => setConfirmingReset(false)}>
              <Button.Label>Keep my data</Button.Label>
            </Button>
          </Reveal>
        ) : null}
      </View>
    </ScrollView>
  );
}
