import { DIET_BY_ID, type DietId } from '@/data/programs';
import { RECIPES, RECIPE_BY_ID, type MealType, type Recipe, type Aisle } from '@/data/recipes';

/* ---------- Dates ---------- */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d, 12);
  dt.setDate(dt.getDate() + n);
  return dayKey(dt);
}
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const dow = (parseKey(key).getDay() + 6) % 7;
  return addDays(key, -dow);
}
export function prettyDay(key: string): string {
  const t = dayKey();
  if (key === t) return 'Today';
  if (key === addDays(t, -1)) return 'Yesterday';
  if (key === addDays(t, 1)) return 'Tomorrow';
  return parseKey(key).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const r0 = (n: number) => Math.round(n);
export const r1 = (n: number) => Math.round(n * 10) / 10;

/* ---------- Profile & targets ---------- */
export type Sex = 'f' | 'm';
export type Goal = 'lose' | 'slow' | 'keep' | 'gain';
export type Profile = {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalKg: number;
  activity: number;
  goal: Goal;
  diet: DietId;
  mealsPerDay: 3 | 4;
};

export const ACTIVITY: { v: number; label: string }[] = [
  { v: 1.2, label: 'Desk job, little exercise' },
  { v: 1.375, label: 'Light: 1–3 workouts a week' },
  { v: 1.55, label: 'Moderate: 3–5 workouts a week' },
  { v: 1.725, label: 'Very active: 6–7 workouts a week' },
  { v: 1.9, label: 'Athlete or physical job' },
];
export const GOALS: { id: Goal; label: string; short: string; delta: number }[] = [
  { id: 'lose', label: 'Lose weight', short: 'Lose', delta: -500 },
  { id: 'slow', label: 'Lose slowly', short: 'Lose slowly', delta: -250 },
  { id: 'keep', label: 'Maintain', short: 'Maintain', delta: 0 },
  { id: 'gain', label: 'Build muscle', short: 'Gain', delta: 300 },
];

export type Targets = { bmr: number; tdee: number; kcal: number; protein: number; carbs: number; fat: number; waterGlasses: number; bmi: number };

/** Mifflin–St Jeor BMR × activity, adjusted for goal, with a safe floor. */
export function targets(p: Profile): Targets {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * p.activity;
  const delta = GOALS.find((g) => g.id === p.goal)?.delta ?? 0;
  const kcal = Math.max(Math.round((tdee + delta) / 10) * 10, p.sex === 'm' ? 1500 : 1200);
  const [sp, sc, sf] = DIET_BY_ID[p.diet].split;
  return {
    bmr: r0(bmr), tdee: r0(tdee), kcal,
    protein: r0((kcal * sp) / 100 / 4), carbs: r0((kcal * sc) / 100 / 4), fat: r0((kcal * sf) / 100 / 9),
    waterGlasses: Math.max(6, Math.round((p.weightKg * 35) / 250)),
    bmi: r1(p.weightKg / (p.heightCm / 100) ** 2),
  };
}
export function bmiLabel(b: number) {
  return b < 18.5 ? 'Underweight' : b < 25 ? 'Healthy range' : b < 30 ? 'Overweight' : 'Obese range';
}

/* ---------- Meal plan ---------- */
export type PlanSlot = { recipeId: string; servings: number; done?: boolean };
export type PlanDay = Partial<Record<MealType, PlanSlot>>;
export type WeekPlan = { start: string; diet: DietId; kcal: number; days: PlanDay[] };

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
export const MEAL_LABEL: Record<MealType, string> = { breakfast: 'Breakfast', lunch: 'Lunch', snack: 'Snack', dinner: 'Dinner' };
const SHARE: Record<MealType, number> = { breakfast: 0.27, lunch: 0.33, snack: 0.1, dinner: 0.3 };

export function recipesFor(diet: DietId, meal: MealType): Recipe[] {
  const d = DIET_BY_ID[diet];
  const list = RECIPES.filter((r) => r.meals.includes(meal) && r.tags.some((t) => d.tags.includes(t)) && !(d.exclude ?? []).some((t) => r.tags.includes(t)));
  return list.length ? list : RECIPES.filter((r) => r.meals.includes(meal));
}

function servingsFor(r: Recipe, kcal: number): number {
  return Math.min(3, Math.max(0.5, Math.round((kcal / r.kcal) * 2) / 2));
}

export function slotMeals(mealsPerDay: 3 | 4): MealType[] {
  return mealsPerDay === 4 ? MEAL_ORDER : ['breakfast', 'lunch', 'dinner'];
}

export function generateWeek(start: string, p: Profile, kcal: number): WeekPlan {
  const meals = slotMeals(p.mealsPerDay);
  const shareSum = meals.reduce((a, m) => a + SHARE[m], 0);
  const days: PlanDay[] = [];
  const seed = parseKey(start).getTime() / 864e5;
  for (let d = 0; d < 7; d++) {
    const day: PlanDay = {};
    meals.forEach((m, mi) => {
      const opts = recipesFor(p.diet, m);
      const r = opts[Math.floor(seed + d * 3 + mi) % opts.length];
      day[m] = { recipeId: r.id, servings: servingsFor(r, (kcal * SHARE[m]) / shareSum) };
    });
    days.push(day);
  }
  return { start, diet: p.diet, kcal, days };
}

export function swapSlot(plan: WeekPlan, dayIdx: number, meal: MealType, p: Profile): WeekPlan {
  const cur = plan.days[dayIdx][meal];
  const opts = recipesFor(plan.diet, meal);
  const at = opts.findIndex((r) => r.id === cur?.recipeId);
  const next = opts[(at + 1) % opts.length];
  const meals = slotMeals(p.mealsPerDay);
  const shareSum = meals.reduce((a, m) => a + SHARE[m], 0);
  const days = plan.days.map((d, i) => (i === dayIdx ? { ...d, [meal]: { recipeId: next.id, servings: servingsFor(next, (plan.kcal * SHARE[meal]) / shareSum) } } : d));
  return { ...plan, days };
}

export function dayTotals(day: PlanDay) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  Object.values(day).forEach((s) => {
    if (!s) return;
    const r = RECIPE_BY_ID[s.recipeId];
    if (!r) return;
    t.kcal += r.kcal * s.servings; t.protein += r.protein * s.servings; t.carbs += r.carbs * s.servings; t.fat += r.fat * s.servings;
  });
  return { kcal: r0(t.kcal), protein: r0(t.protein), carbs: r0(t.carbs), fat: r0(t.fat) };
}

