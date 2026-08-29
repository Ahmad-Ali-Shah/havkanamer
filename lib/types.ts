import type { LatLng } from '@/components/MapView.types';

export type RouteCategory =
  | 'wagon'
  | 'van'
  | 'coaster'
  | 'rickshaw'
  | 'shuttle'
  | 'university'
  | 'other';

export type DirectionType = 'one-way' | 'two-way';

export type StopType = 'fixed' | 'flexible';

/** `forward` runs start -> end, `reverse` runs end -> start. */
export type RouteDirection = 'forward' | 'reverse';

export interface NamedPlace {
  name: string;
  coordinate: LatLng;
}

export interface RouteStop {
  id: string;
  name: string;
  coordinate: LatLng;
}

/** Vendor-entered estimated fare band. `toKm` of null means "and beyond". */
export interface FareSlab {
  id: string;
  fromKm: number;
  toKm: number | null;
  fare: number;
}

/** The shared transport path. Many vendors may operate on one route. */
export interface TransportRoute {
  id: string;
  name: string;
  category: RouteCategory;
  start: NamedPlace;
  end: NamedPlace;
  path: LatLng[];
  directionType: DirectionType;
  stopType: StopType;
  stops: RouteStop[];
  estimatedDurationMinutes: number;
  createdAt: string;
  createdByAccountId: string | null;
}

/** A vendor's own operator/vehicle data attached to a shared route. */
export interface VendorRegistration {
  id: string;
  accountId: string;
  routeId: string;
  vendorName: string;
  contact: string;
  vehicleRegistration: string;
  vehicleDetails: string;
  estimatedDurationMinutes: number;
  stopType: StopType;
  fareSlabs: FareSlab[];
  createdAt: string;
}

/** An explicit operating session. A registration is only "active" while one runs. */
export interface Journey {
  id: string;
  registrationId: string;
  routeId: string;
  direction: RouteDirection;
  startedAt: string;
  endedAt: string | null;
}

export interface Account {
  id: string;
  name: string;
  phone: string;
}

const CATEGORY_LABELS: Record<RouteCategory, string> = {
  wagon: 'Wagon',
  van: 'Van',
  coaster: 'Coaster',
  rickshaw: 'Rickshaw route',
  shuttle: 'Shuttle',
  university: 'University transport',
  other: 'Other local transport',
};

/** Selection order for pickers and filters, derived from the single label map. */
const CATEGORY_ORDER: RouteCategory[] = [
  'wagon',
  'van',
  'coaster',
  'rickshaw',
  'shuttle',
  'university',
  'other',
];

export const ROUTE_CATEGORIES: { value: RouteCategory; label: string }[] = CATEGORY_ORDER.map(
  (value) => ({ value, label: CATEGORY_LABELS[value] }),
);

export function categoryLabel(category: RouteCategory) {
  return CATEGORY_LABELS[category];
}

export function directionLabel(route: TransportRoute, direction: RouteDirection) {
  return direction === 'forward'
    ? `${route.start.name} → ${route.end.name}`
    : `${route.end.name} → ${route.start.name}`;
}

export function directionOrigin(route: TransportRoute, direction: RouteDirection) {
  return direction === 'forward' ? route.start : route.end;
}

export function directionDestination(route: TransportRoute, direction: RouteDirection) {
  return direction === 'forward' ? route.end : route.start;
}

/**
 * Reverses a list without relying on Array.prototype.toReversed or .reverse(),
 * neither of which is safe across every React Native / Hermes runtime.
 */
function reversed<T>(items: readonly T[]): T[] {
  const output: T[] = [];
  for (let index = items.length - 1; index >= 0; index -= 1) {
    output.push(items[index]);
  }
  return output;
}

/** Coordinates ordered for the chosen direction of travel. */
export function directionPath(route: TransportRoute, direction: RouteDirection): LatLng[] {
  return direction === 'forward' ? route.path : reversed(route.path);
}

export function directionStops(route: TransportRoute, direction: RouteDirection): RouteStop[] {
  return direction === 'forward' ? route.stops : reversed(route.stops);
}
