import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from '@/store/app';
import { useColors, useIsDark } from '@/theme';

function Shell() {
  const { ready } = useApp();
  const c = useColors();
  const dark = useIsDark();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.ink,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ title: 'Your account' }} />
        <Stack.Screen name="onboarding" options={{ title: 'Your plan', headerBackVisible: false }} />
        <Stack.Screen name="recipe/[id]" options={{ title: '' }} />
        <Stack.Screen name="cook/[id]" options={{ title: 'Cook mode' }} />
        <Stack.Screen name="add-food" options={{ title: 'Add food', presentation: 'modal' }} />
        <Stack.Screen name="shopping" options={{ title: 'Shopping list' }} />
        <Stack.Screen name="progress" options={{ title: 'Progress' }} />
        <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Workout', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="guides" options={{ title: 'Guides and videos' }} />
        <Stack.Screen name="vip" options={{ title: 'Nourish VIP', presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
