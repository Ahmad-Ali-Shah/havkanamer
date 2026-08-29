import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Description, Input, Label, Surface, TextField, Typography } from 'heroui-native';

import { useRouteDraftStore } from '@/lib/routeDraft';
import { useTransportStore } from '@/lib/store';
import { CONTENT_COLUMN, cn } from '@/lib/utils';

export default function VehicleDetailsScreen() {
  const draft = useRouteDraftStore();
  const patch = useRouteDraftStore((state) => state.patch);
  const joinedRoute = useTransportStore((state) =>
    state.routes.find((route) => route.id === draft.routeId),
  );

  const [vendorName, setVendorName] = useState(draft.vendorName);
  const [contact, setContact] = useState(draft.contact);
  const [vehicleRegistration, setVehicleRegistration] = useState(draft.vehicleRegistration);
  const [vehicleDetails, setVehicleDetails] = useState(draft.vehicleDetails);
  const [duration, setDuration] = useState(String(draft.estimatedDurationMinutes));

  const parsedDuration = Number(duration);
  const canContinue =
    vendorName.trim().length > 1 &&
    contact.replace(/\D/g, '').length >= 10 &&
    vehicleRegistration.trim().length > 2 &&
    Number.isFinite(parsedDuration) &&
    parsedDuration > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    patch({
      vendorName: vendorName.trim(),
      contact: contact.trim(),
      vehicleRegistration: vehicleRegistration.trim().toUpperCase(),
      vehicleDetails: vehicleDetails.trim(),
      estimatedDurationMinutes: parsedDuration,
    });
    router.push('/vendor/new/fares');
  };

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerClassName={cn('gap-5 p-4 pb-6', CONTENT_COLUMN)}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-1">
          <Typography type="body-xs" color="muted">
            {draft.mode === 'join' ? 'Step 1 of 2' : 'Step 3 of 4'}
          </Typography>
          <Typography type="h5">Your vehicle</Typography>
        </View>

        {joinedRoute ? (
          <Surface variant="secondary" className="gap-1">
            <Typography type="body-xs" color="muted">
              Joining route
            </Typography>
            <Typography type="body-sm" weight="semibold">
              {joinedRoute.name}
            </Typography>
          </Surface>
        ) : null}

        <TextField>
          <Label>Vendor name</Label>
          <Input
            value={vendorName}
            onChangeText={setVendorName}
            placeholder="e.g. Faizabad Wagon Service"
            autoCapitalize="words"
          />
        </TextField>

        <TextField>
          <Label>Contact number</Label>
          <Input
            value={contact}
            onChangeText={setContact}
            placeholder="03xx xxxxxxx"
            keyboardType="phone-pad"
          />
          <Description>Passengers may call to check if you are running.</Description>
        </TextField>

        <TextField>
          <Label>Vehicle registration</Label>
          <Input
            value={vehicleRegistration}
            onChangeText={setVehicleRegistration}
            placeholder="e.g. ICT-1234"
            autoCapitalize="characters"
          />
        </TextField>

        <TextField>
          <Label>Vehicle description</Label>
          <Input
            value={vehicleDetails}
            onChangeText={setVehicleDetails}
            placeholder="e.g. White Hiace, 14 seats"
          />
          <Description>Optional, but it helps passengers recognise you.</Description>
        </TextField>

        <TextField>
          <Label>Your trip time (minutes)</Label>
          <Input
            value={duration}
            onChangeText={(text) => setDuration(text.replace(/[^\d]/g, ''))}
            placeholder="25"
            keyboardType="number-pad"
          />
        </TextField>

        <Button isDisabled={!canContinue} onPress={handleContinue}>
          <Button.Label>Continue to fares</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
