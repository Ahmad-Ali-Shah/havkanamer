/**
 * Map overlays are native props, so they need React Native parseable colours
 * rather than the oklch() values used by className tokens. These hexes mirror
 * the palette defined in global.css.
 */
export const MAP_COLORS = {
  route: '#1D62B8',
  routeMuted: '#94A3B8',
  routeDraft: '#EA7317',
  radiusFill: 'rgba(29, 98, 184, 0.09)',
  radiusStroke: 'rgba(29, 98, 184, 0.42)',
  start: '#16A34A',
  end: '#DC2626',
  stop: '#F59E0B',
  user: '#1D62B8',
} as const;

/**
 * Hexes for icon/native props that cannot resolve className tokens. These
 * mirror --color-live and the danger foreground used in global.css.
 */
export const ICON_COLORS = {
  live: '#16A34A',
  danger: '#B91C1C',
} as const;

export const ISLAMABAD_CENTER = { latitude: 33.6844, longitude: 73.0479 };
