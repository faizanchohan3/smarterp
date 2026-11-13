import { useState } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { Btn, Card, Chip, Macro, RecipeArt, Row, Screen, Seg, Stepper, T } from '@/components/ui';
import { RECIPE_BY_ID, TAG_LABEL, type MealType } from '@/data/recipes';
import { MEAL_LABEL, MEAL_ORDER, dayKey, fmtQty, parseKey, weekStart, youtubeSearch } from '@/lib/core';
import { recipeItem } from '@/lib/actions';
import { useApp, withDay } from '@/store/app';
import { useColors } from '@/theme';

export default function RecipeScreen() {
  const c = useColors();
  const { id, servings: sParam } = useLocalSearchParams<{ id: string; servings?: string }>();
  const r = RECIPE_BY_ID[id];
  const { state, update } = useApp();
  const [servings, setServings] = useState(() => (sParam ? Number(sParam) || 1 : 1));
  const [meal, setMeal] = useState<MealType>(r?.meals[0] ?? 'lunch');
  const [done, setDone] = useState<string | null>(null);
  if (!r) return <Screen edges={[]}><T>This recipe is no longer available.</T></Screen>;

  const fav = state.favorites.includes(r.id);
  const factor = servings / r.servings;
  const today = dayKey();

  const log = () => {
    update((s) => withDay(s, today, (d) => ({ ...d, items: [...d.items, recipeItem(r, servings, meal)] })));
    setDone(`Added to today’s ${MEAL_LABEL[meal].toLowerCase()}.`);
  };
  const addToPlan = () => {
    const ws = weekStart(today);
    const idx = (parseKey(today).getDay() + 6) % 7;
    update((s) => {
      const pl = s.plans[ws];
      if (!pl) return s;
      const days = pl.days.map((d, i) => (i === idx ? { ...d, [meal]: { recipeId: r.id, servings } } : d));
      return { ...s, plans: { ...s.plans, [ws]: { ...pl, days } } };
    });
    setDone(`Set as today’s planned ${MEAL_LABEL[meal].toLowerCase()}.`);
  };

  return (
    <Screen edges={['bottom']}>
      <Stack.Screen options={{
        title: '',
        headerRight: () => (
          <Pressable accessibilityLabel={fav ? 'Remove from favourites' : 'Save to favourites'} hitSlop={10}
            onPress={() => update((s) => ({ ...s, favorites: fav ? s.favorites.filter((x) => x !== r.id) : [...s.favorites, r.id] }))}>
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={24} color={fav ? c.protein : c.ink} />
          </Pressable>
        ),
      }} />
      <RecipeArt hue={r.hue} size="100%" rounded={20} />
      <T v="h1">{r.title}</T>
      <T v="muted" style={{ fontSize: 15 }}>{r.summary}</T>
      <Row wrap gap={6}>
        <Chip label={`${r.minutes} min`} onPress={() => {}} />
        {r.tags.map((t) => <Chip key={t} label={TAG_LABEL[t]} onPress={() => {}} />)}
      </Row>

      <Card>
        <Row between><T v="h3">Per serving</T><T v="muted">net carbs</T></Row>
        <Row>
          <Macro label="kcal" value={String(r.kcal)} color={c.ink} />
          <Macro label="protein" value={`${r.protein} g`} color={c.protein} />
          <Macro label="carbs" value={`${r.carbs} g`} color={c.carb} />
          <Macro label="fat" value={`${r.fat} g`} color={c.fat} />
          <Macro label="fibre" value={`${r.fiber} g`} color={c.brand} />
        </Row>
      </Card>

      <Card>
        <T v="h3">Ingredients</T>
        <Stepper value={servings} onChange={setServings} min={0.5} max={12} step={servings < 2 ? 0.5 : 1} suffix={servings === 1 ? 'serving' : 'servings'} />
        {r.ingredients.map((ing, i) => (
          <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
            <T v="num" style={{ width: 84 }}>{fmtQty(ing.qty === null ? null : ing.qty * factor, ing.unit)}</T>
            <T v="small" style={{ flex: 1 }}>{ing.name}</T>
          </Row>
        ))}
      </Card>

      <Card>
        <Row between>
          <T v="h3">Method</T>
          <Btn title="Cook mode" small icon="flame" onPress={() => router.push(`/cook/${r.id}`)} />
        </Row>
        {r.steps.map((s, i) => (
          <Row key={i} gap={12} style={{ alignItems: 'flex-start' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
              <T v="small" color={c.brand} style={{ fontWeight: '800' }}>{i + 1}</T>
            </View>
            <T style={{ flex: 1 }}>{s}</T>
          </Row>
        ))}
        {r.tip ? <Card tone="soft"><T v="label">Tip</T><T v="small">{r.tip}</T></Card> : null}
        <Btn title="Watch how it’s made" kind="ghost" icon="logo-youtube" onPress={() => WebBrowser.openBrowserAsync(youtubeSearch(r.video))} />
      </Card>

      <Card>
        <T v="h3">Eat this</T>
        <Seg options={MEAL_ORDER.map((m) => ({ v: m, label: MEAL_LABEL[m] }))} value={meal} onChange={(v) => setMeal(v)} />
        <Row gap={10}>
          <Btn flex title="Log to today" icon="add-circle" onPress={log} />
          <Btn flex title="Put in plan" kind="ghost" icon="calendar" onPress={addToPlan} />
        </Row>
        {done ? <T v="small" color={c.brand}>{done}</T> : null}
      </Card>
    </Screen>
  );
}
