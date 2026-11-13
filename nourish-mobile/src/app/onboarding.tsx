import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Btn, Card, Field, Row, Screen, Seg, T } from '@/components/ui';
import { ACTIVITY, GOALS, dayKey, targets, type Goal, type Profile, type Sex } from '@/lib/core';
import { DIETS, type DietId } from '@/data/programs';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

const SAMPLE: Profile = { name: '', sex: 'f', age: 30, heightCm: 163, weightKg: 72, goalKg: 64, activity: 1.375, goal: 'lose', diet: 'lowcarb', mealsPerDay: 3 };

export default function Onboarding() {
  const c = useColors();
  const { state, update } = useApp();
  const [p, setP] = useState<Profile>(state.profile ?? SAMPLE);
  const [nums, setNums] = useState({ age: String(p.age), h: String(p.heightCm), w: String(p.weightKg), g: String(p.goalKg) });
  const [err, setErr] = useState('');
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((o) => ({ ...o, [k]: v }));

  const n = (s: string) => parseFloat(s.replace(',', '.'));
  const save = () => {
    const age = n(nums.age), h = n(nums.h), w = n(nums.w), g = n(nums.g);
    if (!(age >= 14 && age <= 90)) return setErr('Age must be between 14 and 90.');
    if (!(h >= 120 && h <= 230)) return setErr('Height must be between 120 and 230 cm.');
    if (!(w >= 30 && w <= 300) || !(g >= 30 && g <= 300)) return setErr('Weights must be between 30 and 300 kg.');
    const prof: Profile = { ...p, name: p.name.trim().slice(0, 30), age: Math.round(age), heightCm: Math.round(h), weightKg: Math.round(w * 10) / 10, goalKg: Math.round(g * 10) / 10 };
    const first = !state.profile;
    update((s) => {
      const weights = s.weights.filter((x) => x.d !== dayKey());
      const last = s.weights[s.weights.length - 1];
      if (first || !last || last.kg !== prof.weightKg) weights.push({ d: dayKey(), kg: prof.weightKg });
      return { ...s, profile: prof, weights: weights.sort((a, b) => (a.d < b.d ? -1 : 1)) };
    });
    if (first) router.replace('/');
    else router.back();
  };

  const preview = targets({ ...p, age: n(nums.age) || p.age, heightCm: n(nums.h) || p.heightCm, weightKg: n(nums.w) || p.weightKg });

  return (
    <Screen edges={['bottom']}>
      <T v="muted">{state.profile ? 'Update your details and your targets and meal plan adjust automatically.' : 'Tell us about you. The numbers below are only an example; replace them with your own.'}</T>
      <Card>
        <T v="h3">About you</T>
        <Field label="First name (optional)" value={p.name} onChangeText={(v) => set('name', v)} autoComplete="given-name" maxLength={30} />
        <Seg<Sex> options={[{ v: 'f', label: 'Female' }, { v: 'm', label: 'Male' }]} value={p.sex} onChange={(v) => set('sex', v)} />
        <Row gap={12}>
          <Field label="Age" value={nums.age} onChangeText={(v) => setNums((o) => ({ ...o, age: v }))} keyboardType="number-pad" />
          <Field label="Height (cm)" value={nums.h} onChangeText={(v) => setNums((o) => ({ ...o, h: v }))} keyboardType="decimal-pad" />
        </Row>
        <Row gap={12}>
          <Field label="Weight now (kg)" value={nums.w} onChangeText={(v) => setNums((o) => ({ ...o, w: v }))} keyboardType="decimal-pad" />
          <Field label="Goal weight (kg)" value={nums.g} onChangeText={(v) => setNums((o) => ({ ...o, g: v }))} keyboardType="decimal-pad" />
        </Row>
      </Card>
      <Card>
        <T v="h3">How active are you?</T>
        {ACTIVITY.map((a) => (
          <Option key={a.v} on={p.activity === a.v} label={a.label} onPress={() => set('activity', a.v)} />
        ))}
      </Card>
      <Card>
        <T v="h3">Your goal</T>
        <Seg<Goal> options={GOALS.map((g) => ({ v: g.id, label: g.short }))} value={p.goal} onChange={(v) => set('goal', v)} />
      </Card>
      <Card>
        <T v="h3">Eating style</T>
        {DIETS.map((d) => (
          <Option key={d.id} on={p.diet === d.id} label={d.name} sub={d.blurb} onPress={() => set('diet', d.id as DietId)} />
        ))}
        <T v="muted" style={{ marginTop: 4 }}>Meals per day</T>
        <Seg<3 | 4> options={[{ v: 3, label: '3 meals' }, { v: 4, label: '3 meals + snack' }]} value={p.mealsPerDay} onChange={(v) => set('mealsPerDay', v)} />
      </Card>
      <Card tone="brand">
        <T v="label">Your daily target</T>
        <T v="display" color={c.brand} style={{ fontVariant: ['tabular-nums'] }}>{preview.kcal} kcal</T>
        <T v="small">Protein {preview.protein} g · Carbs {preview.carbs} g · Fat {preview.fat} g</T>
      </Card>
      {err ? <T color={c.danger}>{err}</T> : null}
      <Btn title={state.profile ? 'Save changes' : 'Create my plan'} onPress={save} />
      <T v="muted">Nourish gives general guidance, not medical advice. If you are pregnant, have diabetes or another condition, or take medication, check with your doctor before changing your diet.</T>
    </Screen>
  );
}

function Option({ on, label, sub, onPress }: { on: boolean; label: string; sub?: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandSoft : 'transparent' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? c.brand : c.muted, alignItems: 'center', justifyContent: 'center' }}>
        {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.brand }} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <T v="small" style={{ fontWeight: '700' }}>{label}</T>
        {sub ? <T v="muted">{sub}</T> : null}
      </View>
    </Pressable>
  );
}
