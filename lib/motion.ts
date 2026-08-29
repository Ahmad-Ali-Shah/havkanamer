/**
 * One place for every duration and spring in the app, so motion reads as a
 * single system rather than per-screen guesses. Everything sits in the
 * 160–420ms band: fast enough to feel like a response, slow enough to be read.
 */

export const MOTION_DURATION = {
  /** Press and release feedback. */
  press: 180,
  /** Entrances, exits, cross-fades. */
  enter: 260,
  /** Reordering and resizing, which need a touch longer to be followed. */
  layout: 300,
  /** A route line drawing itself in a list row. */
  draw: 480,
  /** A route line drawing itself across the detail map. */
  drawMap: 900,
} as const;

/** Snappy: press feedback and small icon movement. */
export const SPRING_SNAP = { damping: 18, stiffness: 320, mass: 0.5 } as const;
/** Deliberate: sliding indicators and segmented thumbs. */
export const SPRING_GLIDE = { damping: 20, stiffness: 220, mass: 0.6 } as const;
/** Slightly springy, for a selection that should feel confirmed. */
export const SPRING_POP = { damping: 12, stiffness: 260, mass: 0.5 } as const;

/**
 * Stage timings for the route detail reveal. The sequence is the story of the
 * route: the map arrives, the line is traced, the stops land, then the vehicle
 * starts moving and the arrival panel slides in.
 */
export const ROUTE_SEQUENCE = {
  /** How long the "finding your fastest route" state is shown. */
  preparing: 620,
  map: 0,
  line: 120,
  stops: 320,
  vehicle: 640,
  panel: 760,
} as const;

/** Ease-out cubic, matched to the feel of withTiming's default easing. */
export function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

/** Ease-in-out sine, for anything that loops without a visible seam. */
export function easeInOut(t: number) {
  return 0.5 - Math.cos(Math.PI * t) / 2;
}
