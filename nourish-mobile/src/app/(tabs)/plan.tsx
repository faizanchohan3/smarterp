import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, IconBtn, RecipeArt, Row, Screen, T, VipBadge } from '@/components/ui';
import { MEAL_LABEL, MEAL_ORDER, WEEKDAYS, addDays, dayKey, dayTotals, generateWeek, parseKey, swapSlot, targets, weekStart } from '@/lib/core';
import { DIET_BY_ID } from '@/data/programs';
import { RECIPE_BY_ID } from '@/data/recipes';
import { togglePlanned } from '@/lib/actions';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

export default function Plan() {
  const c = useColors();
  const { state, update, ensureWeek } = useApp();
  const p = state.profile!;
  const T0 = targets(p);
  const [ws, setWs] = useState(weekStart(dayKey()));
  const [dayIdx, setDayIdx] = useState((new Date().getDay() + 6) % 7);
  useEffect(() => { ensureWeek(ws); }, [ws, ensureWeek, p.diet, T0.kcal]);
  const plan = state.plans[ws];
  const day = plan?.days[dayIdx] ?? {};
  const tot = dayTotals(day);
  const thisWeek = weekStart(dayKey());
  const range = `${parseKey(ws).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${parseKey(addDays(ws, 6)).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;

  const setServings = (meal: keyof typeof day, delta: number) =>
    update((s) => {
      const pl = s.plans[ws];
      const slot = pl?.days[dayIdx]?.[meal];
      if (!pl || !slot) return s;
      const servings = Math.max(0.5, Math.min(4, slot.servings + delta));
      const days = pl.days.map((d, i) => (i === dayIdx ? { ...d, [meal]: { ...slot, servings } } : d));
      return { ...s, plans: { ...s.plans, [ws]: { ...pl, days } } };
    });

  return (
    <Screen>
      <Row between>
        <View style={{ flex: 1 }}>
          <Row gap={8}><T v="h1">Meal plan</T><VipBadge /></Row>
          <T v="muted">{DIET_BY_ID[p.diet].name} · {T0.kcal} kcal a day · {range}</T>
        </View>
        <IconBtn icon="chevron-back" label="Previous week" onPress={() => setWs(addDays(ws, -7))} />
        <IconBtn icon="chevron-forward" label="Next week" onPress={() => setWs(addDays(ws, 7))} />
      </Row>

      <Row gap={6}>
        {WEEKDAYS.map((w, i) => {
          const on = i === dayIdx;
          const isToday = addDays(ws, i) === dayKey();
          return (
            <Pressable key={w} onPress={() => setDayIdx(i)} accessibilityState={{ selected: on }}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: on ? c.brand : c.surface, borderWidth: 1, borderColor: on ? c.brand : c.line }}>
              <T v="small" color={on ? c.brandInk : c.muted} style={{ fontWeight: '700', fontSize: 11 }}>{w}</T>
              <T v="small" color={on ? c.brandInk : c.ink} style={{ fontWeight: '700' }}>{parseKey(addDays(ws, i)).getDate()}</T>
              <View style={{ width: 4, height: 4, borderRadius: 2, marginTop: 2, backgroundColor: isToday ? (on ? c.brandInk : c.accent) : 'transparent' }} />
            </Pressable>
          );
        })}
      </Row>

      <Card tone="soft" style={{ gap: 4 }}>
        <Row between>
          <T v="h3">{parseKey(addDays(ws, dayIdx)).toLocaleDateString(undefined, { weekday: 'long' })}</T>
          <T v="num">{tot.kcal} / {T0.kcal} kcal</T>
        </Row>
        <T v="muted">Protein {tot.protein} g · Net carbs {tot.carbs} g · Fat {tot.fat} g</T>
      </Card>

      {MEAL_ORDER.filter((m) => day[m]).map((m) => {
        const slot = day[m]!;
        const r = RECIPE_BY_ID[slot.recipeId];
        if (!r) return null;
        return (
          <Card key={m}>
            <Row between>
              <T v="label">{MEAL_LABEL[m]}</T>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !!slot.done }} onPress={() => update((s) => togglePlanned(s, ws, dayIdx, m))}>
                <Row gap={6}>
                  <Ionicons name={slot.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={c.brand} />
                  <T v="small" color={c.brand} style={{ fontWeight: '700' }}>{slot.done ? 'Eaten' : 'Mark eaten'}</T>
                </Row>
              </Pressable>
            </Row>
            <Pressable onPress={() => router.push(`/recipe/${r.id}?servings=${slot.servings}`)}>
              <Row gap={12} style={{ alignItems: 'flex-start' }}>
                <RecipeArt hue={r.hue} size={76} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="h3">{r.title}</T>
                  <T v="muted">{r.minutes} min · {Math.round(r.kcal * slot.servings)} kcal · P {Math.round(r.protein * slot.servings)} · C {Math.round(r.carbs * slot.servings)} · F {Math.round(r.fat * slot.servings)}</T>
                </View>
              </Row>
            </Pressable>
            <Row between>
              <Row gap={8}>
                <IconBtn icon="remove" label="Fewer servings" size={18} onPress={() => setServings(m, -0.5)} />
                <T v="num" style={{ minWidth: 70, textAlign: 'center' }}>{slot.servings} serving{slot.servings === 1 ? '' : 's'}</T>
                <IconBtn icon="add" label="More servings" size={18} onPress={() => setServings(m, 0.5)} />
              </Row>
              <Btn title="Swap" small kind="ghost" icon="shuffle" onPress={() => update((s) => (s.plans[ws] ? { ...s, plans: { ...s.plans, [ws]: swapSlot(s.plans[ws], dayIdx, m, p) } } : s))} />
            </Row>
          </Card>
        );
      })}

      <Row gap={10}>
        <Btn flex title="Shopping list" icon="cart" onPress={() => router.push(`/shopping?week=${ws}`)} />
        <Btn flex title="New week" kind="ghost" icon="refresh"
          onPress={() => update((s) => ({ ...s, plans: { ...s.plans, [ws]: { ...generateWeek(addDays(ws, 7 * (1 + Math.floor(Math.random() * 30))), p, T0.kcal), start: ws } } }))} />
      </Row>
      {ws < thisWeek ? <T v="muted">This is a past week.</T> : null}
      <T v="muted">Portions are scaled so each day lands near your calorie target. Tap a recipe for ingredients and steps.</T>
    </Screen>
  );
}
