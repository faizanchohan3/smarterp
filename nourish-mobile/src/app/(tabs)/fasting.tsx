import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, Ring, Row, Screen, T, VipBadge } from '@/components/ui';
import { FAST_PROTOCOLS, FAST_STAGES } from '@/data/programs';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

function hm(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function Fasting() {
  const c = useColors();
  const { state, update } = useApp();
  const [now, setNow] = useState(() => Date.now());
  const [choice, setChoice] = useState(FAST_PROTOCOLS[1].id);
  const [confirmEnd, setConfirmEnd] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const fast = state.fast;
  const elapsed = fast ? now - fast.start : 0;
  const goalMs = fast ? fast.target * 3600000 : 0;
  const hours = elapsed / 3600000;
  const stage = [...FAST_STAGES].reverse().find((s) => hours >= s.h) ?? FAST_STAGES[0];
  const reached = fast && elapsed >= goalMs;
  const protocol = FAST_PROTOCOLS.find((p) => p.id === (fast?.protocol ?? choice))!;

  const start = (offsetMin = 0) =>
    update((s) => ({ ...s, fast: { start: Date.now() - offsetMin * 60000, target: protocol.hours, protocol: protocol.id } }));
  const end = () => {
    if (!fast) return;
    update((s) => ({ ...s, fast: null, fasts: [...s.fasts, { start: fast.start, end: Date.now(), target: fast.target }] }));
    setConfirmEnd(false);
  };

  const recent = [...state.fasts].reverse().slice(0, 7);
  const completed = state.fasts.filter((f) => f.end - f.start >= f.target * 3600000).length;

  return (
    <Screen>
      <Row gap={8}><T v="h1">Fasting</T><VipBadge /></Row>

      <Card style={{ alignItems: 'center', gap: 14 }}>
        <T v="label">{fast ? (reached ? 'Goal reached' : `${protocol.name} fast`) : 'Ready when you are'}</T>
        <Ring value={fast ? elapsed : 0} max={fast ? goalMs : 1} size={230} stroke={18} color={reached ? c.accent : c.brand}>
          <T v="muted">{fast ? 'Elapsed' : 'Goal'}</T>
          <T v="display" style={{ fontVariant: ['tabular-nums'], fontSize: 36 }}>{fast ? clock(elapsed) : `${protocol.hours}h`}</T>
          {fast ? <T v="muted">{reached ? `+${hm(elapsed - goalMs)} past goal` : `${hm(goalMs - elapsed)} to go`}</T> : null}
        </Ring>
        {fast ? (
          <>
            <T v="small" style={{ textAlign: 'center' }}>Started {new Date(fast.start).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })} · ends {new Date(fast.start + goalMs).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</T>
            {confirmEnd ? (
              <View style={{ gap: 8, alignSelf: 'stretch' }}>
                <T v="small" style={{ textAlign: 'center' }}>{reached ? 'Well done. End and save this fast?' : `You are ${hm(goalMs - elapsed)} short of your goal. End anyway?`}</T>
                <Row gap={10}><Btn flex title="End fast" kind={reached ? 'primary' : 'danger'} onPress={end} /><Btn flex title="Keep going" kind="ghost" onPress={() => setConfirmEnd(false)} /></Row>
              </View>
            ) : (
              <Btn title="End fast" kind={reached ? 'primary' : 'line'} icon="stop-circle" onPress={() => setConfirmEnd(true)} style={{ alignSelf: 'stretch' }} />
            )}
          </>
        ) : (
          <View style={{ gap: 8, alignSelf: 'stretch' }}>
            <Btn title={`Start ${protocol.name} fast`} icon="play" onPress={() => start()} />
            <Btn title="I started 1 hour ago" kind="ghost" small onPress={() => start(60)} />
          </View>
        )}
      </Card>

      {fast ? (
        <Card tone="brand">
          <T v="label">What is happening now</T>
          <T v="h3">{stage.title}</T>
          <T v="small">{stage.body}</T>
        </Card>
      ) : (
        <Card>
          <T v="h3">Choose a schedule</T>
          {FAST_PROTOCOLS.map((p) => {
            const on = choice === p.id;
            return (
              <Pressable key={p.id} onPress={() => setChoice(p.id)} accessibilityRole="radio" accessibilityState={{ checked: on }}
                style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: on ? c.brand : c.line, backgroundColor: on ? c.brandSoft : 'transparent', gap: 2 }}>
                <Row between><T v="small" style={{ fontWeight: '700' }}>{p.name}</T><T v="muted">{p.hours} h fast</T></Row>
                <T v="muted">{p.note}</T>
              </Pressable>
            );
          })}
        </Card>
      )}

      <Card>
        <Row between><T v="h3">Fasting stages</T><T v="muted">timings vary by person</T></Row>
        {FAST_STAGES.map((s) => {
          const passed = fast && hours >= s.h;
          return (
            <Row key={s.h} gap={12} style={{ alignItems: 'flex-start' }}>
              <Ionicons name={passed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={passed ? c.brand : c.muted} />
              <View style={{ flex: 1 }}>
                <T v="small" style={{ fontWeight: '700' }}>{s.h}h · {s.title}</T>
                <T v="muted">{s.body}</T>
              </View>
            </Row>
          );
        })}
      </Card>

      <Card>
        <Row between><T v="h3">History</T><T v="muted">{completed} completed</T></Row>
        {recent.length === 0 ? <T v="muted">Your finished fasts appear here.</T> : recent.map((f) => {
          const ok = f.end - f.start >= f.target * 3600000;
          return (
            <Row key={f.start} between>
              <T v="small">{new Date(f.start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</T>
              <Row gap={6}><T v="num">{hm(f.end - f.start)}</T><Ionicons name={ok ? 'trophy' : 'time-outline'} size={16} color={ok ? c.gold : c.muted} /></Row>
            </Row>
          );
        })}
      </Card>
      <Btn title="Fasting guide for beginners" kind="ghost" icon="book" onPress={() => router.push('/guides')} />
      <T v="muted">Do not fast without medical advice if you are pregnant, breastfeeding, under 18, take insulin or other diabetes medicine, or have had an eating disorder.</T>
    </Screen>
  );
}
