import type { LatLng, MapRegion } from '@/components/MapView.types';
import type { FareSlab } from '@/lib/types';

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a path in kilometres. */
export function pathLengthKm(path: LatLng[]) {
  let total = 0;
  for (let index = 1; index < path.length; index += 1) {
    total += distanceKm(path[index - 1], path[index]);
  }
  return total;
}

interface NearestPoint {
  coordinate: LatLng;
  distanceKm: number;
  /** Distance travelled along the path to reach that point. */
  alongKm: number;
}

/**
 * Closest point on a path to `target`, using a local equirectangular
 * projection per segment. Accurate enough at city scale.
 */
export function nearestPointOnPath(path: LatLng[], target: LatLng): NearestPoint {
  if (path.length === 0) {
    return { coordinate: target, distanceKm: 0, alongKm: 0 };
  }
  if (path.length === 1) {
    return { coordinate: path[0], distanceKm: distanceKm(path[0], target), alongKm: 0 };
  }

  let best: NearestPoint = {
    coordinate: path[0],
    distanceKm: distanceKm(path[0], target),
    alongKm: 0,
  };
  let travelled = 0;

  for (let index = 1; index < path.length; index += 1) {
    const from = path[index - 1];
    const to = path[index];
    const segmentKm = distanceKm(from, to);

    const scale = Math.cos(toRadians(from.latitude));
    const ax = from.longitude * scale;
    const ay = from.latitude;
    const bx = to.longitude * scale;
    const by = to.latitude;
    const px = target.longitude * scale;
    const py = target.latitude;

    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t =
      lengthSquared === 0
        ? 0
        : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));

    const candidate: LatLng = {
      latitude: ay + t * dy,
      longitude: (ax + t * dx) / scale,
    };
    const candidateDistance = distanceKm(candidate, target);

    if (candidateDistance < best.distanceKm) {
      best = {
        coordinate: candidate,
        distanceKm: candidateDistance,
        alongKm: travelled + segmentKm * t,
      };
    }

    travelled += segmentKm;
  }

  return best;
}

/** A map region that comfortably contains every coordinate given. */
export function regionForCoordinates(coordinates: LatLng[], paddingFactor = 1.45): MapRegion {
  if (coordinates.length === 0) {
    return { latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.14, longitudeDelta: 0.14 };
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLon = coordinates[0].longitude;
  let maxLon = coordinates[0].longitude;

  for (const point of coordinates) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLon = Math.min(minLon, point.longitude);
    maxLon = Math.max(maxLon, point.longitude);
  }

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(0.012, (maxLat - minLat) * paddingFactor),
    longitudeDelta: Math.max(0.012, (maxLon - minLon) * paddingFactor),
  };
}

/** Region that roughly frames a radius in kilometres around a point. */
export function regionForRadius(center: LatLng, radiusKm: number): MapRegion {
  const latitudeDelta = (radiusKm / 111) * 2.6;
  const longitudeDelta = latitudeDelta / Math.max(0.2, Math.cos(toRadians(center.latitude)));
  return { ...center, latitudeDelta, longitudeDelta };
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function formatFare(amount: number) {
  return `Rs ${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatSlabRange(slab: FareSlab) {
  if (slab.toKm === null) return `${slab.fromKm} km and beyond`;
  return `${slab.fromKm}–${slab.toKm} km`;
}

export function sortedSlabs(slabs: FareSlab[]) {
  return [...slabs].sort((a, b) => a.fromKm - b.fromKm);
}

/** Lowest fare a vendor charges, used for "fare from" labels. */
export function startingFare(slabs: FareSlab[]) {
  if (slabs.length === 0) return null;
  return Math.min(...slabs.map((slab) => slab.fare));
}

/** The slab a given trip distance falls into. */
export function slabForDistance(slabs: FareSlab[], km: number) {
  const ordered = sortedSlabs(slabs);
  const match = ordered.find(
    (slab) => km >= slab.fromKm && (slab.toKm === null || km <= slab.toKm),
  );
  return match ?? ordered.at(-1) ?? null;
}

export function formatClockTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function minutesSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}
