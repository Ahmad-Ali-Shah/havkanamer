import { router, type Href } from 'expo-router';

/**
 * Go back when there is history, otherwise land somewhere sensible.
 *
 * Needed because a screen can be opened directly: via a deep link, a web
 * reload, or after the stack was reset. In those cases `canGoBack()` is false
 * and a bare `router.back()` does nothing at all, which looks like a dead
 * button.
 */
export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * Leave a multi-step flow and land on a tab.
 *
 * Tab routes live inside the `(tabs)` group, so they are not entries in the
 * root stack. `router.dismissTo('/vendor')` therefore has no matching target
 * and silently does nothing. Popping the stack first and then replacing is the
 * combination that actually works.
 */
export function exitFlowTo(target: Href) {
  if (router.canGoBack()) router.dismissAll();
  router.replace(target);
}

/**
 * Where each stack screen should go when it has no history to pop.
 *
 * Keyed by route name so the root layout and individual screens agree on the
 * destination instead of each guessing.
 */
export const BACK_FALLBACKS = {
  'route/[id]': '/',
  'vendor/sign-in': '/vendor',
  'vendor/join': '/vendor',
  'vendor/new/path': '/vendor',
  'vendor/new/details': '/vendor/new/path',
  'vendor/new/vehicle': '/vendor',
  'vendor/new/fares': '/vendor/new/vehicle',
  'vendor/registration/[id]': '/vendor',
  'journey/[registrationId]': '/vendor',
} as const satisfies Record<string, Href>;

export type BackFallbackRoute = keyof typeof BACK_FALLBACKS;
