import { MapPin, Navigation, Route as RouteIcon } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { FadeIn, FadeOut, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Typography, useThemeColor } from 'heroui-native';

import { AnimatedView } from '@/components/ui/primitives/AnimatedView';
import { Reveal } from '@/components/ui/Reveal';
import { Tappable } from '@/components/ui/Tappable';
import { MOTION_DURATION } from '@/lib/motion';
import type { Suggestion, SuggestionKind } from '@/lib/search';

const KIND_ICON: Record<SuggestionKind, LucideIcon> = {
  stop: MapPin,
  sector: Navigation,
  route: RouteIcon,
};

interface RouteSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
}

/** One row, with the typed text picked out inside the label. */
function SuggestionRow({
  suggestion,
  onSelect,
  isLast,
}: {
  suggestion: Suggestion;
  onSelect: (suggestion: Suggestion) => void;
  isLast: boolean;
}) {
  const [accent, muted] = useThemeColor(['accent', 'muted']);
  const press = useSharedValue(0);
  const Icon = KIND_ICON[suggestion.kind];

  const highlightStyle = useAnimatedStyle(() => ({ opacity: press.value }));

  const before = suggestion.label.slice(0, suggestion.matchStart);
  const match = suggestion.label.slice(
    suggestion.matchStart,
    suggestion.matchStart + suggestion.matchLength,
  );
  const after = suggestion.label.slice(suggestion.matchStart + suggestion.matchLength);

  return (
    <Tappable
      onPress={() => onSelect(suggestion)}
      haptic="selection"
      pressedScale={1}
      pressedOpacity={1}
      progress={press}
      accessibilityLabel={`${suggestion.label}. ${suggestion.detail}.`}
      hitSlop={{ top: 2, bottom: 2 }}
      className="overflow-hidden"
    >
      {/* Confirms the choice for a beat before the list closes. */}
      <AnimatedView
        pointerEvents="none"
        className="bg-route-surface absolute inset-0"
        style={highlightStyle}
      />

      <View className="flex-row items-center gap-3 px-4 py-3">
        <View className="bg-route-surface h-8 w-8 items-center justify-center rounded-xl">
          <Icon color={accent} size={15} />
        </View>

        <View className="flex-1 gap-0.5">
          <Typography type="body-sm" numberOfLines={1}>
            {before}
            <Typography type="body-sm" weight="bold" className="text-accent">
              {match}
            </Typography>
            {after}
          </Typography>
          <Typography type="body-xs" color="muted" numberOfLines={1}>
            {suggestion.detail}
          </Typography>
        </View>

        <RouteIcon color={muted} size={14} />
      </View>

      {!isLast ? <View className="bg-border ml-[60px] h-px" /> : null}
    </Tappable>
  );
}

/**
 * Results that rise into place under the search field while the passenger is
 * still typing, so the field feels like it is answering rather than waiting for
 * a submit that this app does not have.
 */
export function RouteSuggestions({ suggestions, onSelect }: RouteSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <AnimatedView
      entering={FadeIn.duration(MOTION_DURATION.enter)}
      exiting={FadeOut.duration(160)}
      className="border-border bg-surface overflow-hidden rounded-3xl border"
    >
      {suggestions.map((suggestion, index) => (
        <Reveal key={suggestion.key} index={index} distance={8}>
          <SuggestionRow
            suggestion={suggestion}
            onSelect={onSelect}
            isLast={index === suggestions.length - 1}
          />
        </Reveal>
      ))}
    </AnimatedView>
  );
}
