import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Button, Typography, useThemeColor } from 'heroui-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Reveal } from '@/components/ui/Reveal';

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
  const float = useSharedValue(0);

  // A dead end still needs a pulse, or the screen reads as a failed load.
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(float);
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -float.value * 4 }],
  }));

  return (
    <View className="items-center gap-3 px-6 py-10">
      <Reveal distance={0}>
        <AnimatedView
          className="bg-route-surface h-16 w-16 items-center justify-center rounded-3xl"
          style={floatStyle}
        >
          <Icon color={accent} size={28} />
        </AnimatedView>
      </Reveal>
      <Reveal delay={60}>
        <Typography type="h5" align="center">
          {title}
        </Typography>
      </Reveal>
      <Reveal delay={100}>
        <Typography type="body-sm" color="muted" align="center" className="max-w-xs">
          {description}
        </Typography>
      </Reveal>
      {actionLabel && onAction ? (
        <Reveal delay={140}>
          <Button size="sm" onPress={onAction} className="mt-1">
            <Button.Label>{actionLabel}</Button.Label>
          </Button>
        </Reveal>
      ) : null}
      {secondaryActionLabel && onSecondaryAction ? (
        <Reveal delay={180}>
          <Button size="sm" variant="ghost" onPress={onSecondaryAction}>
            <Button.Label>{secondaryActionLabel}</Button.Label>
          </Button>
        </Reveal>
      ) : null}
    </View>
  );
}
