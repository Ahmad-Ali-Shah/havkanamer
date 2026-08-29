import { useCallback } from 'react';
import { BackHandler, Platform, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Typography, useThemeColor } from 'heroui-native';

import { Tappable } from '@/components/ui/Tappable';
import { goBackOrReplace, type BackFallbackRoute, BACK_FALLBACKS } from '@/lib/navigation';

interface HeaderBackButtonProps {
  /** Route this button sits on; decides where to land with no history. */
  route: BackFallbackRoute;
  label?: string;
}

/**
 * Header back control that always resolves somewhere.
 *
 * The platform default is skipped on purpose: it renders nothing when the
 * screen was opened directly (deep link, web reload), which is exactly the case
 * where a user needs it most.
 */
export function HeaderBackButton({ route, label = 'Back' }: HeaderBackButtonProps) {
  const [foreground] = useThemeColor(['foreground']);
  const fallback = BACK_FALLBACKS[route];

  const goBack = useCallback(() => {
    goBackOrReplace(fallback);
  }, [fallback]);

  // Android's hardware back has the same "no history" problem, so it shares the
  // resolved destination rather than dropping the user out of the app.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBack();
        return true;
      });
      return () => subscription.remove();
    }, [goBack]),
  );

  return (
    <Tappable
      onPress={goBack}
      haptic="selection"
      hitSlop={16}
      pressedScale={0.9}
      accessibilityLabel={label}
      className="-ml-1 flex-row items-center gap-0.5 py-2 pr-2 pl-1"
    >
      <ChevronLeft color={foreground} size={24} />
      <Typography type="body" weight="medium">
        {label}
      </Typography>
    </Tappable>
  );
}

/**
 * Registers only the Android hardware-back override, for screens that keep the
 * platform header but still need a safe destination.
 */
export function useSafeHardwareBack(route: BackFallbackRoute) {
  const fallback = BACK_FALLBACKS[route];

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goBackOrReplace(fallback);
        return true;
      });
      return () => subscription.remove();
    }, [fallback]),
  );
}

/** Spacer that keeps a custom header title optically centred next to the back button. */
export function HeaderSpacer() {
  return <View className="w-2" />;
}
