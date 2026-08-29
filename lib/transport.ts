import { nearestPointOnPath, pathLengthKm, startingFare } from '@/lib/geo';
import type { LatLng } from '@/components/MapView.types';
import type { Journey, RouteDirection, TransportRoute, VendorRegistration } from '@/lib/types';

export interface RouteVendor {
  registration: VendorRegistration;
  /** Non-null while the vendor is running a journey. */
  activeJourney: Journey | null;
}

export function activeJourneys(journeys: Journey[]) {
  return journeys.filter((journey) => journey.endedAt === null);
}

export function findActiveJourneyForRegistration(journeys: Journey[], registrationId: string) {
  return (
    journeys.find(
      (journey) => journey.registrationId === registrationId && journey.endedAt === null,
    ) ?? null
  );
}

/**
 * Vendors registered on a route, with their live journey state. When a
 * direction is given, a vendor only counts as active if their current journey
 * runs in that direction.
 */
export function vendorsForRoute(
  registrations: VendorRegistration[],
  journeys: Journey[],
  routeId: string,
  direction?: RouteDirection,
): RouteVendor[] {
  return registrations
    .filter((registration) => registration.routeId === routeId)
    .map((registration) => {
      const journey = findActiveJourneyForRegistration(journeys, registration.id);
      const matchesDirection = !direction || journey?.direction === direction;
      return {
        registration,
        activeJourney: journey && matchesDirection ? journey : null,
      };
    })
    .sort((a, b) => {
      if (a.activeJourney && !b.activeJourney) return -1;
      if (!a.activeJourney && b.activeJourney) return 1;
      return a.registration.vendorName.localeCompare(b.registration.vendorName);
    });
}

export function countActiveVendors(
  registrations: VendorRegistration[],
  journeys: Journey[],
  routeId: string,
  direction?: RouteDirection,
) {
  return vendorsForRoute(registrations, journeys, routeId, direction).filter(
    (vendor) => vendor.activeJourney !== null,
  ).length;
}

export function registrationsForAccount(registrations: VendorRegistration[], accountId: string) {
  return registrations.filter((registration) => registration.accountId === accountId);
}

export interface NearbyRoute {
  route: TransportRoute;
  /** Walking distance from the passenger to the closest part of the route. */
  accessDistanceKm: number;
  accessPoint: LatLng;
  /** Nearest named stop, when the route uses fixed stops. */
  nearestStopName: string | null;
  routeLengthKm: number;
  activeVendorCount: number;
  registeredVendorCount: number;
  fareFrom: number | null;
}

export function describeRoute(
  route: TransportRoute,
  registrations: VendorRegistration[],
  journeys: Journey[],
  origin: LatLng | null,
): NearbyRoute {
  const nearest = origin
    ? nearestPointOnPath(route.path, origin)
    : { coordinate: route.path[0], distanceKm: 0, alongKm: 0 };

  const routeRegistrations = registrations.filter(
    (registration) => registration.routeId === route.id,
  );

  const fares = routeRegistrations
    .map((registration) => startingFare(registration.fareSlabs))
    .filter((fare): fare is number => fare !== null);

  let nearestStopName: string | null = null;
  if (route.stops.length > 0 && origin) {
    let best = Number.POSITIVE_INFINITY;
    for (const stop of route.stops) {
      const stopDistance = nearestPointOnPath([stop.coordinate], origin).distanceKm;
      if (stopDistance < best) {
        best = stopDistance;
        nearestStopName = stop.name;
      }
    }
  }

  return {
    route,
    accessDistanceKm: nearest.distanceKm,
    accessPoint: nearest.coordinate,
    nearestStopName,
    routeLengthKm: pathLengthKm(route.path),
    activeVendorCount: countActiveVendors(registrations, journeys, route.id),
    registeredVendorCount: routeRegistrations.length,
    fareFrom: fares.length > 0 ? Math.min(...fares) : null,
  };
}

/** Free-text match over route name, endpoints and stop names. */
export function matchesQuery(route: TransportRoute, query: string) {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return true;

  const haystack = [
    route.name,
    route.start.name,
    route.end.name,
    ...route.stops.map((stop) => stop.name),
  ]
    .join(' ')
    .toLowerCase();

  return needle.split(/\s+/).every((token) => haystack.includes(token));
}
