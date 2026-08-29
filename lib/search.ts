import { categoryLabel } from '@/lib/types';
import type { TransportRoute } from '@/lib/types';

export type SuggestionKind = 'stop' | 'sector' | 'route';

export interface Suggestion {
  key: string;
  kind: SuggestionKind;
  /** Primary line, with the typed text highlighted inside it. */
  label: string;
  detail: string;
  /** What the search field becomes once this is picked. */
  query: string;
  /** Set when the suggestion is one specific route, so it can be opened directly. */
  routeId: string | null;
  matchStart: number;
  matchLength: number;
}

/** Islamabad sector codes: F-10, G-11, I-8/3. */
const SECTOR_PATTERN = /\b[A-Z]-\d{1,2}(?:\/\d)?\b/g;

/** Below this a query matches almost everything and the list is noise. */
const MIN_QUERY_LENGTH = 2;
const MAX_SUGGESTIONS = 6;

function routeText(route: TransportRoute) {
  return [route.name, route.start.name, route.end.name, ...route.stops.map((stop) => stop.name)]
    .join(' ');
}

function routesMentioning(routes: TransportRoute[], token: string) {
  const needle = token.toLowerCase();
  return routes.filter((route) => routeText(route).toLowerCase().includes(needle));
}

function placeDetail(routes: TransportRoute[], name: string) {
  const matches = routesMentioning(routes, name);
  if (matches.length === 1) return `Stop on ${matches[0].name}`;
  return `Stop on ${matches.length} routes`;
}

function byMatchPosition(a: Suggestion, b: Suggestion) {
  if (a.matchStart !== b.matchStart) return a.matchStart - b.matchStart;
  return a.label.length - b.label.length;
}

/**
 * Search suggestions grouped by what the passenger is likely to mean.
 *
 * Named places come first because a passenger types where they are standing,
 * then the sector as a whole, then the routes whose name matches. Each hit
 * carries the position of the typed text so the row can highlight it rather
 * than leaving the reader to find the match themselves.
 */
export function buildSuggestions(routes: TransportRoute[], query: string): Suggestion[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return [];

  const seen = new Set<string>();
  const stops: Suggestion[] = [];
  const sectors: Suggestion[] = [];
  const routeHits: Suggestion[] = [];

  const add = (list: Suggestion[], suggestion: Suggestion) => {
    const dedupe = `${suggestion.kind}:${suggestion.label.toLowerCase()}`;
    if (seen.has(dedupe)) return;
    seen.add(dedupe);
    list.push(suggestion);
  };

  for (const route of routes) {
    for (const name of [route.start.name, route.end.name, ...route.stops.map((stop) => stop.name)]) {
      const at = name.toLowerCase().indexOf(needle);
      if (at === -1) continue;

      add(stops, {
        key: `stop:${name}`,
        kind: 'stop',
        label: name,
        detail: placeDetail(routes, name),
        query: name,
        routeId: null,
        matchStart: at,
        matchLength: needle.length,
      });
    }
  }

  const sectorCodes = new Set<string>();
  for (const route of routes) {
    for (const code of routeText(route).match(SECTOR_PATTERN) ?? []) {
      sectorCodes.add(code);
    }
  }

  const sectorPrefix = 'Sector ';
  for (const code of sectorCodes) {
    const at = code.toLowerCase().indexOf(needle);
    if (at === -1) continue;

    const count = routesMentioning(routes, code).length;
    add(sectors, {
      key: `sector:${code}`,
      kind: 'sector',
      label: `${sectorPrefix}${code}`,
      detail: `${count} ${count === 1 ? 'route' : 'routes'} through here`,
      query: code,
      routeId: null,
      matchStart: sectorPrefix.length + at,
      matchLength: needle.length,
    });
  }

  for (const route of routes) {
    const at = route.name.toLowerCase().indexOf(needle);
    if (at === -1) continue;

    add(routeHits, {
      key: `route:${route.id}`,
      kind: 'route',
      label: route.name,
      detail: `${categoryLabel(route.category)} · ${route.estimatedDurationMinutes} min`,
      query: route.name,
      routeId: route.id,
      matchStart: at,
      matchLength: needle.length,
    });
  }

  return [
    ...stops.sort(byMatchPosition),
    ...sectors.sort(byMatchPosition),
    ...routeHits.sort(byMatchPosition),
  ].slice(0, MAX_SUGGESTIONS);
}
