/**
 * Map overlays and icon props are native props, so they need React Native
 * parseable colours rather than the oklch() values used by className tokens.
 * Every hex here mirrors a token in global.css — change the token first, then
 * the hex, so the two halves of the duotone stay in step.
 */

/** Blue half of the duotone — mirrors --accent / --color-route. */
const BRAND_BLUE = '#0F6BB5';
/** Green half of the duotone — mirrors --color-live. */
const BRAND_GREEN = '#0E8A63';

export const MAP_COLORS = {
  route: BRAND_BLUE,
  routeMuted: '#94A3B8',
  routeDraft: '#EA7317',
  radiusFill: 'rgba(15, 107, 181, 0.10)',
  radiusStroke: 'rgba(15, 107, 181, 0.42)',
  /** Boarding end of a path — green, because that is where you get moving. */
  start: BRAND_GREEN,
  end: '#DC2626',
  stop: '#F59E0B',
  user: BRAND_BLUE,
} as const;

/**
 * Hexes for icon/native props that cannot resolve className tokens. These
 * mirror --color-live, --color-fare and the danger foreground in global.css.
 */
export const ICON_COLORS = {
  live: BRAND_GREEN,
  danger: '#B91C1C',
  fare: '#8A5A17',
  onBrand: '#FFFFFF',
  /** Mint, for icons sitting on top of the gradient header. */
  onBrandMint: '#8FEFC9',
} as const;

/**
 * Explore header gradient: green (top-left) through teal into blue
 * (bottom-right), so the two brand hues are introduced together. All three
 * stops are dark enough to clear AA contrast against white text.
 */
export const HERO_GRADIENT = ['#0C6B4C', '#0B6B74', '#12529B'] as const;

/** Translucent white layer used on top of the gradient header. */
export const ON_BRAND_SURFACE = 'rgba(255, 255, 255, 0.16)';

/** Mint-tinted layer for the "running now" pill on the gradient header. */
export const ON_BRAND_LIVE_SURFACE = 'rgba(143, 239, 201, 0.22)';

export const ISLAMABAD_CENTER = { latitude: 33.6844, longitude: 73.0479 };
