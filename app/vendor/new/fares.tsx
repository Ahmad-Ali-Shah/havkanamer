import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { Button, Surface, Typography } from 'heroui-native';

import { FareSlabEditor } from '@/components/FareSlabEditor';
import { formatDistance, formatDuration, pathLengthKm } from '@/lib/geo';
import { exitFlowTo } from '@/lib/navigation';
import { tapFeedback } from '@/lib/haptics';
import { categoryLabel } from '@/lib/types';
import { useRouteDraftStore } from '@/lib/routeDraft';
import { useSessionStore, useTransportStore } from '@/lib/store';
import type { FareSlab } from '@/lib/types';

export default function FaresScreen() {
  const draft = useRouteDraftStore();
  const resetDraft = useRouteDraftStore((state) => state.reset);
  const account = useSessionStore((state) => state.account);
  const createRoute = useTransportStore((state) => state.createRoute);
  const addRegistration = useTransportStore((state) => state.addRegistration);
  const joinedRoute = useTransportStore((state) =>
    state.routes.find((route) => route.id === draft.routeId),
  );

  const [slabs, setSlabs] = useState<FareSlab[]>(draft.fareSlabs);

  const faresValid = slabs.length > 0 && slabs.every((slab) => slab.fare > 0);
  const canPublish = faresValid && account !== null;

  const handlePublish = () => {
    if (!account || !faresValid) return;

    let routeId = draft.routeId;
    if (draft.mode === 'create') {
      const created = createRoute({
        name: draft.name,
        category: draft.category,
        start: { name: draft.startName, coordinate: draft.path[0] },
        end: { name: draft.endName, coordinate: draft.path[draft.path.length - 1] },
        path: draft.path,
        directionType: draft.directionType,
        stopType: draft.stopType,
        stops: draft.stops,
        estimatedDurationMinutes: draft.estimatedDurationMinutes,
        createdByAccountId: account.id,
      });
      routeId = created.id;
    }

    if (!routeId) return;

    addRegistration({
      accountId: account.id,
      routeId,
      vendorName: draft.vendorName,
      contact: draft.contact,
      vehicleRegistration: draft.vehicleRegistration,
      vehicleDetails: draft.vehicleDetails,
      estimatedDurationMinutes: draft.estimatedDurationMinutes,
      stopType: joinedRoute ? joinedRoute.stopType : draft.stopType,
      fareSlabs: slabs,
    });

    resetDraft();
    tapFeedback('success');
    // `/vendor` is a tab route, so it is not an entry in this stack. dismissTo
    // has no target to match and does nothing; popping then replacing works.
    exitFlowTo('/vendor');
  };

  const summaryName = joinedRoute ? joinedRoute.name : draft.name;
  const summaryLine = joinedRoute
    ? `${categoryLabel(joinedRoute.category)} · ${formatDistance(pathLengthKm(joinedRoute.path))}`
    : `${categoryLabel(draft.category)} · ${formatDistance(pathLengthKm(draft.path))} · ${draft.stops.length} stops`;

  return (
    <KeyboardAvoidingView
      className="bg-background flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="gap-5 p-4 pb-6" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Typography type="body-xs" color="muted">
            {draft.mode === 'join' ? 'Step 2 of 2' : 'Step 4 of 4'}
          </Typography>
          <Typography type="h5">Fares by distance</Typography>
          <Typography type="body-sm" color="muted">
            Passengers see the band that matches their trip, so short hops and long rides both look
            right.
          </Typography>
        </View>

        <FareSlabEditor initialSlabs={draft.fareSlabs} onChange={setSlabs} />

        <Surface variant="secondary" className="gap-1.5">
          <Typography type="body-xs" weight="semibold" color="muted">
            Publishing
          </Typography>
          <Typography type="body" weight="semibold">
            {summaryName}
          </Typography>
          <Typography type="body-xs" color="muted">
            {summaryLine}
          </Typography>
          <Typography type="body-xs" color="muted">
            {draft.vehicleRegistration}
            {draft.vehicleDetails ? ` · ${draft.vehicleDetails}` : ''} ·{' '}
            {formatDuration(draft.estimatedDurationMinutes)}
          </Typography>
        </Surface>

        {!faresValid ? (
          <Typography type="body-xs" className="text-danger">
            Every band needs a fare above zero.
          </Typography>
        ) : null}

        <Button isDisabled={!canPublish} onPress={handlePublish}>
          <Button.Label>
            {draft.mode === 'join' ? 'Add my vehicle to this route' : 'Publish route'}
          </Button.Label>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
