import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip, ChipRow, Field, RecipeArt, Row, T, VipBadge } from '@/components/ui';
import { RECIPES, TAG_LABEL, type MealType, type Tag } from '@/data/recipes';
import { MEAL_LABEL } from '@/lib/core';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

type Filter = 'all' | 'fav' | Tag | MealType;
const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'fav', label: 'Favourites' },
  { v: 'keto', label: TAG_LABEL.keto },
  { v: 'lowcarb', label: TAG_LABEL.lowcarb },
  { v: 'highprotein', label: TAG_LABEL.highprotein },
  { v: 'vegetarian', label: TAG_LABEL.vegetarian },
  { v: 'desi', label: TAG_LABEL.desi },
  { v: 'quick', label: TAG_LABEL.quick },
  { v: 'breakfast', label: MEAL_LABEL.breakfast },
  { v: 'lunch', label: MEAL_LABEL.lunch },
  { v: 'dinner', label: MEAL_LABEL.dinner },
  { v: 'snack', label: 'Snacks' },
];
const MEALS: string[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function Recipes() {
  const c = useColors();
  const { state, update } = useApp();
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filter>('all');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return RECIPES.filter((r) => {
      if (f === 'fav' && !state.favorites.includes(r.id)) return false;
      if (MEALS.includes(f) && !r.meals.includes(f as MealType)) return false;
      if (f !== 'all' && f !== 'fav' && !MEALS.includes(f) && !r.tags.includes(f as Tag)) return false;
      if (term && !(r.title.toLowerCase().includes(term) || r.ingredients.some((i) => i.name.toLowerCase().includes(term)))) return false;
      return true;
    });
  }, [q, f, state.favorites]);

  const toggleFav = (id: string) =>
    update((s) => ({ ...s, favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] }));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(r) => r.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingTop: 8 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 12 }}>
            <Row gap={8}><T v="h1">Recipes</T><VipBadge /></Row>
            <Field placeholder="Search recipes or ingredients" value={q} onChangeText={setQ} returnKeyType="search" accessibilityLabel="Search recipes" />
            <ChipRow>{FILTERS.map((x) => <Chip key={x.v} label={x.label} on={f === x.v} onPress={() => setF(x.v)} />)}</ChipRow>
            <T v="muted">{list.length} recipe{list.length === 1 ? '' : 's'} · nutrition per serving, net carbs</T>
          </View>
        }
        ListEmptyComponent={<T v="muted">{f === 'fav' ? 'Tap the heart on any recipe to save it here.' : 'No recipes match. Try another word or filter.'}</T>}
        renderItem={({ item: r }) => {
          const fav = state.favorites.includes(r.id);
          return (
            <Pressable onPress={() => router.push(`/recipe/${r.id}`)} style={({ pressed }) => ({ flex: 1, maxWidth: '50%', opacity: pressed ? 0.85 : 1, backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.line, overflow: 'hidden' })}>
              <View>
                <RecipeArt hue={r.hue} size="100%" rounded={0} />
                <Pressable accessibilityLabel={fav ? 'Remove from favourites' : 'Save to favourites'} hitSlop={10} onPress={() => toggleFav(r.id)}
                  style={{ position: 'absolute', top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={fav ? 'heart' : 'heart-outline'} size={18} color={fav ? c.protein : c.ink} />
                </Pressable>
              </View>
              <View style={{ padding: 10, gap: 4 }}>
                <T v="small" style={{ fontWeight: '700' }} numberOfLines={2}>{r.title}</T>
                <T v="muted" style={{ fontSize: 12 }}>{r.minutes} min · {r.kcal} kcal · {r.carbs} g carbs</T>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
