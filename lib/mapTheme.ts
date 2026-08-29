/**
 * Map overlays are native props, so they need React Native parseable colours
 * rather than the oklch() values used by className tokens. These hexes mirror
 * the palette defined in global.css.
 */
export const MAP_COLORS = {
  route: '#1F5FD0',
  routeMuted: '#94A3B8',
  routeDraft: '#EA7317',
  radiusFill: 'rgba(31, 95, 208, 0.09)',
  radiusStroke: 'rgba(31, 95, 208, 0.42)',
  start: '#16A34A',
  end: '#DC2626',
  stop: '#F59E0B',
  user: '#1F5FD0',
} as const;

/**
 * Hexes for icon/native props that cannot resolve className tokens. These
 * mirror --color-live, --color-fare and the danger foreground in global.css.
 */
export const ICON_COLORS = {
  live: '#16A34A',
  danger: '#B91C1C',
  fare: '#8A5A17',
  onBrand: '#FFFFFF',
} as const;

/** Gradient stops for the Explore header, shading down from the brand accent. */
export const HERO_GRADIENT = ['#123F94', '#1B58C0', '#2F7CD6'] as const;

/** Translucent white layers used on top of the gradient header. */
export const ON_BRAND_SURFACE = 'rgba(255, 255, 255, 0.16)';

export const ISLAMABAD_CENTER = { latitude: 33.6844, longitude: 73.0479 };
