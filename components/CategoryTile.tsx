import { View } from 'react-native';
import { useThemeColor } from 'heroui-native';

import { cn } from '@/lib/utils';
import { categoryIcon } from '@/lib/categories';
import { categoryLabel } from '@/lib/types';
import type { RouteCategory } from '@/lib/types';

interface CategoryTileProps {
  category: RouteCategory;
  size?: 'sm' | 'md' | 'lg';
  /** Dimmed styling for routes nobody is running. */
  muted?: boolean;
  className?: string;
}

const TILE_SIZES = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
} as const;

const ICON_SIZES = { sm: 17, md: 21, lg: 26 } as const;

/** The visual anchor for a route: what kind of vehicle runs it. */
export function CategoryTile({
  category,
  size = 'md',
  muted = false,
  className,
}: CategoryTileProps) {
  const [accent, mutedColor] = useThemeColor(['accent', 'muted']);
  const Icon = categoryIcon(category);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={categoryLabel(category)}
      className={cn(
        'items-center justify-center',
        TILE_SIZES[size],
        muted ? 'bg-surface-secondary' : 'bg-route-surface',
        className,
      )}
    >
      <Icon color={muted ? mutedColor : accent} size={ICON_SIZES[size]} />
    </View>
  );
}
