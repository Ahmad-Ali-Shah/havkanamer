import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { CircleOff } from 'lucide-react-native';
import {
  Button,
  Description,
  Input,
  Label,
  Separator,
  Surface,
  TextField,
  Typography,
} from 'heroui-native';

import { EmptyState } from '@/components/EmptyState';
import { FareSlabEditor } from '@/components/FareSlabEditor';
import { StatusBadge } from '@/components/StatusBadge';
import { Reveal } from '@/components/ui/Reveal';
import { formatDistance, formatDuration, pathLengthKm } from '@/lib/geo';
import { exitFlowTo } from '@/lib/navigation';
import { tapFeedback } from '@/lib/haptics';
import { categoryLabel, directionLabel } from '@/lib/types';
import { findActiveJourneyForRegistration } from '@/lib/transport';
import { useTransportStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';
import type { FareSlab } from '@/lib/types';

export default function ManageRegistrationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const registration = useTransportStore((state) =>
    state.registrations.find((candidate) => candidate.id === id),
  );
  const route = useTransportStore((state) =>
    state.routes.find((candidate) => candidate.id === registration?.routeId),
  );
  const journeys = useTransportStore((state) => state.journeys);
  const updateRegistration = useTransportStore((state) => state.updateRegistration);
  const removeRegistration = useTransportStore((state) => state.removeRegistration);

  const [vehicleDetails, setVehicleDetails] = useState(registration?.vehicleDetails ?? '');
  const [contact, setContact] = useState(registration?.contact ?? '');
  const [duration, setDuration] = useState(String(registration?.estimatedDurationMinutes ?? ''));
  const [slabs, setSlabs] = useState<FareSlab[]>(registration?.fareSlabs ?? []);
  const [saved, setSaved] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  if (!registration || !route) {
    return (
      <View className="bg-background flex-1 justify-center">
        <Stack.Screen options={{ title: 'My route' }} />
        <EmptyState
          icon={CircleOff}
          title="Registration not found"
          description="This registration is no longer on your account."
          actionLabel="Back to my routes"
          onAction={() => exitFlowTo('/vendor')}
        />
      </View>
    );
  }

  const activeJourney = findActiveJourneyForRegistration(journeys, registration.id);
  const parsedDuration = Number(duration);
  const canSave =
    contact.replace(/\D/g, '').length >= 10 &&
    Number.isFinite(parsedDuration) &&
    parsedDuration > 0 &&
    slabs.length > 0 &&
    slabs.every((slab) => slab.fare > 0);

  const handleSave = () => {
    if (!canSave) return;
    updateRegistration(registration.id, {
      contact: contact.trim(),
      vehicleDetails: vehicleDetails.trim(),
      estimatedDurationMinutes: parsedDuration,
      fareSlabs: slabs,
    });
    tapFeedback('success');
    setSaved(true);
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName={cn('gap-5 p-4 pb-10', CONTENT_COLUMN)}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen options={{ title: registration.vehicleRegistration }} />

        <View className="gap-2">
          <StatusBadge isLive={activeJourney !== null} />
          <Typography type="h5">{route.name}</Typography>
          <Typography type="body-sm" color="muted">
            {categoryLabel(route.category)} · {formatDistance(pathLengthKm(route.path))} ·{' '}
            {formatDuration(registration.estimatedDurationMinutes)}
          </Typography>
        </View>

        {activeJourney ? (
          <Surface variant="secondary" className="gap-1">
            <Typography type="body-sm" weight="semibold" className="text-live">
              {directionLabel(route, activeJourney.direction)}
            </Typography>
            <Typography type="body-xs" color="muted">
              Passengers can see this vehicle in live results right now.
            </Typography>
          </Surface>
        ) : null}

        <View className="flex-row gap-2">
          <Button
            className="flex-1"
            variant={activeJourney ? 'danger-soft' : 'primary'}
            onPress={() =>
              router.push({
                pathname: '/journey/[registrationId]',
                params: { registrationId: registration.id },
              })
            }
          >
            <Button.Label>{activeJourney ? 'End journey' : 'Start journey'}</Button.Label>
          </Button>
          <Button
            className="flex-1"
            variant="tertiary"
            onPress={() => router.push({ pathname: '/route/[id]', params: { id: route.id } })}
          >
            <Button.Label>View as passenger</Button.Label>
          </Button>
        </View>

        <Separator />

        <TextField>
          <Label>Contact number</Label>
          <Input
            value={contact}
            onChangeText={(text) => {
              setContact(text);
              setSaved(false);
            }}
            keyboardType="phone-pad"
          />
        </TextField>

        <TextField>
          <Label>Vehicle description</Label>
          <Input
            value={vehicleDetails}
            onChangeText={(text) => {
              setVehicleDetails(text);
              setSaved(false);
            }}
            placeholder="e.g. White Hiace, 14 seats"
          />
        </TextField>

        <TextField>
          <Label>Trip time (minutes)</Label>
          <Input
            value={duration}
            onChangeText={(text) => {
              setDuration(text.replace(/[^\d]/g, ''));
              setSaved(false);
            }}
            keyboardType="number-pad"
          />
          <Description>Shown to passengers as your typical end-to-end time.</Description>
        </TextField>

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            Fares
          </Typography>
          <FareSlabEditor
            initialSlabs={registration.fareSlabs}
            onChange={(next) => {
              setSlabs(next);
              setSaved(false);
            }}
          />
        </View>

        <Button isDisabled={!canSave || saved} onPress={handleSave}>
          <Button.Label>{saved ? 'Saved' : 'Save changes'}</Button.Label>
        </Button>

        <Separator />

        <View className="gap-2">
          <Typography type="body-sm" weight="semibold">
            Remove from this route
          </Typography>
          <Typography type="body-xs" color="muted">
            Your vehicle and fares are deleted. The route itself stays published for other vendors.
          </Typography>
          <Button
            variant={confirmingRemove ? 'danger' : 'danger-soft'}
            onPress={() => {
              if (!confirmingRemove) {
                tapFeedback('warning');
                setConfirmingRemove(true);
                return;
              }
              removeRegistration(registration.id);
              tapFeedback('success');
              exitFlowTo('/vendor');
            }}
          >
            <Button.Label>
              {confirmingRemove ? 'Yes, remove my vehicle' : 'Remove my vehicle'}
            </Button.Label>
          </Button>
          {confirmingRemove ? (
            <Reveal distance={6}>
              <Button variant="ghost" onPress={() => setConfirmingRemove(false)}>
                <Button.Label>Cancel</Button.Label>
              </Button>
            </Reveal>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
