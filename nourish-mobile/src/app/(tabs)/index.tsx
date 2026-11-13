import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Bar, Btn, Card, IconBtn, RecipeArt, Ring, Row, Screen, T, VipBadge } from '@/components/ui';
import { MEAL_LABEL, MEAL_ORDER, addDays, dayKey, parseKey, prettyDay, targets, weekStart } from '@/lib/core';
import { RECIPE_BY_ID } from '@/data/recipes';
import { dayTotalsLog, useApp, withDay } from '@/store/app';
import { togglePlanned } from '@/lib/actions';
import { useColors } from '@/theme';

export default function Today() {
  const c = useColors();
  const { state, update, ensureWeek, sync } = useApp();
  const [day, setDay] = useState(dayKey());
  const p = state.profile!;
  const T0 = targets(p);
  const log = state.logs[day];
  const t = dayTotalsLog(log);
  const budget = T0.kcal + t.burned;
  const left = budget - t.kcal;
  const ws = weekStart(day);
  const dayIdx = (parseKey(day).getDay() + 6) % 7;
  const plan = state.plans[ws];
  useEffect(() => { ensureWeek(ws); }, [ws, ensureWeek, p.diet, T0.kcal]);
  const planned = plan?.days[dayIdx] ?? {};
  const water = log?.water ?? 0;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen>
      <Row between>
        <View style={{ flex: 1 }}>
          <T v="muted">{hello}{p.name ? `, ${p.name}` : ''}</T>
          <Row gap={8}><T v="h1">{prettyDay(day)}</T><VipBadge /></Row>
        </View>
        <IconBtn icon="chevron-back" label="Previous day" onPress={() => setDay(addDays(day, -1))} />
        <IconBtn icon="chevron-forward" label="Next day" onPress={() => setDay(addDays(day, 1))} />
      </Row>
      {state.mode === 'account' && sync === 'error' ? <T v="small" color={c.danger}>Could not sync. Changes are saved on this phone and will upload when you are back online.</T> : null}

      <Card>
        <Row gap={16} style={{ alignItems: 'center' }}>
          <Ring value={t.kcal} max={budget} size={138} color={left < 0 ? c.danger : c.brand}>
            <T v="h1" style={{ fontVariant: ['tabular-nums'] }}>{Math.abs(left)}</T>
            <T v="muted" style={{ fontSize: 12 }}>{left < 0 ? 'kcal over' : 'kcal left'}</T>
          </Ring>
          <View style={{ flex: 1, gap: 10 }}>
            <Row between>
              <Stat label="Eaten" value={t.kcal} />
              <Stat label="Burned" value={t.burned} />
              <Stat label="Goal" value={T0.kcal} />
            </Row>
            <Bar label="Protein" value={t.protein} max={T0.protein} color={c.protein} />
            <Bar label="Net carbs" value={t.carbs} max={T0.carbs} color={c.carb} />
            <Bar label="Fat" value={t.fat} max={T0.fat} color={c.fat} />
          </View>
        </Row>
      </Card>

      {plan ? (
        <Card>
          <Row between><T v="h3">From your meal plan</T><Btn title="Plan" small kind="ghost" icon="calendar" onPress={() => router.push('/plan')} /></Row>
          {MEAL_ORDER.filter((m) => planned[m]).map((m) => {
            const slot = planned[m]!;
            const r = RECIPE_BY_ID[slot.recipeId];
            if (!r) return null;
            return (
              <Row key={m} gap={12}>
                <Pressable onPress={() => router.push(`/recipe/${r.id}?servings=${slot.servings}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <RecipeArt hue={r.hue} size={52} rounded={12} />
                  <View style={{ flex: 1 }}>
                    <T v="label">{MEAL_LABEL[m]}</T>
                    <T v="small" style={{ fontWeight: '600' }} numberOfLines={2}>{r.title}</T>
                    <T v="muted" style={{ fontSize: 12 }}>{slot.servings} serving{slot.servings === 1 ? '' : 's'} · {Math.round(r.kcal * slot.servings)} kcal</T>
                  </View>
                </Pressable>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!slot.done }} accessibilityLabel={`Mark ${r.title} as eaten`}
                  onPress={() => update((s) => togglePlanned(s, ws, dayIdx, m, day))} hitSlop={8}
                  style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: c.brand, backgroundColor: slot.done ? c.brand : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {slot.done ? <Ionicons name="checkmark" size={20} color={c.brandInk} /> : null}
                </Pressable>
              </Row>
            );
          })}
        </Card>
      ) : null}

      <Card>
        <Row between><T v="h3">Water</T><T v="muted" style={{ fontVariant: ['tabular-nums'] }}>{water} / {T0.waterGlasses} glasses · {(water * 0.25).toFixed(2)} L</T></Row>
        <Row wrap gap={8}>
          {Array.from({ length: Math.max(T0.waterGlasses, water) }, (_, i) => (
            <Pressable key={i} accessibilityLabel={`${i + 1} glasses`} onPress={() => update((s) => withDay(s, day, (d) => ({ ...d, water: d.water === i + 1 ? i : i + 1 })))}
              style={{ width: 30, height: 38, borderRadius: 6, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderWidth: 2, borderColor: c.water, overflow: 'hidden', justifyContent: 'flex-end' }}>
              {i < water ? <View style={{ height: '70%', backgroundColor: c.water, opacity: 0.8 }} /> : null}
            </Pressable>
          ))}
        </Row>
      </Card>

      {MEAL_ORDER.map((m) => {
        const items = log?.items.filter((i) => i.meal === m) ?? [];
        const sum = items.reduce((a, i) => a + i.kcal, 0);
        return (
          <Card key={m}>
            <Row between>
              <T v="h3">{MEAL_LABEL[m]}</T>
              <Row gap={8}><T v="muted" style={{ fontVariant: ['tabular-nums'] }}>{sum} kcal</T><Btn title="Add" small kind="ghost" icon="add" onPress={() => router.push(`/add-food?meal=${m}&day=${day}`)} /></Row>
            </Row>
            {items.length === 0 ? <T v="muted">Nothing logged yet.</T> : items.map((i) => (
              <Row key={i.id} gap={8}>
                <View style={{ flex: 1 }}>
                  <T v="small" style={{ fontWeight: '600' }}>{i.name}</T>
                  <T v="muted" style={{ fontSize: 12 }}>{i.detail} · P {Math.round(i.protein)} · C {Math.round(i.carbs)} · F {Math.round(i.fat)}</T>
                </View>
                <T v="num">{i.kcal}</T>
                <Pressable accessibilityLabel={`Remove ${i.name}`} hitSlop={8} onPress={() => update((s) => withDay(s, day, (d) => ({ ...d, items: d.items.filter((x) => x.id !== i.id) })))}>
                  <Ionicons name="close" size={18} color={c.muted} />
                </Pressable>
              </Row>
            ))}
          </Card>
        );
      })}

      <Card>
        <Row between><T v="h3">Exercise</T><Btn title="Workouts" small kind="ghost" icon="barbell" onPress={() => router.push('/workouts')} /></Row>
        {(log?.workouts.length ?? 0) === 0 ? <T v="muted">Calories you burn are added back to your budget.</T> : log!.workouts.map((w, idx) => (
          <Row key={idx} gap={8}>
            <View style={{ flex: 1 }}><T v="small" style={{ fontWeight: '600' }}>{w.name}</T><T v="muted" style={{ fontSize: 12 }}>{w.minutes} min</T></View>
            <T v="num">−{w.kcal}</T>
            <Pressable accessibilityLabel={`Remove ${w.name}`} hitSlop={8} onPress={() => update((s) => withDay(s, day, (d) => ({ ...d, workouts: d.workouts.filter((_, j) => j !== idx) })))}>
              <Ionicons name="close" size={18} color={c.muted} />
            </Pressable>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View>
      <T v="muted" style={{ fontSize: 11 }}>{label}</T>
      <T v="num">{value}</T>
    </View>
  );
}
