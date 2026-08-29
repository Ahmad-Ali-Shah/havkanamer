# Design & Interaction Handoff — Local Transport Discovery

A complete specification of the app's visual language, motion system, component
library and screens. Written so a developer (or an AI agent) can rebuild the
exact same UI/UX in a different project without seeing this codebase.

Everything below is descriptive of the current implementation. Class names are
Tailwind/Uniwind utilities as written in the source; copy strings are verbatim.

---

## 1. What the product is

Passengers find informal fixed-route transport near them — wagons, vans,
coasters, rickshaw routes, shuttles, university transport. Vendors (drivers /
operators) publish the route they already drive, attach a vehicle and fare
bands to it, and start a "journey" when they set off so passengers can see they
are running right now.

Product thesis, printed in the app: **"The transport isn't missing. The data is."**

Two audiences in one app:

- **Passenger** — Explore (map + nearby), Routes (search/filter), route detail.
- **Vendor** — sign in, create or join a route, manage a registration, run journeys.

---

## 2. Stack

| Concern | Choice |
| --- | --- |
| Framework | Expo (React Native) + Expo Router 6, file-based routes |
| Styling | Uniwind (Tailwind utilities for RN) + HeroUI Native |
| UI kit | HeroUI Native (`Button`, `Card`, `Surface`, `Chip`, `TextField`, `Input`, `Label`, `Description`, `Separator`, `SearchField`, `Spinner`, `Typography`) |
| Icons | `lucide-react-native` |
| Motion | `react-native-reanimated` v4 (+ `react-native-gesture-handler`) |
| Maps | one cross-platform `MapView` abstraction (`react-native-maps` on native, web implementation on web) |
| SVG | `react-native-svg` (route mini-diagrams) |
| State | zustand + AsyncStorage persistence (three stores) |
| Haptics | `expo-haptics` |
| Font | Inter 400 / 500 / 600 / 700 |

No backend. All data is local: seeded Islamabad routes plus anything the user
publishes on-device.

---

## 3. Colour system

### 3.1 The idea

The brand is a **green + blue duotone with fixed, non-interchangeable roles**,
both at matched lightness and chroma so they read as one family:

- **BLUE = the network.** Routes, navigation, primary buttons, selected states,
  tab active tint, polylines, links, category tiles. *It is the colour you press.*
- **GREEN = motion.** Running now, active journey, the boarding end of a path.
  *It is the colour you catch.*
- **Idle grey** is desaturated to the blue hue, so grey never looks foreign.
- **Fare is warm amber, deliberately outside the brand**, so a price can never be
  mistaken for a status or for something tappable.

### 3.2 Tokens (CSS, `global.css`)

Brand accent is defined **inside theme variants**, not in a plain `:root`, or
native builds keep the UI kit's default blue:

```css
@layer theme {
  :root {
    @variant light {
      --accent: oklch(0.52 0.115 235);
      --accent-foreground: oklch(0.99 0 0);
      --focus: var(--accent);
    }
    @variant dark {
      --accent: oklch(0.7 0.1 235);
      --accent-foreground: oklch(0.16 0.03 235);
      --focus: var(--accent);
    }
  }
}

@theme {
  /* Green half — running now, journey in progress, boarding point. */
  --color-live: oklch(0.53 0.125 163);
  --color-live-foreground: oklch(0.99 0 0);
  --color-live-surface: oklch(0.955 0.042 163);
  --color-live-border: oklch(0.85 0.075 163);

  /* Blue half — the route network itself. Same hue as --accent. */
  --color-route: oklch(0.52 0.115 235);
  --color-route-surface: oklch(0.955 0.03 235);
  --color-route-border: oklch(0.88 0.05 235);

  /* Nobody running. */
  --color-idle: oklch(0.52 0.014 235);
  --color-idle-surface: oklch(0.965 0.004 235);
  --color-idle-border: oklch(0.9 0.006 235);

  /* Fare — warm, outside the brand on purpose. */
  --color-fare: oklch(0.5 0.105 62);
  --color-fare-surface: oklch(0.965 0.04 78);
  --color-fare-border: oklch(0.88 0.07 78);
}
```

Only `--color-*` variables generate `bg-*` / `text-*` / `border-*` utilities.
Resulting utility families in use: `bg-live`, `bg-live-surface`,
`border-live-border`, `text-live`; `bg-route-surface`, `text-route`;
`bg-idle`, `bg-idle-surface`, `border-idle-border`, `text-idle`;
`text-fare`, `bg-fare-surface`. Plus the UI kit's own semantic tokens:
`bg-background`, `bg-surface`, `bg-surface-secondary`, `border-border`,
`text-muted`, `text-accent`, `text-accent-foreground`, `text-danger`, `bg-accent`.

The app is **light-only** (theme locked to light at startup).

### 3.3 Native colour mirrors (hex)

Map overlays, icon props and status bars are native props and cannot resolve
`oklch()` class tokens, so a parallel hex table mirrors the CSS tokens. Change
the token first, then the hex.

```ts
const BRAND_BLUE  = '#0F6BB5'; // mirrors --accent / --color-route
const BRAND_GREEN = '#0E8A63'; // mirrors --color-live

MAP_COLORS = {
  route:        '#0F6BB5',
  routeMuted:   '#94A3B8',
  routeDraft:   '#EA7317',                    // vendor drawing a new path
  radiusFill:   'rgba(15, 107, 181, 0.10)',
  radiusStroke: 'rgba(15, 107, 181, 0.42)',
  start:        '#0E8A63',                    // boarding end = green
  end:          '#DC2626',
  stop:         '#F59E0B',
  user:         '#0F6BB5',
};

ICON_COLORS = {
  live:        '#0E8A63',
  danger:      '#B91C1C',
  fare:        '#8A5A17',
  onBrand:     '#FFFFFF',
  onBrandMint: '#8FEFC9',   // icons on the gradient header
};

HERO_GRADIENT          = ['#0C6B4C', '#0B6B74', '#12529B']; // green → teal → blue
ON_BRAND_SURFACE       = 'rgba(255, 255, 255, 0.16)';
ON_BRAND_LIVE_SURFACE  = 'rgba(143, 239, 201, 0.22)';

ISLAMABAD_CENTER = { latitude: 33.6844, longitude: 73.0479 };
```

All three gradient stops clear AA contrast against white text.

### 3.4 Colour role table

| Meaning | Surface | Text / icon | Border |
| --- | --- | --- | --- |
| Running now / live | `bg-live-surface` | `text-live`, `ICON_COLORS.live` | `border-live-border` |
| Route / network / selected | `bg-route-surface`, `bg-accent` | `text-accent`, `text-accent-foreground` | `border-route-border`, `border-accent` |
| Idle / nobody running | `bg-idle-surface` | `text-idle` | `border-idle-border` |
| Fare | `bg-fare-surface` | `text-fare`, `ICON_COLORS.fare` | `border-fare-border` |
| Destructive | HeroUI `danger` / `danger-soft` button variants | `text-danger`, `ICON_COLORS.danger` | — |
| Draft path (vendor) | — | `MAP_COLORS.routeDraft` | — |

---

## 4. Typography

Inter, four weights (400/500/600/700), loaded from Google Fonts and also
injected as a `<link>` on web.

All text goes through HeroUI `Typography` with `type` + `weight` + `color`:

| Usage | Spec |
| --- | --- |
| Screen hero title (gradient header) | `type="h3"`, `className="text-white"` |
| Form / flow screen title | `type="h4"` (sign-in) or `type="h5"` |
| Card / entity title, section header | `type="h6"` |
| Stat value, account name, numbers | `type="h5"` or `type="body"` + `weight="semibold"` |
| Body copy | `type="body-sm"`, `color="muted"` for secondary |
| Meta, badge, chip, caption | `type="body-xs"` |
| Overline / group label | `type="body-xs"` `weight="semibold"` `color="muted"` `className="tracking-wide uppercase"` |

Rules: titles truncate with `numberOfLines={1}` in cards and rows; descriptive
copy never truncates; a stat's value and its label are always a pair
(`body` semibold value + `body-xs` muted label).

---

## 5. Layout, spacing, shape

- **Content column:** `CONTENT_COLUMN = 'w-full max-w-[720px] self-center'`, applied
  to the *scroll content container* of every screen (`contentContainerClassName`),
  never per card. Below 720px it is a no-op; above it, the column centres.
  Exception: the vendor route-drawing map stays full width.
- **Screen padding:** `p-4` (tab/flow screens), list bottom `pb-10`, form bottom `pb-6`.
- **Vertical rhythm:** `gap-5` between screen sections, `gap-3` between cards in a
  list, `gap-2` inside a titled block, `gap-1` / `gap-0.5` inside a text pair.
- **Radii:** `rounded-3xl` for cards and map containers, `rounded-2xl` for tiles and
  soft panels, `rounded-xl` for rows and inner panels, `rounded-full` for pills,
  badges, dots and circular controls. Gradient header uses `rounded-b-[32px]`.
