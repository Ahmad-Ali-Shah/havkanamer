import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';

import { cn } from '@/lib/utils';

interface IconStatProps {
  icon: LucideIcon;
  label: string;
  /** Native colour for the icon; defaults to the muted foreground. */
  colorHex?: string;
  /** Text colour class, used when the stat needs emphasis (live, fare). */
  textClassName?: string;
  className?: string;
}

/** Inline "icon + value" fact, used in list rows and meta strips. */
export function IconStat({ icon: Icon, label, colorHex, textClassName, className }: IconStatProps) {
  const [muted] = useThemeColor(['muted']);

  return (
    <View className={cn('flex-row items-center gap-1.5', className)}>
      <Icon color={colorHex ?? muted} size={14} />
      <Typography
        type="body-xs"
        color={colorHex || textClassName ? undefined : 'muted'}
        className={textClassName}
        numberOfLines={1}
      >
        {label}
      </Typography>
    </View>
  );
}

interface StatTileProps {
  icon: LucideIcon;
  value: string;
  label: string;
  colorHex?: string;
  valueClassName?: string;
}

/** Stacked stat for the 3-up summary grid on a route. */
export function StatTile({ icon: Icon, value, label, colorHex, valueClassName }: StatTileProps) {
  const [muted] = useThemeColor(['muted']);

  return (
    <View className="flex-1 gap-1">
      <Icon color={colorHex ?? muted} size={16} />
      <Typography type="body" weight="semibold" numberOfLines={1} className={valueClassName}>
        {value}
      </Typography>
      <Typography type="body-xs" color="muted" numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}
