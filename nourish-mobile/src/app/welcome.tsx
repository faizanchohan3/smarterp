import { router } from 'expo-router';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, Row, Screen, T, VipBadge, type IconName } from '@/components/ui';
import { authEnabled } from '@/lib/supabase';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

const FEATURES: [IconName, string, string][] = [
  ['calendar', 'Weekly meal plans', 'Keto, low carb, high protein, vegetarian and desi, portioned to your calories.'],
  ['restaurant', 'Recipes with cook mode', 'Step-by-step cooking with servings that scale.'],
  ['cart', 'Automatic shopping list', 'Every ingredient for your week, sorted by aisle.'],
  ['timer', 'Fasting tracker', '16:8, 18:6, OMAD and more, with stage guidance.'],
  ['analytics', 'Calories and macros', 'Log food, water and workouts. See your weight trend.'],
  ['play-circle', 'Videos and guides', 'Cooking videos, workouts and nutrition basics.'],
];

export default function Welcome() {
  const c = useColors();
  const { update } = useApp();
  const guest = () => {
    update((s) => ({ ...s, mode: 'guest' }));
    router.replace('/onboarding');
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <Row style={{ marginTop: 16 }}>
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="leaf" size={28} color={c.brandInk} />
        </View>
        <View style={{ gap: 4 }}>
          <T v="h2">Nourish</T>
          <VipBadge label="VIP DIET COACH" />
        </View>
      </Row>
      <T v="display" style={{ marginTop: 8 }}>Eat real food.{'\n'}<T v="display" color={c.brand}>Hit your number.</T></T>
      <T v="muted" style={{ fontSize: 15, lineHeight: 21 }}>Nourish works out your calories and macros, plans your week of meals, writes your shopping list and keeps you on track.</T>
      <Card style={{ gap: 14 }}>
        {FEATURES.map(([icon, title, body]) => (
          <Row key={title} style={{ alignItems: 'flex-start' }} gap={12}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={18} color={c.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <T v="h3">{title}</T>
              <T v="muted">{body}</T>
            </View>
          </Row>
        ))}
      </Card>
      {authEnabled ? <Btn title="Sign in or create account" icon="person" onPress={() => router.push('/auth')} /> : null}
      <Btn title="Continue without an account" kind={authEnabled ? 'ghost' : 'primary'} icon="phone-portrait-outline" onPress={guest} />
      <T v="muted" style={{ textAlign: 'center' }}>
        {authEnabled ? 'With an account your plan syncs between your phone and tablet. Without one, everything stays on this device.' : 'Everything is saved on this device.'}
      </T>
    </Screen>
  );
}