- **Circular controls:** `h-11 w-11 items-center justify-center rounded-full` with
  `border-border` and `bg-background` (44pt target).
- **Icon tiles:** `h-9 w-9 rounded-xl` (sm), `h-11 w-11 rounded-2xl` (md),
  `h-14 w-14 rounded-2xl` (lg), `h-12 w-12 rounded-2xl` for screen-header tiles.
- **Safe area:** header uses `pt-safe-offset-4`; sticky footers use `pb-safe-offset-4`.
- **Borders:** hairline `border` + `border-border`. Cards are bordered, not shadowed
  (shadow only on the web install prompt).

---

## 6. Motion system

One shared source of durations and springs, so motion reads as a system rather
than per-screen guesses. Everything sits in a 160–420ms band, except deliberate
line-drawing.

```ts
MOTION_DURATION = {
  press:   180,  // press and release feedback
  enter:   260,  // entrances, exits, cross-fades
  layout:  300,  // reordering and resizing
  draw:    480,  // a route line drawing itself in a list row
  drawMap: 900,  // a route line drawing itself across a detail map
};

SPRING_SNAP  = { damping: 18, stiffness: 320, mass: 0.5 };  // press feedback, small icon moves
SPRING_GLIDE = { damping: 20, stiffness: 220, mass: 0.6 };  // sliding indicators, segmented thumbs
SPRING_POP   = { damping: 12, stiffness: 260, mass: 0.5 };  // a selection that should feel confirmed

// Stage timings for the route detail reveal
ROUTE_SEQUENCE = { preparing: 620, map: 0, line: 120, stops: 320, vehicle: 640, panel: 760 };

easeOut   = (t) => 1 - (1 - t) ** 3;             // matches withTiming default feel
easeInOut = (t) => 0.5 - Math.cos(Math.PI * t) / 2; // seamless loops
```

### 6.1 Motion vocabulary

| Pattern | Spec |
| --- | --- |
| Screen push | `slide_from_right`, 260ms |
| Row / card entrance | fade + 12px rise, 260ms, staggered 45ms per index, stagger capped at 8 steps |
| List reorder (filter / sort) | `LinearTransition` 300ms on each row |
| Press feedback | spring in (`SPRING_SNAP`), timing out (180ms); scale 0.97 and opacity 0.9 by default |
| Selection confirm (chip) | `withSequence(withTiming(1, 110ms), withSpring(0, SPRING_POP))` → scale +7% |
| Segmented thumb | `withSpring(index * segmentWidth, SPRING_GLIDE)` |
| Tab icon focus | `withSpring(focused ? 1 : 0, { damping: 14, stiffness: 260, mass: 0.5 })` → scale +14%, lift 2px |
| Live status pulse | halo: 1800ms `Easing.out`, infinite, opacity `(1 - p) * 0.5`, scale `1 + p * 2` |
| Empty-state icon float | 2400ms `Easing.inOut`, reversing repeat, translateY `-p * 4` |
| Loader bus sweep | 1500ms `Easing.inOut`, infinite, translateX across the track, trail width follows |
| Number change | step through intermediate values at 90ms, max 8 steps, each settles with a 7px upward roll (180ms) |
| Number emphasis | 1100ms `Easing.inOut` reversing pulse, scale +4% |
| Route line draw (row) | eased 0→1 over 480ms, 32ms frame step, delayed 70ms per row (max 8 rows) |
| Header collapse on scroll | translateY `scrollY * 0.22`, scale `1 - settled * 0.02`, opacity `1 - settled * 0.3`, over 160px of travel |

### 6.2 Motion helper hooks

- `useTimedProgress({ duration, delay, enabled, resetKey })` → one-shot eased 0→1
  ramp, 32ms frames, `easeOut`. Pinned at 1 when `enabled` is false.
- `useLoopProgress({ duration, enabled, frameMs = 180 })` → linear 0→1 loop.
- `useSequenceStep(marks, resetKey)` → how many millisecond marks have passed
  since mount; drives multi-stage reveals expressed as an ordered list of moments.

### 6.3 Motion rules

Motion is subtle and purposeful. It only ever communicates location, movement,
route, status, progress, selection or navigation. Nothing decorative, nothing
that makes the app feel like an animation demo.

---

## 7. Interaction rules (non-negotiable)

1. **One press primitive.** Every tappable that is not a HeroUI `Button`/`Chip`
   goes through `Tappable`: a Reanimated-animated RN `Pressable` supplying press
   scale, press opacity, haptics and `hitSlop={10}`. Never use a bare `Pressable`
   or a feedback-less wrapper for cards, pills or toggles — a card that navigates
   with no visual response reads as broken.
2. **Never wrap a HeroUI pressable.** `Button`, `Chip`, `LinkButton`, `CloseButton`
   already take `onPress`; wrapping them in another pressable swallows the touch.
3. **Segmented controls get vertical hitSlop only** (`{ top, bottom }`). Horizontal
   slop overlaps the neighbouring segment and selects the wrong option near the
   boundary.
4. **Haptics are typed by intent:** `light` (default tap), `medium` (physical
   action such as locate / delete a row), `selection` (filters, chips, segments,
   suggestions, back), `warning` (arming a destructive action), `success`
   (committing: sign in, publish, start/end journey, reset). No-op on web.
5. **Destructive actions need two taps.** First press re-labels the button
   explicitly ("Yes, sign out"), switches it to the `danger` variant, and reveals
   a cancel button; second press commits. `warning` haptic on arming, `success`
   on commit.
6. **Maps inside scrollables start with gestures off.** `scrollEnabled={false}`
   `zoomEnabled={false}` plus a `Maximize2` toggle that enables gestures and grows
   the height. An interactive map inside a scroll view swallows vertical pans and
   the page appears frozen. The vendor drawing map is the exception — it is not
   inside a scrollable and tap-to-add-waypoint is its whole purpose.
7. **Lists with inputs need `keyboardShouldPersistTaps="handled"`.** Otherwise the
   first tap after typing is eaten by keyboard dismissal.
8. **Screens with inputs use `KeyboardAvoidingView`** (`behavior="padding"` on iOS)
   wrapping a scrollable.
9. **Every interactive element has an accessibility label and, where it toggles,
   `accessibilityState`** (`selected`, `expanded`, `disabled`).
10. **Disabled buttons still say why**: the label carries the reason
    ("Add at least two points", "Name the start and end points").

---

## 8. Navigation architecture

### 8.1 Route map

```
app/_layout.tsx                     root Stack
  (tabs)/_layout.tsx                bottom tabs — headerShown: false on the stack
    (tabs)/index.tsx                Explore   (own gradient header, headerShown: false)
    (tabs)/routes.tsx               Routes
    (tabs)/vendor.tsx               Vendor
    (tabs)/profile.tsx              Profile
  route/[id].tsx                    title: 'Route',          back label 'Explore'
  vendor/sign-in.tsx                title: 'Vendor sign in'
  vendor/join.tsx                   title: 'Join a route'
  vendor/new/path.tsx               title: 'Draw route',     back label 'Cancel'
  vendor/new/details.tsx            title: 'Route details'
  vendor/new/vehicle.tsx            title: 'Vehicle details'
  vendor/new/fares.tsx              title: 'Fares'
  vendor/registration/[id].tsx      title: 'My route'
  journey/[registrationId].tsx      title: 'Journey'
  +not-found.tsx                    title: 'Oops!'
```

### 8.2 Root stack options

```ts
{
  headerStyle:      { backgroundColor: background },
  headerTintColor:  foreground,
  headerTitleStyle: { color: foreground, fontWeight: '600' },
  headerShadowVisible: false,
  headerBackVisible: false,          // platform back control disabled on purpose
  contentStyle: { backgroundColor: background },
  animation: 'slide_from_right',
  animationDuration: 260,
}
```

### 8.3 Explicit back control

The platform default back control renders **nothing** when a screen is opened
directly (deep link, web reload) because there is no history — the user is
stranded. So `headerBackVisible` is false and every pushed screen supplies
`headerLeft: () => <HeaderBackButton route="<exact route name>" />`.

`HeaderBackButton` resolves a fallback per route, and also overrides the Android
hardware back button while focused:

```ts
BACK_FALLBACKS = {
  'route/[id]':                  '/',
  'vendor/sign-in':              '/vendor',
  'vendor/join':                 '/vendor',
  'vendor/new/path':             '/vendor',
  'vendor/new/details':          '/vendor/new/path',
  'vendor/new/vehicle':          '/vendor',
  'vendor/new/fares':            '/vendor/new/vehicle',
  'vendor/registration/[id]':    '/vendor',
  'journey/[registrationId]':    '/vendor',
};

goBackOrReplace(fallback)  // back if history exists, else replace
exitFlowTo(target)         // dismissAll() then replace(target) — leaving a multi-step flow
```

