import { router } from 'expo-router';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, Row, Screen, T, VipBadge, type IconName } from '@/components/ui';
import { RECIPES } from '@/data/recipes';
import { DIETS, WORKOUTS, GUIDES, FAST_PROTOCOLS } from '@/data/programs';
import { useColors } from '@/theme';

/**
 * Membership overview. Every feature is unlocked in this version.
 * To charge for VIP on Google Play, add Play Billing (see README: "Selling VIP").
 */
export default function Vip() {
  const c = useColors();
  const perks: [IconName, string][] = [
    ['calendar', `Personal weekly meal plans in ${DIETS.length} eating styles`],
    ['restaurant', `${RECIPES.length} recipes with cook mode and scalable servings`],
    ['cart', 'Shopping list built from your plan, shareable'],
    ['timer', `${FAST_PROTOCOLS.length} fasting schedules with stage guidance`],
    ['barbell', `${WORKOUTS.length} guided workouts with videos`],
    ['book', `${GUIDES.length} nutrition guides`],
    ['cloud-done', 'Sync across devices with your account'],
  ];
  return (
    <Screen edges={['bottom']}>
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="diamond" size={32} color={c.gold} />
        </View>
        <VipBadge label="ALL FEATURES UNLOCKED" />
        <T v="h1" style={{ textAlign: 'center' }}>Your VIP toolkit</T>
      </View>
      <Card>
        {perks.map(([icon, text]) => (
          <Row key={text} gap={12}>
            <Ionicons name={icon} size={20} color={c.brand} />
            <T v="small" style={{ flex: 1 }}>{text}</T>
          </Row>
        ))}
      </Card>
      <Btn title="Back to my plan" onPress={() => router.back()} />
    </Screen>
  );
}
