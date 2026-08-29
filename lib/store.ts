import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/utils';
import { createSeedJourneys, SEED_REGISTRATIONS, SEED_ROUTES } from '@/lib/seed';
import type {
  Account,
  Journey,
  RouteDirection,
  TransportRoute,
  VendorRegistration,
} from '@/lib/types';

export type NewRouteInput = Omit<TransportRoute, 'id' | 'createdAt'>;
export type NewRegistrationInput = Omit<VendorRegistration, 'id' | 'createdAt'>;

interface TransportState {
  routes: TransportRoute[];
  registrations: VendorRegistration[];
  journeys: Journey[];
  createRoute: (input: NewRouteInput) => TransportRoute;
  addRegistration: (input: NewRegistrationInput) => VendorRegistration;
  updateRegistration: (id: string, patch: Partial<NewRegistrationInput>) => void;
  removeRegistration: (id: string) => void;
  startJourney: (registrationId: string, routeId: string, direction: RouteDirection) => Journey;
  endJourney: (journeyId: string) => void;
  resetDemoData: () => void;
}

export const useTransportStore = create<TransportState>()(
  persist(
    (set, get) => ({
      routes: SEED_ROUTES,
      registrations: SEED_REGISTRATIONS,
      journeys: createSeedJourneys(),

      createRoute: (input) => {
        const route: TransportRoute = {
          ...input,
          id: createId('route'),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ routes: [route, ...state.routes] }));
        return route;
      },

      addRegistration: (input) => {
        const registration: VendorRegistration = {
          ...input,
          id: createId('reg'),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ registrations: [registration, ...state.registrations] }));
        return registration;
      },

      updateRegistration: (id, patch) => {
        set((state) => ({
          registrations: state.registrations.map((registration) =>
            registration.id === id ? { ...registration, ...patch } : registration,
          ),
        }));
      },

      removeRegistration: (id) => {
        set((state) => ({
          registrations: state.registrations.filter((registration) => registration.id !== id),
          journeys: state.journeys.filter((journey) => journey.registrationId !== id),
        }));
      },

      startJourney: (registrationId, routeId, direction) => {
        const now = new Date().toISOString();
        // A registration can only run one journey at a time.
        const existing = get().journeys.find(
          (journey) => journey.registrationId === registrationId && journey.endedAt === null,
        );
        if (existing) {
          set((state) => ({
            journeys: state.journeys.map((journey) =>
              journey.id === existing.id ? { ...journey, endedAt: now } : journey,
            ),
          }));
        }

        const journey: Journey = {
          id: createId('journey'),
          registrationId,
          routeId,
          direction,
          startedAt: now,
          endedAt: null,
        };
        set((state) => ({ journeys: [journey, ...state.journeys] }));
        return journey;
      },

      endJourney: (journeyId) => {
        const now = new Date().toISOString();
        set((state) => ({
          journeys: state.journeys.map((journey) =>
            journey.id === journeyId ? { ...journey, endedAt: now } : journey,
          ),
        }));
      },

      resetDemoData: () => {
        set({
          routes: SEED_ROUTES,
          registrations: SEED_REGISTRATIONS,
          journeys: createSeedJourneys(),
        });
      },
    }),
    {
      name: 'transport-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

interface SessionState {
  account: Account | null;
  signIn: (name: string, phone: string) => Account;
  signOut: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      account: null,
      signIn: (name, phone) => {
        const account: Account = { id: createId('acc'), name, phone };
        set({ account });
        return account;
      },
      signOut: () => set({ account: null }),
    }),
    {
      name: 'session-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

/** How long to wait for persisted state before rendering without it. */
const HYDRATION_TIMEOUT_MS = 3000;

/**
 * Both stores persist to AsyncStorage, which reads asynchronously. Until those
 * reads land, `account` is null and `registrations` holds only the seed data —
 * so a signed-in vendor briefly sees the sign-in card, and pushing to a
 * registration detail screen renders "not found" before hydration catches up.
 *
 * Screens must therefore wait for this to be true before deciding that a record
 * is genuinely missing.
 */
export function useStoresHydrated() {
  const [hydrated, setHydrated] = useState(
    () => useTransportStore.persist.hasHydrated() && useSessionStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (hydrated) return undefined;

    const sync = () => {
      if (useTransportStore.persist.hasHydrated() && useSessionStore.persist.hasHydrated()) {
        setHydrated(true);
      }
    };

    const unsubscribeTransport = useTransportStore.persist.onFinishHydration(sync);
    const unsubscribeSession = useSessionStore.persist.onFinishHydration(sync);

    // Storage can be unreachable rather than slow — a sandboxed web preview may
    // block localStorage outright, in which case the read neither resolves nor
    // rejects and hydration never finishes. Waiting forever would leave a blank
    // screen with nothing to act on, so give up after a deadline and run on the
    // seed data instead of showing nothing at all.
    const deadline = setTimeout(() => setHydrated(true), HYDRATION_TIMEOUT_MS);

    // Covers the case where hydration finished between the initial state read
    // and these subscriptions being attached.
    sync();

    return () => {
      clearTimeout(deadline);
      unsubscribeTransport();
      unsubscribeSession();
    };
  }, [hydrated]);

  return hydrated;
}