`router.dismissTo('/vendor')` does **not** work here: tab routes live inside the
`(tabs)` group so they are not entries in the root stack and there is nothing to
match — it silently does nothing. Use `exitFlowTo` after "Publish route",
"Remove my vehicle", and from not-found states.

Stack option keys must be the exact route names (`vendor/new/details`, not
`vendor/new`). Dynamic routes are pushed as objects:
`router.push({ pathname: '/route/[id]', params: { id } })`.

### 8.4 Tab bar

```ts
tabBarStyle:            { backgroundColor: background, borderTopColor: border },
tabBarLabelStyle:       { fontSize: 11, fontWeight: '600' },
tabBarActiveTintColor:   accent,
tabBarInactiveTintColor: muted,
tabBarItemStyle:        { paddingVertical: 4 },
headerShadowVisible: false,
```

Icons (all lucide, 24px, wrapped in `TabBarIcon` for the focus spring):
Explore `Compass`, Routes `Route`, Vendor `BusFront`, Profile `UserRound`.
Explore sets `headerShown: false` because it owns a gradient header.

### 8.5 Boot gating

The root layout renders nothing but a background (`bg-background flex-1`) until
the persisted stores have hydrated. zustand + AsyncStorage rehydrate
asynchronously, so before hydration a signed-in vendor looks signed out and
valid detail routes render "not found". **A screen may only conclude a record is
missing after hydration.**

Location is a single provider (`LocationProvider`) mounted once above the
navigator, with an 8s timeout and an in-flight guard. `getCurrentPositionAsync`
can hang forever (notably in an embedded web preview), which pins status at
`loading` so the recovery card never renders; and one hook instance per screen
re-prompts for permission.

---

## 9. Data model and state

### 9.1 Types

```ts
type RouteCategory = 'wagon' | 'van' | 'coaster' | 'rickshaw' | 'shuttle' | 'university' | 'other';
type DirectionType = 'one-way' | 'two-way';
type StopType      = 'fixed' | 'flexible';
type RouteDirection = 'forward' | 'reverse';   // forward = start → end

interface NamedPlace { name: string; coordinate: LatLng }
interface RouteStop  { id: string; name: string; coordinate: LatLng }
interface FareSlab   { id: string; fromKm: number; toKm: number | null; fare: number } // toKm null = "and beyond"

interface TransportRoute {            // the shared path; many vendors may run one route
  id: string; name: string; category: RouteCategory;
  start: NamedPlace; end: NamedPlace; path: LatLng[];
  directionType: DirectionType; stopType: StopType; stops: RouteStop[];
  estimatedDurationMinutes: number; createdAt: string; createdByAccountId: string | null;
}

interface VendorRegistration {        // one vendor's vehicle + fares on a route
  id: string; accountId: string; routeId: string;
  vendorName: string; contact: string;
  vehicleRegistration: string; vehicleDetails: string;
  estimatedDurationMinutes: number; stopType: StopType;
  fareSlabs: FareSlab[]; createdAt: string;
}

interface Journey {                   // an explicit operating session
  id: string; registrationId: string; routeId: string;
  direction: RouteDirection; startedAt: string; endedAt: string | null;
}

interface Account { id: string; name: string; phone: string }
```

Key modelling decision: **a registration is only "live" while a `Journey` with
`endedAt === null` exists for it.** Everything green in the UI derives from that.

### 9.2 Stores (zustand + AsyncStorage)

```ts
useTransportStore  // routes, registrations, journeys
                   // createRoute, addRegistration, updateRegistration, removeRegistration,
                   // startJourney, endJourney, resetDemoData
useSessionStore    // account, signIn(name, phone), signOut
useRouteDraftStore // draft, startCreate, startJoin, patch, reset   (multi-step vendor wizard)
useStoresHydrated()// true once both persisted stores have rehydrated
```

### 9.3 Derived helpers (`lib/transport.ts`)

```ts
activeJourneys(journeys)
findActiveJourneyForRegistration(journeys, registrationId)
vendorsForRoute(registrations, journeys, routeId, direction?)  // → RouteVendor[] { registration, activeJourney }
                                                              //   sorted: running first, then vendor name
countActiveVendors(registrations, journeys, routeId, direction?)
registrationsForAccount(registrations, accountId)
describeRoute(route, registrations, journeys, origin)         // → NearbyRoute
matchesQuery(route, query)                                    // all tokens must appear in name/endpoints/stops
```

```ts
interface NearbyRoute {
  route: TransportRoute;
  accessDistanceKm: number;   // walking distance to the nearest point on the path
  accessPoint: LatLng;
  nearestStopName: string | null;
  routeLengthKm: number;
  activeVendorCount: number;
  registeredVendorCount: number;
  fareFrom: number | null;
}
```

### 9.4 Geometry and formatting (`lib/geo.ts`)

```ts
distanceKm(a, b)                          // haversine
pathLengthKm(path)
nearestPointOnPath(path, target)          // { coordinate, distanceKm, alongKm }
pathCumulativeKm(path)
pointAlongPath(path, fraction)            // constant-speed interpolation, for a moving vehicle
slicePathTo(path, fraction)               // leading part, for progressive drawing
regionForCoordinates(coordinates, padding = 1.45)
regionForRadius(center, radiusKm)

formatDistance(km)     // "120 m" (rounded to 10 m) · "1.4 km" · "12 km"
formatDuration(min)    // "25 min" · "1 hr" · "1 hr 20 min"
formatFare(amount)     // "Rs 120"
formatSlabRange(slab)  // "0–5 km" · "10 km and beyond"
sortedSlabs(slabs) · startingFare(slabs) · slabForDistance(slabs, km)
formatClockTime(iso)   // "4:35 PM"
minutesSince(iso)      // integer minutes, min 0
```

### 9.5 Search (`lib/search.ts`)

Typing produces up to **6** suggestions, minimum query length **2**, grouped by
kind in the order **stop → sector → route**, each carrying `matchStart` /
`matchLength` so the matched substring can be bolded. Sector detection uses
`/\b[A-Z]-\d{1,2}(?:\/\d)?\b/g` (Islamabad sectors: `F-10`, `G-11`, `I-8/3`).
Stops and sectors are ranked by match position, then by label length.

```ts
interface Suggestion {
  key: string; kind: 'stop' | 'sector' | 'route';
  label: string; detail: string; query: string;
  routeId: string | null; matchStart: number; matchLength: number;
}
```

### 9.6 Runtime caveat

Never use `Array.prototype.toReversed` / `toSorted` — not safe across all
React Native / Hermes runtimes. A local index-loop `reversed<T>()` helper
produces direction-reversed paths and stops.

---

## 10. Category iconography

One symbolic vehicle silhouette per category, and **an icon never appears
without its written label**, so the symbol teaches itself on first use.

| Category | Label | Icon (lucide) |
| --- | --- | --- |
| `wagon` | Wagon | `Truck` |
| `van` | Van | `Caravan` |
| `coaster` | Coaster | `Bus` |
| `rickshaw` | Rickshaw route | `CarTaxiFront` |
| `shuttle` | Shuttle | `BusFront` |
| `university` | University transport | `GraduationCap` |
| `other` | Other local transport | `Route` |

Fixed semantic icons elsewhere: fare `Wallet`, walking distance `Footprints`,
duration `Clock` / `Timer`, route length `Ruler`, live `Zap` / `Radio`,
location `LocateFixed` / `MapPinOff`, nearby `Radar`.

---

## 11. Component library

### 11.1 `Tappable` — the press primitive

```ts
interface TappableProps extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  pressedScale?: number;    // 0.97
  pressedOpacity?: number;  // 0.9
  pressedLift?: number;     // 0
  haptic?: HapticStrength | false;  // 'light'
  progress?: SharedValue<number>;   // exposed so children can react to the press
}
```

- press in: `withSpring(1, SPRING_SNAP)`; press out: `withTiming(0, 180ms)`.
- `transform: [{ scale: 1 - p * (1 - pressedScale) }, { translateY: -p * pressedLift }]`,
  `opacity: 1 - p * (1 - pressedOpacity)`.
- default `hitSlop={10}`, `accessibilityRole="button"`, `accessibilityState.disabled`.
- runs on the UI thread so feedback stays smooth during a navigator transition.

### 11.2 `Reveal` — entrance and reorder

```ts
{ children, index = 0, delay = 0, distance = 12, animateLayout = false, className, style }
```
`FadeInDown` (or `FadeIn` when `distance === 0`), 260ms, delay
`delay + min(index, 8) * 45`. With `animateLayout`, adds `LinearTransition(300ms)`
so filter/sort reorders slide instead of jumping. Purely presentational — never
intercepts touches.

### 11.3 `AnimatedCount`

