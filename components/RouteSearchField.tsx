import { useEffect, useState } from 'react';
import { Search } from 'lucide-react-native';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SearchField, useThemeColor } from 'heroui-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { SPRING_GLIDE, SPRING_POP } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface RouteSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** More specific prompt once the field has focus and the keyboard is up. */
  focusedPlaceholder?: string;
  /** Lets the field sit on a coloured header without losing contrast. */
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

/** Shared search input so Explore and Routes stay identical. */
export function RouteSearchField({
  value,
  onChange,
  placeholder,
  focusedPlaceholder,
  className,
  onFocusChange,
}: RouteSearchFieldProps) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  useEffect(() => {
    focus.value = withSpring(focused ? 1 : 0, SPRING_GLIDE);
  }, [focused, focus]);

  // A touch wider and taller while active, so the field visibly takes over.
  const fieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.015 }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 + focus.value * 0.14, SPRING_POP) }],
  }));

  const handleFocus = (next: boolean) => {
    setFocused(next);
    onFocusChange?.(next);
  };

  return (
    <AnimatedView style={fieldStyle}>
      <SearchField value={value} onChange={onChange}>
        <SearchField.Group className={cn(className, focused && 'border-accent')}>
          <SearchField.SearchIcon>
            <AnimatedView style={iconStyle}>
              <Search color={focused ? accent : muted} size={18} />
            </AnimatedView>
          </SearchField.SearchIcon>
          <SearchField.Input
            placeholder={focused ? (focusedPlaceholder ?? placeholder) : placeholder}
            returnKeyType="search"
            onFocus={() => handleFocus(true)}
            onBlur={() => handleFocus(false)}
          />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </AnimatedView>
  );
}
