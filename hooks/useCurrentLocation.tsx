import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

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
 * Position lookups can hang indefinitely — most visibly in an embedded web
 * preview, where the geolocation prompt may never be answered. Without a
 * deadline the status stays 'loading' forever, so the screen keeps a spinner up
 * and never renders the "location is off" recovery card or its buttons.
 */
const LOCATION_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | 'timeout'> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve('timeout'), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}

const LocationContext = createContext<CurrentLocation | null>(null);

/**
 * Holds device position once for the whole app.
 *
 * Previously each screen ran its own copy of this hook, which meant a fresh
 * permission prompt per screen and Explore/Routes/route-detail each holding a
 * slightly different coordinate, so the same route showed different distances.
 */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('loading');
  const [coordinate, setCoordinate] = useState<LatLng | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async (askAgain: boolean) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus('loading');

    try {
      const permission = askAgain
        ? await Location.requestForegroundPermissionsAsync()
        : await Location.getForegroundPermissionsAsync();

      let granted = permission.granted;

      if (!granted && !askAgain && permission.canAskAgain) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.granted;
      }

      if (!granted) {
        setStatus('denied');
        return;
      }

      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATION_TIMEOUT_MS,
      );

      if (position === 'timeout') {
        setStatus('unavailable');
        return;
      }

      setCoordinate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setStatus('granted');
    } catch {
      setStatus('unavailable');
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const request = useCallback(async () => {
    await load(true);
  }, [load]);

  const value = useMemo<CurrentLocation>(
    () => ({
      status,
      coordinate,
      mapCenter: coordinate ?? ISLAMABAD_CENTER,
      request,
    }),
    [status, coordinate, request],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/**
 * Current device position with an explicit permission state, so screens can
 * show the "location not granted" case rather than silently guessing.
 */
export function useCurrentLocation(): CurrentLocation {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useCurrentLocation must be used inside a LocationProvider');
  }
  return context;
}