```ts
{ value, unit?, type = 'h6', emphasis = false, className?, unitClassName? }
```
Steps through intermediate values at 90ms (max 8 steps) instead of replacing
text. Each settle: `translateY = roll * 7`, `opacity = 1 - |roll| * 0.5`,
resolving with `withTiming(0, 180ms)`. `emphasis` adds an infinite 1100ms
`Easing.inOut` pulse at scale +4%. Container `flex-row items-baseline gap-1`;
unit renders as `body-xs` muted.

### 11.4 `FilterChip`

```ts
{ label, icon?, isSelected, onPress, tone = 'accent' | 'success' }
```
HeroUI `Chip size="sm"`, `variant={isSelected ? 'primary' : 'tertiary'}`,
`color={isSelected ? tone : 'default'}`. Icon 13px:
selected → `accent-foreground` (or white for `success`), unselected → `muted`.
Pops **only when switching on**: `withSequence(withTiming(1, 110), withSpring(0, SPRING_POP))`
→ scale `1 + p * 0.07`. Haptic `selection`.

### 11.5 `TabBarIcon`

```ts
{ icon, color, size, focused }
```
`withSpring(focused ? 1 : 0, { damping: 14, stiffness: 260, mass: 0.5 })`;
`transform: [{ scale: 1 + p * 0.14 }, { translateY: p * -2 }]`.

### 11.6 `HeaderBackButton`

```ts
{ route: BackFallbackRoute, label = 'Back' }
```
`Tappable` with `haptic="selection"`, `hitSlop={16}`, `pressedScale={0.9}`,
`className="-ml-1 flex-row items-center gap-0.5 py-2 pr-2 pl-1"`; children
`ChevronLeft` 24px (foreground) + `Typography type="body" weight="medium"`.
Also exports `useSafeHardwareBack(route)` and `HeaderSpacer` (`w-2`).

### 11.7 `CategoryTile`

```ts
{ category, size = 'sm' | 'md' | 'lg', muted = false, className? }
```
`items-center justify-center` + size class + `bg-route-surface` (or
`bg-surface-secondary` when muted). Sizes: `h-9 w-9 rounded-xl` / `h-11 w-11
rounded-2xl` / `h-14 w-14 rounded-2xl`; icon 17 / 21 / 26px in `accent` (or
`muted`). `accessibilityRole="image"` with the category label.

### 11.8 `StatusBadge`

```ts
{ isLive, label?, className? }
```
`flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1`
plus `border-live-border bg-live-surface` or `border-idle-border bg-idle-surface`.
Contains a 2×2 dot (`bg-live` / `bg-idle`) and, when live, a pulsing halo
(1800ms `Easing.out`, opacity `(1 - p) * 0.5`, scale `1 + p * 2`).
Text `body-xs semibold`, `text-live` / `text-idle`.
Default copy: **"Running now"** / **"Not running"**. Wording is always
"running", never "operating".

### 11.9 `IconStat` / `StatTile` (`Stat.tsx`)

- `IconStat { icon, label, colorHex?, textClassName?, className? }` —
  `flex-row items-center gap-1.5`, icon 14px, label `body-xs` (muted unless a
  colour or text class is given).
- `StatTile { icon, value, label, colorHex?, valueClassName? }` —
  `flex-1 gap-1`, icon 16px, value `body semibold`, label `body-xs muted`.

### 11.10 `SectionHeader` / `GroupLabel`

```ts
SectionHeader { title, meta?, action?, icon?, className? }
```
`flex-row items-center justify-between gap-3`; left group
`flex-shrink flex-row items-center gap-2` with an optional 16px muted icon and a
`h6` title; right side is either `meta` (`body-xs` muted) or an interactive
`action` node. `GroupLabel` renders the uppercase overline style.
**Every section title in the app goes through this component.**

### 11.11 `RouteCard` — the primary list object

```ts
{ item: NearbyRoute, onPress, showAccessDistance = true, drawDelay = 0 }
```

```
Tappable  className="border-border bg-surface gap-3 rounded-3xl border p-4"
          pressedScale={0.975} pressedLift={2} progress={press}
          accessibilityLabel="{route.name}. {subtitle}. Open route details."
├─ View className="flex-row items-center gap-3"
│  ├─ CategoryTile category muted={!isLive}
│  ├─ View className="flex-1 gap-0.5"
│  │  ├─ Typography type="h6" numberOfLines={1}      → route.name
│  │  └─ Typography type="body-xs" color="muted"     → "Van · 5 stops" / "Van · stops anywhere"
│  ├─ RoutePathPreview path muted={!isLive} live={isLive} drawDelay emphasis={press}
│  └─ AnimatedView (translateX: press * 4, opacity: 0.85 + press * 0.15)
│     └─ ChevronRight 18px muted
└─ View className="flex-row flex-wrap items-center gap-x-3 gap-y-2"
   ├─ StatusBadge isLive label="{n} running" | "Not running" | "No vehicles yet"
   ├─ IconStat Footprints  "{distance} away · {nearestStopName}"   (only when location known)
   ├─ IconStat Clock       formatDuration(route.estimatedDurationMinutes)
   └─ IconStat Wallet      "from Rs {n}"  colorHex={ICON_COLORS.fare} textClassName="text-fare font-medium"
```

The card never repeats "start → end", because the route name already contains
the corridor (e.g. "FAST ↔ F-10 Markaz"). The subtitle carries vehicle type +
stop behaviour instead.

### 11.12 `RoutePathPreview` — the SVG mini-diagram

```ts
{ path, muted = false, width = 56, drawDelay = 0, animate = true, emphasis?, live = false, className? }
```
Height 44. Projects the path into the box preserving proportions, then:

- faint full path at `strokeOpacity={0.18}` while progress < 1;
- traced path `strokeWidth={2.5 * scale}`, round caps and joins, progress from
  `useTimedProgress({ duration: 480, delay: drawDelay })`;
- start `Circle` in `MAP_COLORS.start`; end `Circle` scaled by
  `arrival = clamp((progress - 0.8) / 0.2)`, in `MAP_COLORS.end` — so the
  destination lands as the line completes;
- when `live`, a 14px `bg-live` halo behind the start dot pulses 1800ms
  (`opacity (1 - p) * 0.45`, `scale 0.5 + p * 1.3`);
- when the surrounding card is pressed, the whole diagram scales
  `1 + emphasis * 0.08`.

Muted variant strokes and dots in `MAP_COLORS.routeMuted`.

### 11.13 `RouteSearchField`

```ts
{ value, onChange, placeholder, focusedPlaceholder?, className?, onFocusChange? }
```
HeroUI `SearchField` with `Group` / `SearchIcon` / `Input` / `ClearButton`.
On focus: group gains `border-accent`, the field scales
`1 + focus * 0.015` (`SPRING_GLIDE`), the `Search` icon (18px) scales
`1 + focus * 0.14` (`SPRING_POP`) and switches from `muted` to `accent`, and the
placeholder swaps to the more specific `focusedPlaceholder`.
`returnKeyType="search"`.

### 11.14 `RouteSuggestions`

```ts
{ suggestions, onSelect }
```
Container: `AnimatedView` `entering={FadeIn(260)}` `exiting={FadeOut(160)}`
`className="border-border bg-surface overflow-hidden rounded-3xl border"`.
Each row is a `Reveal index distance={8}` wrapping a `Tappable`
(`pressedScale={1} pressedOpacity={1}`, `haptic="selection"`,
`hitSlop={{ top: 2, bottom: 2 }}`) whose highlight is an absolutely positioned
`bg-route-surface` overlay at `opacity = press`:

```
View className="flex-row items-center gap-3 px-4 py-3"
├─ View className="bg-route-surface h-8 w-8 items-center justify-center rounded-xl"
│  └─ MapPin (stop) | Navigation (sector) | Route (route)  15px accent
├─ View className="flex-1 gap-0.5"
│  ├─ body-sm with the matched substring as weight="bold" className="text-accent"
│  └─ body-xs muted → suggestion.detail
└─ Route 14px muted
divider: View className="bg-border ml-[60px] h-px"   (all but the last row)
```

### 11.15 `DirectionSwitch`

```ts
{ route, value, onChange }
```
Track `bg-surface-secondary relative flex-row rounded-2xl` with `padding: 6`,
`accessibilityRole="tablist"`. Thumb `bg-accent absolute rounded-xl`, inset by
the padding, width = segment width, `translateX = withSpring(index * segmentWidth, SPRING_GLIDE)`.
Each segment is a `Tappable` (`haptic="selection"`, `pressedScale={0.96}`,
`pressedOpacity={0.75}`, `hitSlop={{ top: 8, bottom: 8 }}`,
`className="min-h-11 flex-1 flex-row items-center justify-center gap-1.5 px-2 py-2.5"`)
showing origin → `ArrowRight` 13px → destination, all `body-xs semibold`,
`text-accent-foreground` when selected and `text-muted` when not.

