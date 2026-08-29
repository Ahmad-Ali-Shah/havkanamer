import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Caps and centres a screen's content on tablet and desktop widths. Below the
 * cap it is a no-op, so phones keep the full-bleed layout. Applied to the
 * scroll content container of every screen rather than to individual cards, so
 * one measurement governs the whole column.
 */
export const CONTENT_COLUMN = 'w-full max-w-[720px] self-center';

/** Short unique id for locally created records. */
export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
