import { Database, Info, RotateCcw, UserRound } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Separator, Surface, Typography, useThemeColor } from 'heroui-native';

import { SectionHeader } from '@/components/SectionHeader';
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
        <Card.Footer className="p-0 pt-4">
          {account ? (
            <Button variant="tertiary" onPress={signOut}>
              <Button.Label>Sign out</Button.Label>
            </Button>
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
        <Button variant="danger-soft" onPress={resetDemoData}>
          <RotateCcw color={ICON_COLORS.danger} size={16} />
          <Button.Label>Reset demo data</Button.Label>
        </Button>
      </View>
    </ScrollView>
  );
}
