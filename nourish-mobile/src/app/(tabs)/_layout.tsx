import { Redirect, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';
import type { IconName } from '@/components/ui';

const TABS: { name: string; title: string; icon: IconName; iconOn: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'sunny-outline', iconOn: 'sunny' },
  { name: 'plan', title: 'Meal plan', icon: 'calendar-outline', iconOn: 'calendar' },
  { name: 'recipes', title: 'Recipes', icon: 'restaurant-outline', iconOn: 'restaurant' },
  { name: 'fasting', title: 'Fasting', icon: 'timer-outline', iconOn: 'timer' },
  { name: 'me', title: 'Me', icon: 'person-circle-outline', iconOn: 'person-circle' },
];

export default function TabLayout() {
  const { state } = useApp();
  const c = useColors();
  if (state.mode === 'none') return <Redirect href="/welcome" />;
  if (!state.profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name}
          options={{ title: t.title, tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? t.iconOn : t.icon} size={size} color={color as string} /> }} />
      ))}
    </Tabs>
  );
}
