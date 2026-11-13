import { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Btn, Card, Chip, ChipRow, Field, Macro, Row, Seg, Stepper, T } from '@/components/ui';
import { FOODS, FOOD_CATEGORIES, type Food, type FoodCategory } from '@/data/foods';
import { RECIPES, type MealType } from '@/data/recipes';
import { MEAL_LABEL, MEAL_ORDER, dayKey, prettyDay, uid } from '@/lib/core';
import { foodItem, recipeItem } from '@/lib/actions';
import { useApp, withDay } from '@/store/app';
import { useColors } from '@/theme';

type Pick = { kind: 'food'; food: Food } | { kind: 'recipe'; id: string };

export default function AddFood() {
  const c = useColors();
  const params = useLocalSearchParams<{ meal?: MealType; day?: string }>();
  const day = params.day ?? dayKey();
  const { state, update } = useApp();
  const [meal, setMeal] = useState<MealType>(params.meal ?? 'breakfast');
  const [tab, setTab] = useState<'foods' | 'recipes' | 'custom'>('foods');
  const [cat, setCat] = useState<FoodCategory | 'All'>('All');
  const [q, setQ] = useState('');
  const [pick, setPick] = useState<Pick | null>(null);
  const [qty, setQty] = useState(1);
  const [custom, setCustom] = useState({ name: '', serving: '1 serving', kcal: '', p: '', c: '', f: '' });
  const [err, setErr] = useState('');

  const all = useMemo(() => [...FOODS, ...state.customFoods], [state.customFoods]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (tab === 'recipes') return RECIPES.filter((r) => !t || r.title.toLowerCase().includes(t)).map((r) => ({ key: r.id, title: r.title, sub: `1 serving · P ${r.protein} · C ${r.carbs} · F ${r.fat}`, kcal: r.kcal, pick: { kind: 'recipe', id: r.id } as Pick }));
    return all
      .filter((f) => (cat === 'All' || f.category === cat) && (!t || f.name.toLowerCase().includes(t)))
      .map((f) => ({ key: f.id, title: f.name, sub: `${f.serving} · P ${f.protein} · C ${f.carbs} · F ${f.fat}`, kcal: f.kcal, pick: { kind: 'food', food: f } as Pick }));
  }, [q, tab, cat, all]);

  const add = () => {
    if (!pick) return;
    const item = pick.kind === 'food' ? foodItem(pick.food, qty, meal) : recipeItem(RECIPES.find((r) => r.id === pick.id)!, qty, meal);
    update((s) => withDay(s, day, (d) => ({ ...d, items: [...d.items, item] })));
    router.back();
  };

  const saveCustom = () => {
    const kcal = parseFloat(custom.kcal);
    if (!custom.name.trim()) return setErr('Give the food a name.');
    if (!(kcal >= 0 && kcal < 5000)) return setErr('Enter calories per serving.');
    const num = (s: string) => Math.max(0, parseFloat(s) || 0);
    const food: Food = { id: 'c_' + uid(), name: custom.name.trim().slice(0, 40), serving: custom.serving.trim().slice(0, 30) || '1 serving', kcal: Math.round(kcal), protein: num(custom.p), carbs: num(custom.c), fat: num(custom.f), category: 'My foods', custom: true };
    update((s) => ({ ...s, customFoods: [...s.customFoods, food] }));
    setErr('');
    setPick({ kind: 'food', food });
    setQty(1);
  };

  if (pick) {
    const base = pick.kind === 'food' ? pick.food : RECIPES.find((r) => r.id === pick.id)!;
    const name = pick.kind === 'food' ? pick.food.name : (base as (typeof RECIPES)[number]).title;
    const unit = pick.kind === 'food' ? pick.food.serving : 'serving';
    return (
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: c.bg, padding: 16, gap: 14 }}>
        <T v="h2">{name}</T>
        <Seg options={MEAL_ORDER.map((m) => ({ v: m, label: MEAL_LABEL[m] }))} value={meal} onChange={setMeal} />
        <Card>
          <Stepper value={qty} onChange={setQty} suffix={`× ${unit}`} />
          <Row>
            <Macro label="kcal" value={String(Math.round(base.kcal * qty))} color={c.ink} />
            <Macro label="protein" value={`${Math.round(base.protein * qty)} g`} color={c.protein} />
            <Macro label="carbs" value={`${Math.round(base.carbs * qty)} g`} color={c.carb} />
            <Macro label="fat" value={`${Math.round(base.fat * qty)} g`} color={c.fat} />
          </Row>
        </Card>
        <T v="muted">Adding to {prettyDay(day).toLowerCase()}.</T>
        <Btn title="Add to diary" icon="add-circle" onPress={add} />
        <Btn title="Choose something else" kind="ghost" onPress={() => setPick(null)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ padding: 16, gap: 12 }}>
        <Seg options={MEAL_ORDER.map((m) => ({ v: m, label: MEAL_LABEL[m] }))} value={meal} onChange={setMeal} />
        <Seg options={[{ v: 'foods', label: 'Foods' }, { v: 'recipes', label: 'Recipes' }, { v: 'custom', label: 'Your own' }]} value={tab} onChange={setTab} />
        {tab !== 'custom' ? <Field placeholder="Search" value={q} onChangeText={setQ} accessibilityLabel="Search foods" /> : null}
        {tab === 'foods' ? <ChipRow>{FOOD_CATEGORIES.map((k) => <Chip key={k} label={k} on={cat === k} onPress={() => setCat(k)} />)}</ChipRow> : null}
      </View>
      {tab === 'custom' ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <Field label="Name" value={custom.name} onChangeText={(v) => setCustom({ ...custom, name: v })} placeholder="e.g. Ammi’s aloo gosht" maxLength={40} />
          <Field label="Serving" value={custom.serving} onChangeText={(v) => setCustom({ ...custom, serving: v })} maxLength={30} />
          <Row gap={8}>
            <Field label="kcal" value={custom.kcal} onChangeText={(v) => setCustom({ ...custom, kcal: v })} keyboardType="decimal-pad" />
            <Field label="Protein g" value={custom.p} onChangeText={(v) => setCustom({ ...custom, p: v })} keyboardType="decimal-pad" />
            <Field label="Carbs g" value={custom.c} onChangeText={(v) => setCustom({ ...custom, c: v })} keyboardType="decimal-pad" />
            <Field label="Fat g" value={custom.f} onChangeText={(v) => setCustom({ ...custom, f: v })} keyboardType="decimal-pad" />
          </Row>
          {err ? <T color={c.danger}>{err}</T> : null}
          <Btn title="Save food" onPress={saveCustom} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(x) => x.key}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={<T v="muted">Nothing matches. Add it under “Your own”.</T>}
          renderItem={({ item }) => (
            <Pressable onPress={() => { setPick(item.pick); setQty(1); }} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line, opacity: pressed ? 0.6 : 1 })}>
              <View style={{ flex: 1 }}>
                <T v="small" style={{ fontWeight: '600' }}>{item.title}</T>
                <T v="muted" style={{ fontSize: 12 }}>{item.sub}</T>
              </View>
              <T v="num">{item.kcal} kcal</T>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
