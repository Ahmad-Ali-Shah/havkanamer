import AsyncStorage from '@react-native-async-storage/async-storage';
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
