// oxlint-disable-next-line eslint-plugin-import/no-unassigned-import
import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, View } from 'react-native';
import { useEffect, useMemo } from 'react';
import * as DevClient from 'expo-dev-client';
import { HeroUINativeProvider, useThemeColor } from 'heroui-native';
import { Uniwind } from 'uniwind';
import {
  ErrorBoundary as ExpoErrorBoundary,
  type ErrorBoundaryProps,
  SplashScreen,
  Stack,
} from 'expo-router';

import { initPostHog } from '@/lib/posthog';
import { registerServiceWorker } from '@/lib/registerServiceWorker';
import { reportErrorToParent } from '@/lib/reportPreviewError';
import { InstallPrompt } from '@/components/InstallPrompt';
import { HeaderBackButton } from '@/components/ui/HeaderBackButton';
import { LocationProvider } from '@/hooks/useCurrentLocation';
import { useStoresHydrated } from '@/lib/store';

/**
 * Custom ErrorBoundary that reports React render errors to the parent window (Bilt preview iframe)
 * and then renders the default Expo error UI.
 */
function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (Platform.OS === 'web' && error) {
      const message = [error.message, error.stack].filter(Boolean).join('\n');
      reportErrorToParent(message);
    }
  }, [error]);
  return <ExpoErrorBoundary error={error} retry={retry} />;
}

export { ErrorBoundary };

// Starter is light-only by default. Remove this when implementing requested dark mode.
Uniwind.setTheme('light');

void SplashScreen.preventAutoHideAsync();

function AppSplash() {
  return <View className="bg-background flex-1" />;
}

/**
 * Themed stack. Every pushed screen gets an explicit back control rather than
 * the platform default, which renders nothing when the screen was opened
 * directly and leaves the user stranded.
 */
function RootNavigator() {
  const [background, foreground] = useThemeColor(['background', 'foreground']);

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: background },
      headerTintColor: foreground,
      headerTitleStyle: { color: foreground, fontWeight: '600' as const },
      headerShadowVisible: false,
      headerBackVisible: false,
      contentStyle: { backgroundColor: background },
      animation: 'slide_from_right' as const,
      animationDuration: 260,
    }),
    [background, foreground],
  );

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="route/[id]"
        options={{
          title: 'Route',
          headerLeft: () => <HeaderBackButton route="route/[id]" label="Explore" />,
        }}
      />
      <Stack.Screen
        name="vendor/sign-in"
        options={{
          title: 'Vendor sign in',
          headerLeft: () => <HeaderBackButton route="vendor/sign-in" />,
        }}
      />
      <Stack.Screen
        name="vendor/join"
        options={{
          title: 'Join a route',
          headerLeft: () => <HeaderBackButton route="vendor/join" />,
        }}
      />
      <Stack.Screen
        name="vendor/new/path"
        options={{
          title: 'Draw route',
          headerLeft: () => <HeaderBackButton route="vendor/new/path" label="Cancel" />,
        }}
      />
      <Stack.Screen
        name="vendor/new/details"
        options={{
          title: 'Route details',
          headerLeft: () => <HeaderBackButton route="vendor/new/details" />,
        }}
      />
      <Stack.Screen
        name="vendor/new/vehicle"
        options={{
          title: 'Vehicle details',
          headerLeft: () => <HeaderBackButton route="vendor/new/vehicle" />,
        }}
      />
      <Stack.Screen
        name="vendor/new/fares"
        options={{
          title: 'Fares',
          headerLeft: () => <HeaderBackButton route="vendor/new/fares" />,
        }}
      />
      <Stack.Screen
        name="vendor/registration/[id]"
        options={{
          title: 'My route',
          headerLeft: () => <HeaderBackButton route="vendor/registration/[id]" />,
        }}
      />
      <Stack.Screen
        name="journey/[registrationId]"
        options={{
          title: 'Journey',
          headerLeft: () => <HeaderBackButton route="journey/[registrationId]" />,
        }}
      />
    </Stack>
  );
}

function AppContent() {
  // Persisted state arrives asynchronously. Rendering before it lands makes a
  // signed-in vendor look signed out and turns valid detail routes into
  // "not found" screens.
  const hydrated = useStoresHydrated();

  if (!hydrated) return <AppSplash />;

  return (
    <LocationProvider>
      <RootNavigator />
      <InstallPrompt />
    </LocationProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Report uncaught JS errors and unhandled promise rejections to parent (Bilt preview iframe)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const handleError = (event: ErrorEvent) => {
      const message = event.error?.stack ?? event.message ?? 'Unknown error';
      reportErrorToParent(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const err = event.reason;
      const message =
        err instanceof Error ? [err.message, err.stack].filter(Boolean).join('\n') : String(err);
      reportErrorToParent(message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Inject Google Fonts link tag for web to ensure fonts load through proxy
  // Also register font family names as fallback if expo-font fails
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check if link already exists
      const existingLink = document.querySelector(
        'link[href*="fonts.googleapis.com/css2?family=Inter"]',
      );

      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      }

      // Note: The @import in global.css and the link tag above ensure Inter font loads
      // expo-font will register the font family names (Inter_400Regular, etc.)
      // If expo-font fails due to proxy issues, the fonts should still be available
      // via the direct Google Fonts CDN link, though the specific font family names
      // might not be registered. The app should still render with Inter font.
    }
  }, []);

  useEffect(() => {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    if (__DEV__ && Platform.OS !== 'web' && !isExpoGo) {
      const timer = setTimeout(() => {
        DevClient.closeMenu();
        DevClient.hideMenu();
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      initPostHog();
    }
  }, []);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <AppContent />
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
