import type { ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { MOTION_DURATION } from '@/lib/motion';

const AnimatedView = withUniwind(Animated.View);

/** Entrance timing shared by every revealed surface, so nothing feels sluggish. */
const DURATION = MOTION_DURATION.enter;
const STAGGER = 45;
/** Beyond this the stagger stops compounding or late items feel broken. */
const MAX_STAGGER_STEPS = 8;

const LAYOUT_TRANSITION = LinearTransition.duration(MOTION_DURATION.layout);

interface RevealProps {
  children: React.ReactNode;
  /** Position in a list; drives the stagger delay. */
  index?: number;
  /** Extra delay in ms on top of the index stagger. */
  delay?: number;
  /** Slide distance. 0 fades in place. */
  distance?: number;
  /**
   * Animate this item to its new position when the list around it changes, so
   * filtering and re-sorting slide instead of snapping.
   */
  animateLayout?: boolean;
  className?: string;
  style?: ViewStyle;
}

/**
 * Staggered entrance wrapper. Purely presentational — it never intercepts
 * touches, so it is safe to wrap pressable content.
 */
export function Reveal({
  children,
  index = 0,
  delay = 0,
  distance = 12,
  animateLayout = false,
  className,
  style,
}: RevealProps) {
  const totalDelay = delay + Math.min(index, MAX_STAGGER_STEPS) * STAGGER;

  const entering =
    distance === 0
      ? FadeIn.duration(DURATION).delay(totalDelay)
      : FadeInDown.duration(DURATION)
          .delay(totalDelay)
          .withInitialValues({
            transform: [{ translateY: distance }],
          });

  return (
    <AnimatedView
      entering={entering}
      layout={animateLayout ? LAYOUT_TRANSITION : undefined}
      className={className}
      style={style}
    >
      {children}
    </AnimatedView>
  );
}
