import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import type { LatLng } from '@/components/MapView.types';
import { ISLAMABAD_CENTER } from '@/lib/mapTheme';

export type LocationStatus = 'loading' | 'granted' | 'denied' | 'unavailable';

interface CurrentLocation {
  status: LocationStatus;
  /** The passenger's position, or null until permission is granted. */
  coordinate: LatLng | null;
  /** Always usable for framing the map, even before permission is granted. */
  mapCenter: LatLng;
  request: () => Promise<void>;
}

/**
 * Current device position with an explicit permission state, so screens can
 * show the "location not granted" case rather than silently guessing.
 */
export function useCurrentLocation(): CurrentLocation {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [coordinate, setCoordinate] = useState<LatLng | null>(null);

  const load = useCallback(async (askAgain: boolean) => {
    setStatus('loading');
    try {
      const permission = askAgain
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      if (!permission.granted) {
        if (!askAgain && permission.canAskAgain) {
          const asked = await Location.requestForegroundPermissionsAsync();
          if (!asked.granted) {
            setStatus('denied');
            return;
          }
        } else {
          setStatus('denied');
          return;
        }
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('granted');
    } catch {
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const request = useCallback(async () => {
    await load(true);
  }, [load]);

  return {
    status,
    coordinate,
    mapCenter: coordinate ?? ISLAMABAD_CENTER,
    request,
  };
}
