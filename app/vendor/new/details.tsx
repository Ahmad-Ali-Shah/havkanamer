import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Description, Input, Label, Surface, TextField, Typography } from 'heroui-native';

import { ChoiceRow } from '@/components/ChoiceRow';
import { formatDistance, pathLengthKm } from '@/lib/geo';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import { useRouteDraftStore } from '@/lib/routeDraft';
import { CONTENT_COLUMN, cn } from '@/lib/utils';
import type { DirectionType, RouteCategory, StopType } from '@/lib/types';

const DIRECTION_OPTIONS: { value: DirectionType; label: string }[] = [
  { value: 'two-way', label: 'Both directions' },
  { value: 'one-way', label: 'One direction only' },
];

const STOP_OPTIONS: { value: StopType; label: string }[] = [
  { value: 'fixed', label: 'Fixed stops' },
  { value: 'flexible', label: 'Stops anywhere' },
];

export default function RouteDetailsScreen() {
  const draft = useRouteDraftStore();
  const patch = useRouteDraftStore((state) => state.patch);

  const suggestedName =
    draft.startName && draft.endName ? `${draft.startName} → ${draft.endName}` : '';
  const [name, setName] = useState(draft.name || suggestedName);
  const [category, setCategory] = useState<RouteCategory>(draft.category);
  const [directionType, setDirectionType] = useState<DirectionType>(draft.directionType);
  const [stopType, setStopType] = useState<StopType>(draft.stopType);
  const [duration, setDuration] = useState(String(draft.estimatedDurationMinutes));

  const parsedDuration = Number(duration);
  const canContinue =
    name.trim().length > 2 && Number.isFinite(parsedDuration) && parsedDuration > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    patch({
      name: name.trim(),
      category,
      directionType,
      stopType,
      estimatedDurationMinutes: parsedDuration,
    });
    router.push('/vendor/new/vehicle');
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
            Step 2 of 4
          </Typography>
          <Typography type="h5">Describe the route</Typography>
        </View>

        <Surface variant="secondary" className="gap-1">
          <Typography type="body-sm" weight="semibold">
            {draft.startName} → {draft.endName}
          </Typography>
          <Typography type="body-xs" color="muted">
            {formatDistance(pathLengthKm(draft.path))} · {draft.path.length} points ·{' '}
            {draft.stops.length} named stops
          </Typography>
        </Surface>

        <TextField>
          <Label>Route name</Label>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="e.g. Faizabad → F-10"
            autoCapitalize="words"
          />
          <Description>How passengers will see this route in search results.</Description>
        </TextField>

        <ChoiceRow
          label="Vehicle type"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
        />

        <ChoiceRow
          label="Direction"
          hint="Two-way routes let passengers view the return trip too."
          options={DIRECTION_OPTIONS}
          value={directionType}
          onChange={setDirectionType}
        />

        <ChoiceRow
          label="Pick-up style"
          hint="Choose flexible if you stop wherever passengers wave you down."
          options={STOP_OPTIONS}
          value={stopType}
          onChange={setStopType}
        />

        <TextField>
          <Label>Typical trip time (minutes)</Label>
          <Input
            value={duration}
            onChangeText={(text) => setDuration(text.replace(/[^\d]/g, ''))}
            placeholder="25"
            keyboardType="number-pad"
          />
          <Description>End to end, in normal traffic.</Description>
        </TextField>

        <Button isDisabled={!canContinue} onPress={handleContinue}>
          <Button.Label>Continue</Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