### 11.16 `StopList`

```ts
{ route, direction, origin? }
```
Vertical rail: 4-wide gutter with a dot per row and a `bg-border w-0.5 flex-1`
connector below every row but the last.

| Row kind | Dot |
| --- | --- |
| start | `bg-live h-3.5 w-3.5 rounded-full` |
| end | `bg-danger h-3.5 w-3.5 rounded-full` |
| stop | `border-accent bg-background mt-0.5 h-2.5 w-2.5 rounded-full border-2` |

Content column `flex-1` with `pb-4` (last row `pb-0`): name `body-sm`
(`semibold` for start/end), an optional **"Closest"** pill
(`bg-route-surface flex-row items-center gap-1 rounded-full px-2 py-0.5`,
`Footprints` 11px in `MAP_COLORS.route`, `body-xs semibold text-accent`), and
`"{distance} from you"` in `body-xs muted` when the passenger's location is known.

### 11.17 `VendorRow`

```ts
{ route, vendor: RouteVendor, showFares = true }
```

```
Card > Card.Body className="gap-3 p-0"
├─ View className="flex-row items-start justify-between gap-3"
│  ├─ View className="flex-1 gap-0.5"
│  │  ├─ body semibold  → vendorName
│  │  └─ body-xs muted  → "{vehicleRegistration} · {vehicleDetails}"
│  └─ StatusBadge isLive
├─ if live: View className="bg-live-surface gap-0.5 rounded-xl px-3 py-2"
│  ├─ body-xs semibold text-live → directionLabel(route, journey.direction)
│  └─ IconStat Timer "Set off {n} min ago" colorHex={ICON_COLORS.live} textClassName="text-live"
├─ View className="flex-row flex-wrap items-center gap-x-4 gap-y-1"
│  ├─ IconStat Timer      "Their trip {duration}"
│  └─ IconStat Footprints "Stops at fixed points" | "Stops on request"
├─ if showFares: FareSlabTable slabs
└─ Button size="sm" variant={isLive ? 'primary' : 'tertiary'}
   PhoneCall 15px + "Call {contact}"   → Linking.openURL(`tel:` + digits)
```

No "fare from" line here when the fare table is shown.

### 11.18 `FareSlabTable`

```ts
{ slabs, highlightSlabId? }
```
`border-border overflow-hidden rounded-xl border`; each row
`flex-row items-center justify-between px-3.5 py-2.5`, `border-border border-t`
from the second row on, `bg-fare-surface` when it is the highlighted slab.
Left: range `body-sm muted`. Right: fare `body-sm semibold text-fare`.
Empty: **"This vendor has not shared fares yet."** (`body-sm muted`).

### 11.19 `FareSlabEditor`

```ts
{ initialSlabs, onChange }   // also exports parseFareRows
```
Rows are `Reveal index className="border-border gap-2 rounded-xl border p-3"`.
Header: label `body-xs semibold muted` reading **"From {n} km"**, or
**"{n} km and beyond"** on a final row with an empty upper bound; plus a
`ghost` **"Remove"** button (`X` 14px, `medium` haptic) on removable rows.
Body: two `flex-1 gap-1.5` columns — **"Up to (km)"** (`number-pad`, placeholder
`5`, or `End of route` on the last row) and **"Fare (Rs)"** (`number-pad`,
placeholder `100`). Both inputs strip non-digits. Footer: `tertiary` button
`Plus` 16px + **"Add another band"**.

### 11.20 `ChoiceRow`

```ts
{ label, hint?, options: { value, label, icon? }[], value, onChange }
```
`gap-2`; label `body-sm semibold`; optional hint `body-xs muted`; options in a
`flex-row flex-wrap gap-2` of HeroUI chips (`size="sm"`,
`variant={selected ? 'primary' : 'tertiary'}`, `color={selected ? 'accent' : 'default'}`),
each with an optional 13px icon and `accessibilityState.selected`,
`selection` haptic.

### 11.21 `EmptyState`

```ts
{ icon, title, description, actionLabel?, onAction?, secondaryActionLabel?, onSecondaryAction? }
```
`items-center gap-3 px-6 py-10`. Icon in a floating
`bg-route-surface h-16 w-16 items-center justify-center rounded-3xl` tile
(28px accent icon, `translateY: -p * 4` over 2400ms `Easing.inOut`, reversing).
Then a centred `h5` title, a `body-sm muted max-w-xs` description, a primary
`size="sm"` action and an optional `ghost` secondary action. Fade-only reveals
staggered at 0 / 60 / 100 / 140 / 180ms.

### 11.22 `RouteLoader`

```ts
{ label = 'Finding your fastest route…', className? }
```
`items-center justify-center gap-4 px-6`; a `w-full max-w-[220px] gap-3` track:
a 28px `bg-accent rounded-full` bubble with a white `Bus` icon (15px) sweeping
`translateX` across the track, a `bg-border h-0.5 w-full rounded-full` rail with
a `bg-accent` trail whose width follows the sweep, and four evenly spaced
`border-accent bg-background h-2 w-2 rounded-full border` stop dots.
Sweep: `withRepeat(withTiming(1, 1500ms, Easing.inOut), -1, false)`.
Label `body-sm muted` centred.

### 11.23 `MapView` (cross-platform)

One abstraction with a shared prop surface (`initialRegion`, `region`,
`markers`, `polylines`, `polygons`, `circles`, `showsUserLocation`,
`scrollEnabled`, `zoomEnabled`, `onPress`, `onMarkerPress`, `style`,
`className`, plus native-only and web-only extras) and an imperative handle
(`animateToRegion`, `animateCamera`, `fitToCoordinates`, `takeSnapshot`).
Screens import only this component — never the native map library directly,
which has no real web fallback.

Conventions in this app: height is set in `style` (not classes); the container is
a `border-border bg-surface-secondary overflow-hidden rounded-3xl border` card;
route polylines use `strokeWidth: 4`; controls float over the map as absolutely
positioned `Tappable`s.

### 11.24 `InstallPrompt` (web only)

A bottom-anchored `border-border bg-card absolute right-4 left-4 z-50 flex-row
items-center gap-3 rounded-lg border p-4 shadow-lg` card. Chrome variant:
**"Add to home screen"** / **"Install this app for a full-screen experience"**
with **"Not now"** and **"Install"**. iOS variant: same title,
**"Tap Share, then \"Add to Home Screen\" to install this app"**, with **"Got it"**
(dismissal persisted).

---

## 12. Screens

### 12.1 Explore — `app/(tabs)/index.tsx`

`headerShown: false`; the screen owns a gradient header that bleeds into the
status bar. On focus it flips the status bar to `light`, on blur back to `dark`.

Root `View className="bg-background flex-1"` containing a **FlatList**
(`data = nearby`, `keyExtractor = item.route.id`,
`contentContainerClassName={cn('gap-3 pb-10', CONTENT_COLUMN)}`,
`showsVerticalScrollIndicator={false}`, `keyboardShouldPersistTaps="handled"`,
`keyboardDismissMode="on-drag"`, `onScroll` at `scrollEventThrottle={16}`).

**List header** (`View className="gap-4"`):

1. Gradient hero, wrapped in an `AnimatedView` that collapses on scroll
   (`translateY: max(scrollY,0) * 0.22`, `scale: 1 - settled * 0.02`,
   `opacity: 1 - settled * 0.3`, `settled = clamp(scrollY, 0, 160) / 160`):

   ```
   LinearGradient colors={HERO_GRADIENT} start={{x:0,y:0}} end={{x:1,y:1}}
                  className="pt-safe-offset-4 gap-4 rounded-b-[32px] px-4 pb-6"
   ├─ View className="gap-1"
   │  ├─ View className="flex-row items-center gap-1.5"
   │  │  ├─ Radar 14px  color={ICON_COLORS.onBrandMint}
   │  │  └─ body-xs semibold "tracking-wide text-white uppercase" → "Transport near you"
   │  └─ Typography type="h3" className="text-white" → "Where are you going?"
   ├─ RouteSearchField className="bg-background"
   │     placeholder="Sector, stop or landmark"
   │     focusedPlaceholder="Where to? Sector, stop or landmark"
   └─ View className="flex-row flex-wrap items-center gap-2"
      ├─ Reveal distance={0} delay={80}  → HeroStat Zap   "{n} vehicles running"          tone="live"
      └─ Reveal distance={0} delay={140} → HeroStat Route "{n} routes within {r} km"      tone="neutral"
                                                          (or "{n} routes published")
   ```

   `HeroStat` = `View className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"`
   with `backgroundColor` `ON_BRAND_LIVE_SURFACE` (live) or `ON_BRAND_SURFACE`
   (neutral), a 13px icon in `onBrandMint` / `onBrand`, and
   `body-xs semibold text-white`.

