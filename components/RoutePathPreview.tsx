import { View } from 'react-native';

import { Circle, Path, Svg } from '@/components/ui/primitives/Svg';
import type { LatLng } from '@/components/MapView.types';
import { MAP_COLORS } from '@/lib/mapTheme';

const WIDTH = 100;
const HEIGHT = 44;
const PADDING = 6;

interface RoutePathPreviewProps {
  path: LatLng[];
  /** Dimmed styling for routes with nobody operating them. */
  muted?: boolean;
  className?: string;
}

/**
 * Lightweight route shape for list rows. Rendering a real map per row is far
 * too heavy, and at card size the silhouette is all that reads anyway.
 */
export function RoutePathPreview({ path, muted = false, className }: RoutePathPreviewProps) {
  if (path.length < 2) return null;

  const latitudes = path.map((point) => point.latitude);
  const longitudes = path.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLon = Math.max(maxLon - minLon, 1e-6);

  const points = path.map((point) => ({
    x: PADDING + ((point.longitude - minLon) / spanLon) * (WIDTH - PADDING * 2),
    // SVG y grows downwards while latitude grows upwards.
    y: PADDING + (1 - (point.latitude - minLat) / spanLat) * (HEIGHT - PADDING * 2),
  }));

  const d = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const first = points[0];
  const last = points.at(-1) ?? first;
  const stroke = muted ? MAP_COLORS.routeMuted : MAP_COLORS.route;

  return (
    <View className={className}>
      <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <Path d={d} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" fill="none" />
        <Circle cx={first.x} cy={first.y} r={3.2} fill={muted ? stroke : MAP_COLORS.start} />
        <Circle cx={last.x} cy={last.y} r={3.2} fill={muted ? stroke : MAP_COLORS.end} />
      </Svg>
    </View>
  );
}
