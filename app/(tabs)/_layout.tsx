import { BusFront, Compass, Route as RouteIcon, UserRound } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeColor } from 'heroui-native';
import { useUniwind } from 'uniwind';

export default function TabLayout() {
  const { theme } = useUniwind();
  const [background, foreground, border, accent, muted] = useThemeColor([
    'background',
    'foreground',
    'border',
    'accent',
    'muted',
  ]);

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: background },
          headerTintColor: foreground,
          headerTitleStyle: { color: foreground, fontWeight: '600' },
          headerShadowVisible: false,
          sceneStyle: { backgroundColor: background },
          tabBarStyle: {
            backgroundColor: background,
            borderTopColor: border,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Explore',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Compass color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="routes"
          options={{
            title: 'Routes',
            tabBarIcon: ({ color, size }) => <RouteIcon color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="vendor"
          options={{
            title: 'Vendor',
            tabBarIcon: ({ color, size }) => <BusFront color={color} size={size ?? 24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <UserRound color={color} size={size ?? 24} />,
          }}
        />
      </Tabs>
    </>
  );
}
