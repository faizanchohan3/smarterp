import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, Divider, Row, Screen, Seg, T, VipBadge, type IconName } from '@/components/ui';
import { GOALS, bmiLabel, dayKey, targets } from '@/lib/core';
import { DIET_BY_ID } from '@/data/programs';
import { authEnabled } from '@/lib/supabase';
import { blankState, useApp } from '@/store/app';
import { useColors } from '@/theme';

export default function Me() {
  const c = useColors();
  const { state, update, session, signOut } = useApp();
  const [confirm, setConfirm] = useState(false);
  const p = state.profile!;
  const T0 = targets(p);
  const cur = state.weights[state.weights.length - 1]?.kg ?? p.weightKg;

  const links: [IconName, string, string, () => void][] = [
    ['trending-down', 'Progress', 'Weight, BMI and calories', () => router.push('/progress')],
    ['cart', 'Shopping list', 'From this week’s meal plan', () => router.push('/shopping')],
    ['barbell', 'Workouts', 'Guided timer and videos', () => router.push('/workouts')],
    ['play-circle', 'Guides and videos', 'Keto, fasting, desi swaps', () => router.push('/guides')],
    ['diamond', 'Nourish VIP', 'Everything included in your membership', () => router.push('/vip')],
  ];

  return (
    <Screen>
      <Row between>
        <View style={{ flex: 1 }}>
          <T v="h1">{p.name || 'Your profile'}</T>
          <T v="muted">{state.mode === 'account' ? `Signed in${session?.user.email ? ` as ${session.user.email}` : ''}` : 'Guest · saved on this phone'}</T>
        </View>
        <VipBadge />
      </Row>

      <Card>
        <Row between>
          <Mini label="Weight" value={`${cur} kg`} />
          <Mini label="Goal" value={`${p.goalKg} kg`} />
          <Mini label="BMI" value={`${(cur / (p.heightCm / 100) ** 2).toFixed(1)}`} />
        </Row>
        <T v="muted">{bmiLabel(cur / (p.heightCm / 100) ** 2)} · {GOALS.find((g) => g.id === p.goal)?.label} · {DIET_BY_ID[p.diet].name}</T>
        <Divider />
        <Row between>
          <Mini label="Daily target" value={`${T0.kcal} kcal`} />
          <Mini label="Protein" value={`${T0.protein} g`} />
          <Mini label="Carbs" value={`${T0.carbs} g`} />
          <Mini label="Fat" value={`${T0.fat} g`} />
        </Row>
        <T v="muted">Resting burn {T0.bmr} kcal · daily burn about {T0.tdee} kcal</T>
        <Btn title="Edit details, goal and eating style" kind="ghost" icon="create-outline" onPress={() => router.push('/onboarding')} />
      </Card>

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        {links.map(([icon, title, sub, go], i) => (
          <Pressable key={title} onPress={go} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: icon === 'diamond' ? c.goldSoft : c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={18} color={icon === 'diamond' ? c.gold : c.brand} />
            </View>
            <View style={{ flex: 1 }}><T v="small" style={{ fontWeight: '700' }}>{title}</T><T v="muted" style={{ fontSize: 12 }}>{sub}</T></View>
            <Ionicons name="chevron-forward" size={18} color={c.muted} />
          </Pressable>
        ))}
      </Card>

      <Card>
        <T v="h3">Appearance</T>
        <Seg options={[{ v: 'system', label: 'System' }, { v: 'light', label: 'Light' }, { v: 'dark', label: 'Dark' }]} value={state.theme} onChange={(v) => update((s) => ({ ...s, theme: v as typeof s.theme }))} />
      </Card>

      <Card>
        <T v="h3">Account</T>
        {state.mode === 'account' ? (
          <>
            <T v="muted">Your data syncs to your account. Sign in on another phone or tablet to pick up where you left off.</T>
            <Btn title="Sign out" kind="line" icon="log-out-outline" onPress={async () => { await signOut(); router.replace('/welcome'); }} />
          </>
        ) : authEnabled ? (
          <>
            <T v="muted">Create an account to back up your data and use Nourish on more than one device. What you have logged so far comes with you.</T>
            <Btn title="Sign in or create account" icon="person-add" onPress={() => router.push('/auth')} />
          </>
        ) : (
          <T v="muted">This build saves everything on this phone.</T>
        )}
        {confirm ? (
          <View style={{ gap: 8 }}>
            <T v="small" color={c.danger}>Erase every meal, plan, fast and weight entry{state.mode === 'account' ? ' from this account' : ''}? This cannot be undone.</T>
            <Row gap={10}>
              <Btn flex title="Erase" kind="danger" onPress={() => { update((s) => ({ ...blankState(), mode: s.mode, theme: s.theme })); setConfirm(false); router.replace('/onboarding'); }} />
              <Btn flex title="Keep my data" kind="ghost" onPress={() => setConfirm(false)} />
            </Row>
          </View>
        ) : (
          <Btn title="Erase all my data" kind="line" small onPress={() => setConfirm(true)} />
        )}
      </Card>
      <T v="muted" style={{ textAlign: 'center' }}>Nourish 1.0 · {dayKey()} · General guidance, not medical advice.</T>
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <T v="muted" style={{ fontSize: 11 }}>{label}</T>
      <T v="num">{value}</T>
    </View>
  );
}
