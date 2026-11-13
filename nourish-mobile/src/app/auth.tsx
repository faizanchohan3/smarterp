import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { Btn, Card, Field, Screen, Seg, T } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

export default function Auth() {
  const c = useColors();
  const { adoptAccount } = useApp();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'err' | 'ok'; text: string } | null>(null);

  const submit = async () => {
    if (!supabase) return;
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setMsg({ tone: 'err', text: 'Enter a valid email address.' });
    if (password.length < 8) return setMsg({ tone: 'err', text: 'Use a password of at least 8 characters.' });
    setBusy(true);
    setMsg(null);
    try {
      const res = mode === 'in'
        ? await supabase.auth.signInWithPassword({ email: e, password })
        : await supabase.auth.signUp({ email: e, password });
      if (res.error) throw res.error;
      if (!res.data.session) {
        setMsg({ tone: 'ok', text: 'Check your inbox and tap the confirmation link, then sign in here.' });
        setMode('in');
        return;
      }
      await adoptAccount(res.data.session);
      router.replace('/');
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Something went wrong.';
      setMsg({ tone: 'err', text: text.includes('Invalid login') ? 'That email and password do not match an account.' : text });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    if (!supabase) return;
    const e = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(e)) return setMsg({ tone: 'err', text: 'Type your email above first.' });
    const { error } = await supabase.auth.resetPasswordForEmail(e);
    setMsg(error ? { tone: 'err', text: error.message } : { tone: 'ok', text: 'If that email has an account, a reset link is on its way.' });
  };

  if (!supabase) {
    return <Screen edges={[]}><T>Account sign-in is not set up in this build.</T></Screen>;
  }
  return (
    <Screen edges={[]}>
      <Seg options={[{ v: 'in', label: 'Sign in' }, { v: 'up', label: 'Create account' }]} value={mode} onChange={(v) => { setMode(v); setMsg(null); }} />
      <Card>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'in' ? 'current-password' : 'new-password'} textContentType={mode === 'in' ? 'password' : 'newPassword'} placeholder="At least 8 characters" onSubmitEditing={submit} />
        {msg ? <T v="small" color={msg.tone === 'err' ? c.danger : c.brand}>{msg.text}</T> : null}
        {busy ? <ActivityIndicator color={c.brand} /> : <Btn title={mode === 'in' ? 'Sign in' : 'Create account'} onPress={submit} />}
        {mode === 'in' ? <Btn title="Forgot password?" kind="line" small onPress={reset} /> : null}
      </Card>
      <T v="muted">Your meals, plans and weight history are saved to your account and only you can read them. Anything you logged as a guest on this phone moves into a new account.</T>
    </Screen>
  );
}
