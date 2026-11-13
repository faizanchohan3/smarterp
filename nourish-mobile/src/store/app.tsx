import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, loadRemote, saveRemote } from '@/lib/supabase';
import { addDays, dayKey, generateWeek, targets, type Profile, type WeekPlan } from '@/lib/core';
import type { Food } from '@/data/foods';
import type { MealType } from '@/data/recipes';

export type LogItem = {
  id: string;
  meal: MealType;
  name: string;
  detail: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'food' | 'recipe';
  ref: string;
  qty: number;
};
export type DayLog = { items: LogItem[]; water: number; workouts: { name: string; minutes: number; kcal: number }[] };
export type FastRecord = { start: number; end: number; target: number };

export type AppState = {
  version: 1;
  mode: 'none' | 'guest' | 'account';
  theme: 'system' | 'light' | 'dark';
  profile: Profile | null;
  logs: Record<string, DayLog>;
  weights: { d: string; kg: number }[];
  customFoods: Food[];
  favorites: string[];
  plans: Record<string, WeekPlan>;
  shopping: { checked: string[]; extra: { id: string; name: string; done: boolean }[] };
  fast: { start: number; target: number; protocol: string } | null;
  fasts: FastRecord[];
};

const KEY = 'nourish.state.v1';

export function blankState(): AppState {
  return {
    version: 1, mode: 'none', theme: 'system', profile: null, logs: {}, weights: [], customFoods: [], favorites: [],
    plans: {}, shopping: { checked: [], extra: [] }, fast: null, fasts: [],
  };
}

function readLocal(): AppState {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return blankState();
    return { ...blankState(), ...(JSON.parse(raw) as Partial<AppState>) };
  } catch {
    return blankState();
  }
}

function prune(s: AppState): AppState {
  const cut = addDays(dayKey(), -365);
  const logs = Object.fromEntries(Object.entries(s.logs).filter(([k]) => k >= cut));
  const planCut = addDays(dayKey(), -56);
  const plans = Object.fromEntries(Object.entries(s.plans).filter(([k]) => k >= planCut));
  return { ...s, logs, plans, weights: s.weights.slice(-400), fasts: s.fasts.slice(-200) };
}

type SyncStatus = 'idle' | 'saving' | 'error';

type Ctx = {
  state: AppState;
  ready: boolean;
  session: Session | null;
  sync: SyncStatus;
  update: (fn: (s: AppState) => AppState) => void;
  /** Called after a successful Supabase sign-in. Pulls the account's data, or uploads this device's data if the account is new. */
  adoptAccount: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
  ensureWeek: (start: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(blankState);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [sync, setSync] = useState<SyncStatus>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Boot: local first, then the account copy if signed in.
  useEffect(() => {
    let alive = true;
    (async () => {
      const local = readLocal();
      let next = local;
      if (supabase && local.mode === 'account') {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setSession(data.session);
          try {
            const remote = (await loadRemote(data.session.user.id)) as Partial<AppState> | null;
            if (remote) next = { ...blankState(), ...remote, mode: 'account', theme: local.theme };
          } catch {
            setSync('error');
          }
        } else {
          next = { ...local, mode: 'none' };
        }
      }
      if (alive) {
        setState(next);
        setReady(true);
      }
    })();
    const sub = supabase?.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      alive = false;
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  const persist = useCallback(
    (s: AppState) => {
      try {
        globalThis.localStorage?.setItem(KEY, JSON.stringify(s));
      } catch {
        /* storage full or unavailable: keep running in memory */
      }
      if (s.mode === 'account' && session) {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          setSync('saving');
          try {
            await saveRemote(session.user.id, stateRef.current);
            setSync('idle');
          } catch {
            setSync('error');
          }
        }, 800);
      }
    },
    [session],
  );

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      setState((prev) => prune(fn(prev)));
    },
    [],
  );

  // Save after every change once the first load has finished.
  useEffect(() => {
    if (ready) persist(state);
  }, [state, ready, persist]);

  const adoptAccount = useCallback(async (s: Session) => {
    setSession(s);
    const remote = (await loadRemote(s.user.id)) as Partial<AppState> | null;
    const base = stateRef.current;
    const next: AppState = remote ? { ...blankState(), ...remote, mode: 'account', theme: base.theme } : { ...base, mode: 'account' };
    if (!remote) await saveRemote(s.user.id, next);
    setState(next);
  }, []);

  const signOut = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (session && stateRef.current.mode === 'account') {
      try {
        await saveRemote(session.user.id, stateRef.current);
      } catch {}
    }
    await supabase?.auth.signOut();
    const fresh = { ...blankState(), theme: stateRef.current.theme };
    setSession(null);
    setState(fresh);
  }, [session]);

  /** Makes sure a plan exists for the week starting `start`, regenerating it if the diet or calorie target changed. */
  const ensureWeek = useCallback(
    (start: string) => {
      update((s) => {
        if (!s.profile) return s;
        const kcal = targets(s.profile).kcal;
        const have = s.plans[start];
        if (have && have.diet === s.profile.diet && Math.abs(have.kcal - kcal) < 50) return s;
        const plan = generateWeek(start, s.profile, kcal);
        // Keep ticks for meals that were already eaten.
        if (have) plan.days.forEach((d, i) => (Object.keys(d) as MealType[]).forEach((m) => {
          const old = have.days[i]?.[m];
          if (old?.done && old.recipeId === d[m]?.recipeId) d[m]!.done = true;
        }));
        return { ...s, plans: { ...s.plans, [start]: plan } };
      });
    },
    [update],
  );

  const value = useMemo(() => ({ state, ready, session, sync, update, adoptAccount, signOut, ensureWeek }), [state, ready, session, sync, update, adoptAccount, signOut, ensureWeek]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside AppProvider');
  return c;
}

export function emptyDay(): DayLog {
  return { items: [], water: 0, workouts: [] };
}

export function withDay(s: AppState, key: string, fn: (d: DayLog) => DayLog): AppState {
  const d = s.logs[key] ?? emptyDay();
  return { ...s, logs: { ...s.logs, [key]: fn(d) } };
}

export function dayTotalsLog(d?: DayLog) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, burned: 0 };
  d?.items.forEach((i) => { t.kcal += i.kcal; t.protein += i.protein; t.carbs += i.carbs; t.fat += i.fat; });
  d?.workouts.forEach((w) => (t.burned += w.kcal));
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein), carbs: Math.round(t.carbs), fat: Math.round(t.fat), burned: Math.round(t.burned) };
}
