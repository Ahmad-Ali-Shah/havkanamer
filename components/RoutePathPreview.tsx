import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Circle, Path, Svg } from '@/components/ui/primitives/Svg';
import { useTimedProgress } from '@/hooks/useTimedProgress';
import { MOTION_DURATION } from '@/lib/motion';
import { MAP_COLORS } from '@/lib/mapTheme';
import type { LatLng } from '@/components/MapView.types';

/**
 * The silhouette is authored in a 100 x 44 box and then mapped into the
 * requested width by hand, rather than left to the SVG viewBox. Knowing the
 * pixel position of each point is what lets the boarding marker carry a real
 * Reanimated halo instead of a static ring.
 */
const BASE_WIDTH = 100;
const BASE_HEIGHT = 44;
const BASE_PADDING = 6;
const DOT_RADIUS = 3.2;
const HALO_SIZE = 14;

interface RoutePathPreviewProps {
  path: LatLng[];
  /** Dimmed styling for routes with nobody operating them. */
  muted?: boolean;
  /** Rendered width in px. Proportions are preserved at any width. */
  width?: number;
  /** Milliseconds before the line starts tracing itself. */
  drawDelay?: number;
  /** Render complete instead of drawing in. */
  animate?: boolean;
  /** Press progress from the surrounding card, 0 → 1. */
  emphasis?: SharedValue<number>;
  /** Breathes the boarding marker while a vehicle is running this route. */
  live?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

function project(path: LatLng[], scale: number, offsetY: number): Point[] {
  const latitudes = path.map((point) => point.latitude);
  const longitudes = path.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);

  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLon = Math.max(maxLon - minLon, 1e-6);

  return path.map((point) => ({
    x:
      (BASE_PADDING + ((point.longitude - minLon) / spanLon) * (BASE_WIDTH - BASE_PADDING * 2)) *
      scale,
    // SVG y grows downwards while latitude grows upwards.
    y:
      (BASE_PADDING +
        (1 - (point.latitude - minLat) / spanLat) * (BASE_HEIGHT - BASE_PADDING * 2)) *
        scale +
      offsetY,
  }));
}

function toPathData(points: Point[]) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
}

/** The leading part of a polyline, ending on an interpolated point. */
function traced(points: Point[], progress: number): Point[] {
  if (progress >= 1 || points.length < 2) return points;

  const lengths: number[] = [0];
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;
    lengths.push(lengths[index - 1] + Math.hypot(dx, dy));
  }

  const total = lengths[lengths.length - 1];
  if (total === 0) return points;

  const target = Math.max(0, progress) * total;
  const output: Point[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    if (lengths[index] < target) {
      output.push(points[index]);
      continue;
    }
    const segment = lengths[index] - lengths[index - 1];
    const t = segment === 0 ? 0 : (target - lengths[index - 1]) / segment;
    output.push({
      x: points[index - 1].x + (points[index].x - points[index - 1].x) * t,
      y: points[index - 1].y + (points[index].y - points[index - 1].y) * t,
    });
    break;
  }

  return output;
}

/**
 * Lightweight route shape for list rows. Rendering a real map per row is far
 * too heavy, and at card size the silhouette is all that reads anyway.
 *
 * The line traces itself when the row appears: at this size the shape is the
 * only thing distinguishing one route from another, and watching it drawn is
 * what makes it register as a path rather than a decoration.
 */
export function RoutePathPreview({
  path,
  muted = false,
  width = 56,
  drawDelay = 0,
  animate = true,
  emphasis,
  live = false,
  className,
}: RoutePathPreviewProps) {
  const progress = useTimedProgress({
    duration: MOTION_DURATION.draw,
    delay: drawDelay,
    enabled: animate && path.length >= 2,
  });

  const pulse = useSharedValue(0);
  const shouldPulse = live && !muted;

  useEffect(() => {
    if (!shouldPulse) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return undefined;
    }

    pulse.value = 0;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );

    return () => cancelAnimation(pulse);
  }, [shouldPulse, pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.45,
    transform: [{ scale: 0.5 + pulse.value * 1.3 }],
  }));

  const emphasisStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (emphasis?.value ?? 0) * 0.08 }],
  }));

  if (path.length < 2) return null;

  const scale = Math.min(width / BASE_WIDTH, 1);
  const offsetY = (BASE_HEIGHT - BASE_HEIGHT * scale) / 2;
  const points = project(path, scale, offsetY);

  const stroke = muted ? MAP_COLORS.routeMuted : MAP_COLORS.route;
  const dotRadius = DOT_RADIUS * scale;
  const first = points[0];
  const last = points[points.length - 1];

  // The destination marker lands only once the line reaches it.
  const arrival = Math.max(0, Math.min(1, (progress - 0.8) / 0.2));

  return (
    <AnimatedView className={className} style={[{ width, height: BASE_HEIGHT }, emphasisStyle]}>
      <Svg width={width} height={BASE_HEIGHT} viewBox={`0 0 ${width} ${BASE_HEIGHT}`}>
        {/* Faint full path so the traced line reads as progress along a route. */}
        {progress < 1 ? (
          <Path
            d={toPathData(points)}
            stroke={stroke}
            strokeOpacity={0.18}
            strokeWidth={2.5 * scale}
            strokeLinejoin="round"
            fill="none"
          />
        ) : null}

        <Path
          d={toPathData(traced(points, progress))}
          stroke={stroke}
          strokeWidth={2.5 * scale}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />

        <Circle cx={first.x} cy={first.y} r={dotRadius} fill={muted ? stroke : MAP_COLORS.start} />

        {arrival > 0 ? (
          <Circle
            cx={last.x}
            cy={last.y}
            r={dotRadius * arrival}
            fill={muted ? stroke : MAP_COLORS.end}
          />
        ) : null}
      </Svg>

      {shouldPulse ? (
        <AnimatedView
          pointerEvents="none"
          className="bg-live absolute rounded-full"
          style={[
            {
              width: HALO_SIZE,
              height: HALO_SIZE,
              left: first.x - HALO_SIZE / 2,
              top: first.y - HALO_SIZE / 2,
            },
            haloStyle,
          ]}
        />
      ) : null}
    </AnimatedView>
  );
}
