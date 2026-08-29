import { useEffect, useState } from 'react';

import { easeOut } from '@/lib/motion';

/**
 * Progress is stepped rather than run per animation frame.
 *
 * Reanimated drives transforms and opacity on the UI thread, but it cannot
 * animate react-native-svg geometry (a path's dash offset, a circle's radius)
 * on web — and web is the preview this app is reviewed in. Anything that
 * animates SVG geometry or map coordinates therefore has to come from React
 * state, so the steps are coarse on purpose: a whole list of self-drawing route
 * diagrams stays cheap instead of scaling with the frame rate.
 */
const DRAW_FRAME_MS = 32;

interface TimedProgressOptions {
  duration: number;
  delay?: number;
  /** When false, progress is pinned at 1 so content renders already complete. */
  enabled?: boolean;
  /** Changing this restarts the ramp. */
  resetKey?: string | number;
}

/** A one-shot, eased 0 → 1 ramp. */
export function useTimedProgress({
  duration,
  delay = 0,
  enabled = true,
  resetKey,
}: TimedProgressOptions) {
  const [progress, setProgress] = useState(enabled ? 0 : 1);

  useEffect(() => {
    if (!enabled) {
      setProgress(1);
      return undefined;
    }

    setProgress(0);

    const steps = Math.max(1, Math.round(duration / DRAW_FRAME_MS));
    let step = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const startTimer = setTimeout(() => {
      interval = setInterval(() => {
        step += 1;
        setProgress(easeOut(Math.min(1, step / steps)));
        if (step >= steps && interval) clearInterval(interval);
      }, DRAW_FRAME_MS);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (interval) clearInterval(interval);
    };
  }, [duration, delay, enabled, resetKey]);

  return progress;
}

interface LoopProgressOptions {
  /** One full pass in milliseconds. */
  duration: number;
  enabled?: boolean;
  /** How often the position is recomputed. Coarser is cheaper. */
  frameMs?: number;
}

/** A linear 0 → 1 loop, for anything that keeps travelling. */
export function useLoopProgress({ duration, enabled = true, frameMs = 180 }: LoopProgressOptions) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setProgress(0);
      return undefined;
    }

    const steps = Math.max(2, Math.round(duration / frameMs));
    let step = 0;

    const interval = setInterval(() => {
      step = (step + 1) % steps;
      setProgress(step / steps);
    }, frameMs);

    return () => clearInterval(interval);
  }, [duration, enabled, frameMs]);

  return progress;
}

/**
 * Counts how many of the given millisecond marks have passed since mount, so a
 * multi-part reveal can be expressed as one ordered list of moments.
 */
export function useSequenceStep(marks: readonly number[], resetKey?: string | number) {
  const [step, setStep] = useState(0);
  const marksKey = marks.join(',');

  useEffect(() => {
    setStep(0);

    const timers = marksKey
      .split(',')
      .map((mark, index) => setTimeout(() => setStep(index + 1), Number(mark)));

    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [marksKey, resetKey]);

  return step;
}
