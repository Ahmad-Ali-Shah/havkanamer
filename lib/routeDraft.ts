import { create } from 'zustand';

import type { LatLng } from '@/components/MapView.types';
import type { DirectionType, FareSlab, RouteCategory, RouteStop, StopType } from '@/lib/types';

/**
 * In-memory draft for the vendor wizard. Not persisted: an abandoned
 * half-drawn route should not reappear on next launch.
 */
export type VendorFlowMode = 'create' | 'join';

interface RouteDraftState {
  mode: VendorFlowMode;
  /** Set when joining an existing route. */
  routeId: string | null;

  name: string;
  category: RouteCategory;
  directionType: DirectionType;
  path: LatLng[];
  startName: string;
  endName: string;
  stopType: StopType;
  stops: RouteStop[];

  vendorName: string;
  contact: string;
  vehicleRegistration: string;
  vehicleDetails: string;
  estimatedDurationMinutes: number;
  fareSlabs: FareSlab[];

  patch: (
    values: Partial<Omit<RouteDraftState, 'patch' | 'startCreate' | 'startJoin' | 'reset'>>,
  ) => void;
  startCreate: (defaults: { vendorName: string; contact: string }) => void;
  startJoin: (routeId: string, defaults: { vendorName: string; contact: string }) => void;
  reset: () => void;
}

const DEFAULT_SLABS: FareSlab[] = [
  { id: 'draft_slab_1', fromKm: 0, toKm: 3, fare: 50 },
  { id: 'draft_slab_2', fromKm: 3, toKm: 6, fare: 80 },
  { id: 'draft_slab_3', fromKm: 6, toKm: null, fare: 120 },
];

const EMPTY = {
  mode: 'create' as VendorFlowMode,
  routeId: null,
  name: '',
  category: 'wagon' as RouteCategory,
  directionType: 'two-way' as DirectionType,
  path: [] as LatLng[],
  startName: '',
  endName: '',
  stopType: 'fixed' as StopType,
  stops: [] as RouteStop[],
  vendorName: '',
  contact: '',
  vehicleRegistration: '',
  vehicleDetails: '',
  estimatedDurationMinutes: 25,
  fareSlabs: DEFAULT_SLABS,
};

export const useRouteDraftStore = create<RouteDraftState>()((set) => ({
  ...EMPTY,
  patch: (values) => set(values),
  startCreate: (defaults) =>
    set({ ...EMPTY, mode: 'create', vendorName: defaults.vendorName, contact: defaults.contact }),
  startJoin: (routeId, defaults) =>
    set({
      ...EMPTY,
      mode: 'join',
      routeId,
      vendorName: defaults.vendorName,
      contact: defaults.contact,
    }),
  reset: () => set(EMPTY),
}));