2. `View className="gap-4 px-4"`:
   - `RouteSuggestions` (only while the field has focus).
   - Map card `border-border bg-surface-secondary overflow-hidden rounded-3xl border`:
     - `MapView` `style={{ width: '100%', height: mapExpanded ? 340 : 232 }}`,
       `region`, `showsUserLocation={status === 'granted'}`,
       `scrollEnabled`/`zoomEnabled` = `mapExpanded`, route polylines, markers,
       and a radius circle when the location is known
       (`radius: radiusKm * 1000`, `fillColor: MAP_COLORS.radiusFill`,
       `strokeColor: MAP_COLORS.radiusStroke`, `strokeWidth: 1.5`).
     - Top-right stack `absolute top-3 right-3 gap-2`: locate button
       (`LocateFixed` 19px, blue when granted else `routeMuted`, `medium` haptic,
       label "Update my location") and expand button (`Maximize2` 18px,
       `bg-accent border-accent` + white icon when expanded, label
       "Expand and pan the map" / "Shrink the map").
     - Radius pills `border-border bg-background absolute right-3 bottom-3 left-3
       flex-row items-center gap-1 rounded-full border p-1`: four `Tappable`s
       (1, 2, 5, 10 km), `pressedScale={0.93}`, `hitSlop={{ top: 8, bottom: 8 }}`,
       `min-h-9 flex-1 items-center justify-center rounded-full py-2`,
       `bg-accent` when selected, label `body-xs semibold`
       (`text-accent-foreground` / `text-muted`), text `"{n} km"`.
   - Location status:
     - loading → `bg-surface-secondary flex-row items-center gap-2 rounded-2xl px-4 py-3`
       with `Spinner size="sm"` and **"Finding your location…"**;
     - denied/unavailable → `Reveal` card
       `border-border bg-surface-secondary gap-3 rounded-2xl border p-4` with
       `MapPinOff` 18px in `MAP_COLORS.routeDraft`, **"Location is off"**,
       **"Distances to pickup points need your location. You can still browse
       every published route without it."**, and two `flex-1` buttons:
       **"Turn on location"** and `tertiary` **"Browse all"**.
   - `SectionHeader title="Routes you can catch"` with meta
     **"Running first, then nearest"** (or **"Running first"** without location).

**Rows:** `Reveal index animateLayout className="px-4"` wrapping `RouteCard`
with `showAccessDistance={coordinate !== null}` and
`drawDelay = min(index, 8) * 70`. Tap → `/route/[id]`.

**Empty states:**

| Case | Icon | Title | Description | Actions |
| --- | --- | --- | --- | --- |
| search returned nothing | `SearchX` | "No routes found" | "Try another sector or stop, or clear the search to see everything nearby." | "Clear search" |
| radius returned nothing | `MapPinOff` | "No routes within this radius" | "Nothing published near you yet. Widen the radius, or publish the route you run yourself." | "Widen to 10 km" (or "Browse all routes" at 10 km) + secondary "I run a route" |

**Sorting:** running vendors first (descending `activeVendorCount`), then nearest
(ascending `accessDistanceKm`).

### 12.2 Routes — `app/(tabs)/routes.tsx`

Standard header, title "Routes". FlatList,
`contentContainerClassName={cn('gap-3 px-4 pb-10', CONTENT_COLUMN)}`,
`keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`.

**List header** (`View className="gap-3 pt-3"`):

- `RouteSearchField` — placeholder **"Search routes, sectors or stops"**,
  focused **"Try a sector like F-10, or a stop name"**.
- `RouteSuggestions`.
- Horizontal `ScrollView` (`contentContainerClassName="gap-2 pr-4"`,
  `keyboardShouldPersistTaps="handled"`) of `FilterChip`s:
  **"Running now"** (`Zap`, `tone="success"`, toggles live-only), **"All types"**,
  then one chip per category with its icon.
- `SectionHeader` whose title is the pluralised count
  `"{n} route" / "{n} routes"` and whose `action` is a sort toggle: a `Tappable`
  (`pressedScale={0.94}`, `selection` haptic)
  `flex-row items-center gap-1.5 rounded-full border px-3 py-1.5` with
  `border-live-border bg-live-surface` when sorting by running, else
  `border-border bg-surface-secondary`; `ArrowUpDown` 12px muted plus
  `body-xs semibold` label **"Running first"** / **"A–Z"** (`text-live` /
  `text-muted`).

**Rows:** `Reveal index animateLayout` + `RouteCard` (same props as Explore).
Reordering after a filter or sort change animates via `LinearTransition(300ms)`.

**Empty:** `BusFront`, **"No routes found"**, **"Try another sector or stop, or
clear the filters to see every published route — including ones nobody is
running right now."**, action **"Clear filters"** (resets query, category, live-only).

**Pipeline:** `matchesQuery` → category filter → `describeRoute` → live-only
filter → sort (running first, then `localeCompare` on name).

### 12.3 Vendor — `app/(tabs)/vendor.tsx`

ScrollView, `contentContainerClassName={cn('gap-5 p-4', CONTENT_COLUMN)}`
(`pb-10` when signed in).

**Signed out:**

- `Card`: a `bg-route-surface h-12 w-12 items-center justify-center rounded-2xl`
  tile with `BusFront` 24px accent; `Card.Title` **"Publish the route you already
  run"**; `Card.Description` **"Wagon, van, coaster, shuttle — if you drive a
  fixed route every day, add it once and passengers nearby can find it. The
  transport isn't missing; the data is."**; `Card.Footer className="p-0 pt-4"`
  with **"Sign in as a vendor"** → `/vendor/sign-in`.
- `SectionHeader title="How it works"` then three
  `Surface variant="secondary" className="flex-row items-start gap-3"` rows,
  each with a `bg-accent h-6 w-6 items-center justify-center rounded-full` numeral
  (`body-xs bold text-accent-foreground`) and `body-sm flex-1` text:
  1. "Draw your route on the map, or join a route someone already published."
  2. "Add your vehicle, trip time and fare slabs."
  3. "Start a journey when you set off so passengers can see you are running."

**Signed in:**

- `View className="gap-1"`: **"Signed in as"** (`body-sm muted`) + account name (`h5`).
- Two action `Tappable`s
  (`border-border bg-surface flex-row items-center gap-3 rounded-3xl border p-4`):
  - `bg-route-surface` tile + `MapPlus` 22px accent — **"Create a new route"** /
    **"Draw the path you drive and publish it"** → `startCreate({ vendorName, contact })`
    then `/vendor/new/path`.
  - `bg-surface-secondary` tile + `PlusCircle` 22px muted — **"Join an existing
    route"** / **"Someone already added your route — add your vehicle to it"** →
    `/vendor/join`.
  Both end in `ArrowRight` 18px muted.
- `SectionHeader title="My routes"` with meta `"{n} registered"`.
- Empty: `Route` icon, **"No routes published yet"**, **"Add the route you run and
  it becomes searchable for passengers around you."**, action **"Create a route"**.
- Otherwise one `Reveal index` + `Card` per registration:
  - Row: `CategoryTile size="sm" muted={!live}`, name (`body semibold`,
    1 line), `"{vehicleRegistration} · from Rs {n}"` (`body-xs muted`, 1 line),
    `StatusBadge`.
  - When running: `bg-live-surface rounded-xl px-3 py-2` with the direction label
    (`body-xs semibold text-live`) and **"Running for {n} min"** (`body-xs text-live`).
  - Two `flex-1` buttons: **"Start journey"** / **"End journey"**
    (`primary` / `danger-soft`) → `/journey/[registrationId]`, and `tertiary`
    **"Manage"** → `/vendor/registration/[id]`.

### 12.4 Profile — `app/(tabs)/profile.tsx`

ScrollView, `contentContainerClassName={cn('gap-5 p-4 pb-10', CONTENT_COLUMN)}`.

- Account `Card`: `bg-route-surface h-12 w-12 items-center justify-center
  rounded-full` avatar with `UserRound` 24px accent; `h6` name or
  **"Browsing as passenger"**; `body-sm muted` phone or **"Sign in only if you
  operate transport"**. Footer (`gap-2 p-0 pt-4`): signed in → **"Sign out"**
  (`tertiary`) using the two-tap confirm (**"Yes, sign out"** + `Reveal distance={6}`
  ghost **"Stay signed in"**); signed out → **"Sign in as a vendor"**.
- Signed-in stats: `Surface variant="secondary" className="flex-row"` with three
  `flex-1` cells (`h5` value + `body-xs muted` label) separated by a vertical
  `Separator className="mr-3"`: **Routes created**, **Registrations**, **Journeys**.
- `SectionHeader title="About this app" icon={Info}` + `body-sm muted`
  **"Local vans, wagons and shuttles run fixed routes every day, but almost none
  of them exist online. Vendors publish the routes they already drive; passengers
  nearby can finally search them."** + `body-sm semibold text-accent`
  **"The transport isn't missing. The data is."**
