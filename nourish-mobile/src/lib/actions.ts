import { RECIPE_BY_ID, type MealType, type Recipe } from '@/data/recipes';
import type { Food } from '@/data/foods';
import { addDays, r1, uid } from '@/lib/core';
import { withDay, type AppState, type LogItem } from '@/store/app';

export function recipeItem(r: Recipe, servings: number, meal: MealType, ref = r.id): LogItem {
  return {
    id: uid(), meal, name: r.title, detail: `${servings} serving${servings === 1 ? '' : 's'}`,
    kcal: Math.round(r.kcal * servings), protein: r1(r.protein * servings), carbs: r1(r.carbs * servings), fat: r1(r.fat * servings),
    source: 'recipe', ref, qty: servings,
  };
}

export function foodItem(f: Food, qty: number, meal: MealType): LogItem {
  return {
    id: uid(), meal, name: f.name, detail: `${qty} × ${f.serving}`,
    kcal: Math.round(f.kcal * qty), protein: r1(f.protein * qty), carbs: r1(f.carbs * qty), fat: r1(f.fat * qty),
    source: 'food', ref: f.id, qty,
  };
}

/** Tick or untick a planned meal: logs it to the diary for that date, or removes it again. */
export function togglePlanned(s: AppState, weekStart: string, dayIdx: number, meal: MealType, dateKey?: string): AppState {
  const plan = s.plans[weekStart];
  const slot = plan?.days[dayIdx]?.[meal];
  if (!plan || !slot) return s;
  const r = RECIPE_BY_ID[slot.recipeId];
  if (!r) return s;
  const date = dateKey ?? addDays(weekStart, dayIdx);
  const ref = `plan:${weekStart}:${dayIdx}:${meal}`;
  const done = !slot.done;
  const days = plan.days.map((d, i) => (i === dayIdx ? { ...d, [meal]: { ...slot, done } } : d));
  const next = { ...s, plans: { ...s.plans, [weekStart]: { ...plan, days } } };
  return withDay(next, date, (d) => ({
    ...d,
    items: done ? [...d.items, recipeItem(r, slot.servings, meal, ref)] : d.items.filter((i) => i.ref !== ref),
  }));
}
