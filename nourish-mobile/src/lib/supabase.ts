import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Null when the app is built without Supabase settings (guest-only build). */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage: localStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const authEnabled = supabase !== null;

if (supabase) {
  AppState.addEventListener('change', (s) => {
    if (s === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

const TABLE = 'nourish_state';

export async function loadRemote(userId: string): Promise<unknown | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

export async function saveRemote(userId: string, data: unknown): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from(TABLE).upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}