- `SectionHeader title="Demo data" icon={Database}` + `body-sm muted`
  **"Routes, vendors and journeys are stored on this device. Resetting restores
  the seeded Islamabad routes and clears anything you published."** + a
  `danger-soft` → `danger` button with `RotateCcw` 16px in `ICON_COLORS.danger`,
  labels **"Reset demo data"** → **"Yes, reset everything"**, and a `Reveal`
  ghost **"Keep my data"**.

### 12.5 Route detail — `app/route/[id].tsx`

Header title is the route name (the name appears **only** in the header, never
repeated in the body). ScrollView,
`contentContainerClassName={cn('gap-5 p-4 pb-12', CONTENT_COLUMN)}`,
`keyboardShouldPersistTaps="handled"`.

1. `DirectionSwitch` — only for two-way routes. When it is visible there is no
   direction chip anywhere else on the screen.
2. `Reveal index={0}` → hero `Surface variant="secondary" className="gap-4 rounded-3xl"`:
   - `flex-row items-center gap-3`: `CategoryTile size="lg" className="bg-background"
     muted={activeVendors.length === 0}`, then `flex-1 gap-0.5` with the category
     label (`h6`) and a habits line (`body-xs muted`) reading
     `"{n} fixed stops"` or **"Picks up anywhere on the path"**, plus
     **"One-way only"** for one-way routes.
   - One `StatusBadge` — `"{n} running right now"` or **"Nobody running right
     now"**. This is the only status badge in the hero; sections do not repeat it.
   - `Separator`.
   - `flex-row gap-3` of three `StatTile`s: `Ruler` route length / **"Route
     length"**, `Clock` duration / **"Typical trip"**, `Wallet` fare or
     **"Not shared"** / **"Fare from"** (wallet tinted `ICON_COLORS.fare` when a
     fare exists).
3. `Reveal index={1}` → map card
   `border-border bg-surface-secondary overflow-hidden rounded-3xl border`:
   `MapView` at `height: mapExpanded ? 360 : 260`, region fitted to the path,
   polyline in `MAP_COLORS.route` (or `routeMuted` when nobody is running) at
   `strokeWidth: 4`, markers for origin (green), each stop (amber) and
   destination (red); floating `Maximize2` toggle
   `border-border absolute top-3 right-3 h-11 w-11 items-center justify-center
   rounded-full border` (+ `bg-accent border-accent` when expanded).
4. `Reveal index={2} className="gap-3"` → `SectionHeader title="Vehicles on this
   route"` with meta `"{n} registered"`, then:
   - no vendors → `EmptyState` `UserRoundX`, **"No vehicles registered yet"**,
     **"This route exists but nobody has attached a vehicle and fares to it."**,
     action **"I run this route"**;
   - otherwise running vendors first as `VendorRow`s; if none are running, a
     `Surface variant="secondary" className="gap-1 rounded-2xl"` reading
     **"Nothing on the road at this moment"** with **"Try the other direction, or
     call an operator below to ask when they set off."** (two-way) or **"Call an
     operator below to ask when they set off."** (one-way), followed by the idle
     vendors.
5. Stops section — `SectionHeader` **"Stops in order"** (or **"Route points"**)
   + `StopList route direction origin={coordinate}`.
6. Join prompt — `SectionHeader` **"Do you run this route too?"** + a `Card` with
   **"Add your vehicle and fares to this route instead of creating a duplicate."**
   and a `tertiary` **"Join this route"**: signed out → `/vendor/sign-in`;
   signed in → `startJoin(route.id, { vendorName, contact })` then
   `/vendor/new/vehicle`.

Not found (after hydration): `View className="bg-background flex-1 justify-center"`
+ `EmptyState` `SearchX`, **"Route not found"**, **"This route may have been
removed from this device."**, action **"Back to explore"** → `exitFlowTo('/')`.

### 12.6 Journey — `app/journey/[registrationId].tsx`

Header title **"Active journey"** or **"Start journey"**. ScrollView,
`contentContainerClassName={cn('gap-5 p-4 pb-10', CONTENT_COLUMN)}`.

- `View className="gap-1"`: vehicle registration (`body-sm muted`) + route name (`h5`).
- Running → `Card className="border-live bg-live-surface"`:
  `Radio` 16px `ICON_COLORS.live` + **"Running now"** (`body-sm semibold text-live`),
  the direction label (`h6`), and `Clock` 14px + **"Started {time} · {n} min ago"**
  (`body-sm text-live`).
- Not running → `View className="gap-3"`: **"Passengers only see you in live
  results while a journey is running. Pick the direction you are heading."**
  (`body-sm muted`), `DirectionSwitch`, and for one-way routes a
  `Surface variant="secondary"` showing the single direction plus **"This route
  runs one way only."**
- Map card `border-border overflow-hidden rounded-2xl border`, `height: 220`,
  polyline (`route` when running, `routeMuted` otherwise), start/end markers.
- Running → `danger-soft` → `danger` button **"End journey"** →
  **"Yes, end this journey"**, `Reveal distance={6}` ghost **"Keep running"**, and
  while unarmed the note **"Ending the journey removes you from live results."**
  (`body-xs muted text-center`). Commit: `endJourney(id)`, `success` haptic,
  `goBackOrReplace('/vendor')`.
- Not running → primary **"Start journey"** → `startJourney(registrationId,
  routeId, direction)`, `success` haptic, `goBackOrReplace('/vendor')`.

Not found: `EmptyState` `CircleOff`, **"Registration not found"**, **"This vehicle
is no longer registered on a route."**, action **"Back to my routes"** →
`exitFlowTo('/vendor')`.

### 12.7 Vendor sign in — `app/vendor/sign-in.tsx`

`KeyboardAvoidingView` (iOS `padding`) → ScrollView,
`contentContainerClassName={cn('gap-6 p-4', CONTENT_COLUMN)}`,
`keyboardShouldPersistTaps="handled"`.

- `bg-route-surface h-12 w-12 items-center justify-center rounded-2xl` tile with
  `BusFront` 24px accent; `h4` **"Vendor sign in"**; `body-sm muted`
  **"Passengers see your name and number on the routes you publish, so they know
  who is operating."**
- `TextField` **"Your name or company"**, placeholder **"e.g. Faizabad Wagon
  Service"**, `autoCapitalize="words"`, description **"Shown to passengers
  browsing the route."** — invalid when trimmed length < 2.
- `TextField` **"Phone number"**, placeholder **"03xx xxxxxxx"**,
  `keyboardType="phone-pad"`, description **"Used as your contact number on
  published routes."** — invalid when fewer than 10 digits.
- Button **"Continue"**: marks the form submitted; invalid → `warning` haptic and
  stop; valid → `signIn(name, phone)`, `success` haptic, `goBackOrReplace('/vendor')`.
- Footer note `body-xs muted text-center`: **"Demo sign in — details stay on this
  device and no code is sent."**

Errors surface as `isInvalid` on the fields only after the first submit attempt.

### 12.8 Join a route — `app/vendor/join.tsx`

ScrollView, `contentContainerClassName={cn('gap-4 p-4 pb-10', CONTENT_COLUMN)}`,
`keyboardShouldPersistTaps="handled"`.

- `h5` **"Find your route"** + `body-sm muted` **"If another vendor already added
  the route you drive, attach your vehicle to it instead of creating a
  duplicate."**
- `RouteSearchField` placeholder **"Search by area, stop or route name"**.
- Results as `RouteCard`s sorted by access distance; tap → signed out
  `/vendor/sign-in`, signed in `startJoin(routeId, …)` + `/vendor/new/vehicle`.
- Empty: `RouteOff`, **"No matching route"**, **"Nothing published matches that
  search yet. Create the route instead and passengers will find it."**, action
  **"Create a new route"** (`startCreate` then `router.replace('/vendor/new/path')`).

### 12.9 Vendor wizard

Four steps when creating, two when joining. Every step: `KeyboardAvoidingView`
(iOS `padding`) → ScrollView, `keyboardShouldPersistTaps="handled"`,
`contentContainerClassName={cn('gap-5 p-4 pb-6', CONTENT_COLUMN)}`; a step
counter in `body-xs muted` and an `h5` title; a disabled primary button whose
label states what is missing.

**Step 1 — Draw route (`vendor/new/path.tsx`)** — the one screen that is not a
single scroll column, because the map must stay interactive:

- Header block `gap-1 px-4 pt-3 pb-3`: **"Step 1 of 4"**, **"Tap the map to trace
  your route"**, **"Start where you pick up, tap through the areas you pass, and
  finish at your last drop-off."**
- Map `border-border mx-4 overflow-hidden rounded-2xl border`, `height: 260`,
  region from `regionForRadius(coordinate ?? ISLAMABAD_CENTER, 5)`, fully
  interactive, `onPress` adds a waypoint (`light` haptic). Draft polyline in
  `MAP_COLORS.routeDraft` at `strokeWidth: 4`; markers green start, red end,
  amber middles.
