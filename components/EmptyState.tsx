import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { Button, Typography, useThemeColor } from 'heroui-native';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const [accent] = useThemeColor(['accent']);

  return (
    <View className="items-center gap-3 px-6 py-10">
      <View className="bg-route-surface h-16 w-16 items-center justify-center rounded-3xl">
        <Icon color={accent} size={28} />
      </View>
      <Typography type="h5" align="center">
        {title}
      </Typography>
      <Typography type="body-sm" color="muted" align="center" className="max-w-xs">
        {description}
      </Typography>
      {actionLabel && onAction ? (
        <Button size="sm" onPress={onAction} className="mt-1">
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Button size="sm" variant="ghost" onPress={onSecondaryAction}>
          <Button.Label>{secondaryActionLabel}</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
