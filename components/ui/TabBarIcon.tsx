import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const FOCUS_SPRING = { damping: 14, stiffness: 260, mass: 0.5 } as const;

interface TabBarIconProps {
  icon: LucideIcon;
  color: string;
  size: number;
  focused: boolean;
}

/**
 * Tab icon that lifts and scales as it becomes active, so switching tabs reads
 * as a response rather than an instant colour swap.
 */
export function TabBarIcon({ icon: Icon, color, size, focused }: TabBarIconProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, FOCUS_SPRING);
  }, [focused, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.14 }, { translateY: progress.value * -2 }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon color={color} size={size} />
    </Animated.View>
  );
}