- Toolbar `flex-row items-center justify-between gap-2 px-4 py-3`:
  `"{n} points · {distance}"` or **"No points yet"** (`body-xs muted`), and
  `tertiary size="sm"` buttons **"My location"** (`MapPin` 14px, only with a
  fix), **"Undo"** (`Undo2`), **"Clear"** (`Trash2`) — the latter two disabled
  while empty.
- Naming list (`ScrollView className="flex-1"`,
  `contentContainerClassName="gap-3 px-4 pb-4"`): empty →
  `Surface variant="secondary"` **"Tap the map to add your first pick-up point.
  You can name the middle points to turn them into stops passengers can
  search."**; otherwise one `Reveal index className="gap-1.5"` per waypoint with
  a `body-xs semibold muted` role label **"Start"** / **"End"** /
  **"Stop {n} (optional name)"** and an `Input` (`autoCapitalize="words"`)
  placeholdered **"e.g. Faizabad"**, **"e.g. F-10 Markaz"**, **"e.g. G-9 Karachi
  Company"**.
- Sticky footer `border-border bg-background pb-safe-offset-4 border-t px-4 pt-3`
  with the continue button labelled **"Add at least two points"** → **"Name the
  start and end points"** → **"Continue"**. Valid when there are ≥ 2 waypoints and
  both endpoints are named (> 1 char). Named middles become searchable stops.

**Step 2 — Describe the route (`vendor/new/details.tsx`)**

- **"Step 2 of 4"**, **"Describe the route"**.
- `Surface variant="secondary" className="gap-1"` summary:
  `"{startName} → {endName}"` (`body-sm semibold`) and
  `"{distance} · {n} points · {n} named stops"` (`body-xs muted`).
- `TextField` **"Route name"**, placeholder **"e.g. Faizabad → F-10"**,
  description **"How passengers will see this route in search results."**
- `ChoiceRow` **"Vehicle type"** (all seven categories with icons).
- `ChoiceRow` **"Direction"**, hint **"Two-way routes let passengers view the
  return trip too."**, options **"Both directions"** / **"One direction only"**.
- `ChoiceRow` **"Pick-up style"**, hint **"Choose flexible if you stop wherever
  passengers wave you down."**, options **"Fixed stops"** / **"Stops anywhere"**.
- `TextField` **"Typical trip time (minutes)"**, placeholder **"25"**,
  `number-pad`, digits only, description **"End to end, in normal traffic."**
- **"Continue"** — valid when the name is longer than 2 characters and the
  duration parses above zero.

**Step 3 — Your vehicle (`vendor/new/vehicle.tsx`)**

- Step counter **"Step 3 of 4"** or **"Step 1 of 2"** when joining; title
  **"Your vehicle"**; when joining, a `Surface variant="secondary"` showing
  **"Joining route"** + the route name.
- Fields: **"Vendor name"** (`e.g. Faizabad Wagon Service`, words);
  **"Contact number"** (`03xx xxxxxxx`, phone pad, description **"Passengers may
  call to check if you are running."**); **"Vehicle registration"**
  (`e.g. ICT-1234`, `autoCapitalize="characters"`); **"Vehicle description"**
  (`e.g. White Hiace, 14 seats`, description **"Optional, but it helps passengers
  recognise you."**); **"Your trip time (minutes)"** (`25`, digits only).
- **"Continue to fares"** — valid when the vendor name is > 1 char, contact has
  ≥ 10 digits, registration is > 2 chars and the duration parses above zero.

**Step 4 — Fares (`vendor/new/fares.tsx`)**

- **"Step 4 of 4"** / **"Step 2 of 2"**, **"Fares by distance"**, and
  **"Passengers see the band that matches their trip, so short hops and long
  rides both look right."**
- `FareSlabEditor`.
- `Surface variant="secondary" className="gap-1.5"` review block: **"Publishing"**
  (`body-xs semibold muted`), the route name (`body semibold`), a category ·
  distance · stops line, and a vehicle line
  `"{registration} · {details} · {duration}"` (both `body-xs muted`).
- Invalid → `body-xs text-danger` **"Every band needs a fare above zero."**
- Button **"Publish route"** (or **"Add my vehicle to this route"** when joining):
  creates the route when in create mode, adds the registration, resets the draft,
  `success` haptic, then `exitFlowTo('/vendor')`.

### 12.10 Manage registration — `app/vendor/registration/[id].tsx`

Header title is the vehicle registration. `KeyboardAvoidingView` → ScrollView,
`contentContainerClassName={cn('gap-5 p-4 pb-10', CONTENT_COLUMN)}`,
`keyboardShouldPersistTaps="handled"`.

- `View className="gap-2"`: `StatusBadge`, route name (`h5`), and
  `"{category} · {length} · {duration}"` (`body-sm muted`).
- Running → `Surface variant="secondary" className="gap-1"` with the direction
  (`body-sm semibold text-live`) and **"Passengers can see this vehicle in live
  results right now."**
- Two `flex-1` buttons: **"Start journey"** / **"End journey"**
  (`primary` / `danger-soft`) → `/journey/[registrationId]`, and `tertiary`
  **"View as passenger"** → `/route/[id]`.
- `Separator`, then editable fields — **"Contact number"** (phone pad),
  **"Vehicle description"** (`e.g. White Hiace, 14 seats`), **"Trip time
  (minutes)"** (digits only, description **"Shown to passengers as your typical
  end-to-end time."**), and a **"Fares"** block (`body-sm semibold`) wrapping
  `FareSlabEditor`. Any edit clears the saved flag.
- Button **"Save changes"** → **"Saved"** (disabled while invalid or already
  saved); `success` haptic on save.
- `Separator`, then **"Remove from this route"** (`body-sm semibold`) with
  **"Your vehicle and fares are deleted. The route itself stays published for
  other vendors."** (`body-xs muted`) and the two-tap confirm
  **"Remove my vehicle"** → **"Yes, remove my vehicle"** plus a `Reveal` ghost
  **"Cancel"**. Commit: `removeRegistration(id)`, `success` haptic,
  `exitFlowTo('/vendor')`.

### 12.11 Not found — `app/+not-found.tsx`

Title **"Oops!"**, **"This screen doesn't exist."**, and a link
**"Go to home screen!"** → `/`.

---

## 13. Content rules (anti-redundancy)

These rules keep the screens from repeating themselves. They matter as much as
the visual tokens.

1. **A route name already contains the corridor** ("FAST ↔ F-10 Markaz"), so cards
   never print `start → end` again. The subtitle carries vehicle type + stop
   behaviour.
2. **The route name appears only in the navigation header** on the detail screen.
3. **One status badge per surface.** Route detail shows it in the hero and never
   again per section.
4. **No direction chip while `DirectionSwitch` is visible.** One-way is stated in
   the hero subtitle instead.
5. **No "fare from" line in a vendor row when the fare table is shown.**
6. **Status wording is always "running"**, never "operating".
7. **An icon never appears without its label.**
8. Action labels are short and literal ("Manage", "Continue", "Call {number}").
   Error copy is human — no stack traces, no jargon.
9. Disabled primary buttons state the missing requirement rather than staying mute.

---

## 14. Rebuild order

1. Install dependencies; set up Expo Router with the root stack + tabs shell.
2. Paste the colour tokens into `global.css`, mirror the native hexes, load Inter,
   lock the theme to light.
3. Add the motion constants, `Tappable`, `Reveal`, `TabBarIcon`,
   `HeaderBackButton` + fallback table, `SectionHeader`, `CategoryTile`,
   `StatusBadge`, `Stat`.
4. Add the types, three stores, geometry/format helpers, transport helpers and
   the search builder. Gate the app on store hydration; mount one location
   provider with a timeout.
5. Build `RoutePathPreview`, `RouteCard`, `RouteSearchField`,
   `RouteSuggestions`, `DirectionSwitch`, `StopList`, `FareSlabTable`,
   `FareSlabEditor`, `ChoiceRow`, `EmptyState`, `RouteLoader`, the `MapView`
   abstraction.
6. Create every route file so the app boots, then fill screens in this order:
   Explore, Routes, route detail, Vendor, wizard, journey, manage, Profile.
7. Apply the interaction rules (section 7) and the content rules (section 13) as
   a pass over the finished screens.
8. Lint and type-check; fix at the root cause.

### Porting note

If the target project has its own backend, the only places that need rewiring
are the store reads and writes listed in section 9 — the layout, tokens,
components and motion are backend-agnostic. Swap `useTransportStore`,
`useSessionStore` and `useRouteDraftStore` for the equivalent queries and
mutations, keep the derived helpers (`describeRoute`, `vendorsForRoute`,
`matchesQuery`, the `geo` formatters) as pure functions over whatever shape the
API returns, and leave every screen's markup untouched.
