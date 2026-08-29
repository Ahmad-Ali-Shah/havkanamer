import { View } from 'react-native';
import { Typography } from 'heroui-native';

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  isLive: boolean;
  /** Overrides the default "Operating now" / "Not operating" copy. */
  label?: string;
  className?: string;
}

/**
 * Journey status. Uses the dedicated live/idle tokens rather than the brand
 * accent so "operating now" never reads as decoration.
 */
export function StatusBadge({ isLive, label, className }: StatusBadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 self-start rounded-full border px-2.5 py-1',
        isLive ? 'border-live-border bg-live-surface' : 'border-idle-border bg-idle-surface',
        className,
      )}
    >
      <View className={cn('h-2 w-2 rounded-full', isLive ? 'bg-live' : 'bg-idle')} />
      <Typography type="body-xs" weight="semibold" className={isLive ? 'text-live' : 'text-idle'}>
        {label ?? (isLive ? 'Operating now' : 'Not operating')}
      </Typography>
    </View>
  );
}
