import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Chip, useThemeColor } from 'heroui-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { tapFeedback } from '@/lib/haptics';
import { ICON_COLORS } from '@/lib/mapTheme';
import { SPRING_POP } from '@/lib/motion';

interface FilterChipProps {
  label: string;
  icon?: LucideIcon;
  isSelected: boolean;
  onPress: () => void;
  /** Success tone marks the live filter, matching the green half of the brand. */
  tone?: 'accent' | 'success';
}

/**
 * A filter chip that confirms the tap before the list beneath it has finished
 * rearranging. Selection is the moment worth marking, so the chip pops when it
 * becomes active and stays still when it is switched off.
 */
export function FilterChip({
  label,
  icon: Icon,
  isSelected,
  onPress,
  tone = 'accent',
}: FilterChipProps) {
  const [accentForeground, muted] = useThemeColor(['accent-foreground', 'muted']);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (!isSelected) return;
    pop.value = withSequence(withTiming(1, { duration: 110 }), withSpring(0, SPRING_POP));
  }, [isSelected, pop]);

  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pop.value * 0.07 }],
  }));

  const selectedIconColor = tone === 'success' ? ICON_COLORS.onBrand : accentForeground;

  return (
    <AnimatedView style={popStyle}>
      <Chip
        size="sm"
        variant={isSelected ? 'primary' : 'tertiary'}
        color={isSelected ? tone : 'default'}
        onPress={() => {
          tapFeedback('selection');
          onPress();
        }}
        accessibilityState={{ selected: isSelected }}
      >
        {Icon ? <Icon color={isSelected ? selectedIconColor : muted} size={13} /> : null}
        <Chip.Label>{label}</Chip.Label>
      </Chip>
    </AnimatedView>
  );
}
