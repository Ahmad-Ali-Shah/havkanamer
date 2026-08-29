import {
  Bus,
  BusFront,
  Caravan,
  CarTaxiFront,
  GraduationCap,
  Route as RouteIcon,
  Truck,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

import { ROUTE_CATEGORIES } from '@/lib/types';
import type { RouteCategory } from '@/lib/types';

/**
 * One symbolic vehicle silhouette per category. The icon always travels with
 * its written label so the symbol teaches itself on first use.
 */
const CATEGORY_ICONS: Record<RouteCategory, LucideIcon> = {
  wagon: Truck,
  van: Caravan,
  coaster: Bus,
  rickshaw: CarTaxiFront,
  shuttle: BusFront,
  university: GraduationCap,
  other: RouteIcon,
};

export function categoryIcon(category: RouteCategory): LucideIcon {
  return CATEGORY_ICONS[category];
}

export interface CategoryOption {
  value: RouteCategory;
  label: string;
  icon: LucideIcon;
}

/** Filter/selection options, derived so labels never drift from the icons. */
export const CATEGORY_OPTIONS: CategoryOption[] = ROUTE_CATEGORIES.map((option) => ({
  ...option,
  icon: CATEGORY_ICONS[option.value],
}));