/* ---------- Shopping list ---------- */
export type ShopLine = { key: string; name: string; unit: string; qty: number | null; aisle: Aisle; from: string[] };

export function buildShopping(plan: WeekPlan, fromDay: number): ShopLine[] {
  const map = new Map<string, ShopLine>();
  plan.days.slice(fromDay).forEach((day) => {
    Object.values(day).forEach((s) => {
      if (!s) return;
      const r = RECIPE_BY_ID[s.recipeId];
      if (!r) return;
      const factor = s.servings / r.servings;
      r.ingredients.forEach((ing) => {
        const key = `${ing.name.toLowerCase()}|${ing.unit}`;
        const line = map.get(key) ?? { key, name: ing.name, unit: ing.unit, qty: ing.qty === null ? null : 0, aisle: ing.aisle, from: [] };
        if (ing.qty !== null && line.qty !== null) line.qty += ing.qty * factor;
        if (!line.from.includes(r.title)) line.from.push(r.title);
        map.set(key, line);
      });
    });
  });
  return [...map.values()].sort((a, b) => a.aisle.localeCompare(b.aisle) || a.name.localeCompare(b.name));
}

export function fmtQty(q: number | null, unit: string): string {
  if (q === null) return 'to taste';
  const nice = q >= 10 ? Math.round(q / 5) * 5 : Math.round(q * 4) / 4;
  const frac = (n: number) => {
    const w = Math.floor(n), f = r1(n - w);
    const sym = f === 0.3 || f === 0.2 ? '¼' : f === 0.5 ? '½' : f === 0.8 || f === 0.7 ? '¾' : '';
    if (!sym) return String(r1(n));
    return w ? `${w}${sym}` : sym;
  };
  const s = nice >= 10 ? String(nice) : frac(nice);
  return unit ? `${s} ${unit}` : s;
}

/* ---------- Activity ---------- */
export function burned(met: number, kg: number, minutes: number) {
  return r0(((met * 3.5 * kg) / 200) * minutes);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function youtubeSearch(q: string) {
  return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
}
