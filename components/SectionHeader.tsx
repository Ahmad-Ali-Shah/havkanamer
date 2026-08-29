import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Typography, useThemeColor } from 'heroui-native';

import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  /** Short right-aligned hint: a count, a sort order, a unit. */
  meta?: string;
  icon?: LucideIcon;
  className?: string;
}

/** One section title pattern across every screen. */
export function SectionHeader({ title, meta, icon: Icon, className }: SectionHeaderProps) {
  const [muted] = useThemeColor(['muted']);

  return (
    <View className={cn('flex-row items-center justify-between gap-3', className)}>
      <View className="flex-shrink flex-row items-center gap-2">
        {Icon ? <Icon color={muted} size={16} /> : null}
        <Typography type="h6" numberOfLines={1}>
          {title}
        </Typography>
      </View>
      {meta ? (
        <Typography type="body-xs" color="muted" numberOfLines={1}>
          {meta}
        </Typography>
      ) : null}
    </View>
  );
}

/** Quiet label that groups rows inside a section. */
export function GroupLabel({ children }: { children: string }) {
  return (
    <Typography type="body-xs" weight="semibold" color="muted" className="tracking-wide uppercase">
      {children}
    </Typography>
  );
}
