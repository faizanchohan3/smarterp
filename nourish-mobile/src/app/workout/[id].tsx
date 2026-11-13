import { useEffect, useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useKeepAwake } from 'expo-keep-awake';
import { Btn, Ring, Row, Screen, T } from '@/components/ui';
import { WORKOUT_BY_ID, type Workout } from '@/data/programs';
import { burned, dayKey, youtubeSearch } from '@/lib/core';
import { useApp, withDay } from '@/store/app';
import { useColors } from '@/theme';

type Step = { name: string; sec: number; work: boolean; round?: number };

function buildSteps(w: Workout): Step[] {
  if (w.steadyMinutes) return [{ name: w.moves[0], sec: w.steadyMinutes * 60, work: true }];
  const steps: Step[] = [{ name: 'Get ready', sec: 10, work: false }];
  const rounds = w.rounds ?? 1;
  for (let r = 0; r < rounds; r++) {
    w.moves.forEach((m, i) => {
      steps.push({ name: m, sec: w.work ?? 40, work: true, round: r + 1 });
      const last = r === rounds - 1 && i === w.moves.length - 1;
      if (w.rest && !last) steps.push({ name: 'Rest', sec: w.rest, work: false });
    });
  }
  return steps;
}

export default function WorkoutTimer() {
  useKeepAwake();
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const w = WORKOUT_BY_ID[id];
  const { state, update } = useApp();
  const steps = useMemo(() => (w ? buildSteps(w) : []), [w]);
  const [pos, setPos] = useState({ i: 0, left: steps[0]?.sec ?? 0 });
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState<{ min: number; kcal: number } | null>(null);
  const posRef = useRef({ i: 0, left: steps[0]?.sec ?? 0 });
  const workSec = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!w || finished || paused) return;
    last.current = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const dt = (now - last.current) / 1000;
      last.current = now;
      const cur = posRef.current;
      if (steps[cur.i]?.work) workSec.current += dt;
      let left = cur.left - dt;
      let i = cur.i;
      if (left <= 0) {
        if (i + 1 >= steps.length) {
          clearInterval(t);
          finish();
          return;
        }
        i += 1;
        left = steps[i].sec;
        Haptics.notificationAsync(steps[i].work ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      posRef.current = { i, left };
      setPos({ i, left });
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, finished, w, steps]);

  if (!w) return <Screen edges={[]}><T>Workout not found.</T></Screen>;

  function finish() {
    const min = Math.max(1, Math.round(workSec.current / 60));
    const kcal = burned(w!.met, state.profile!.weightKg, min);
    update((s) => withDay(s, dayKey(), (d) => ({ ...d, workouts: [...d.workouts, { name: w!.name, minutes: min, kcal }] })));
    setFinished({ min, kcal });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }

  if (finished) {
    return (
      <Screen edges={['top', 'bottom']} scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <T v="label">Workout complete</T>
          <T v="display">{w.name}</T>
          <T v="h2" color={c.brand}>{finished.min} min · {finished.kcal} kcal</T>
          <T v="muted" style={{ textAlign: 'center' }}>Logged to today. Those calories are added back to your budget.</T>
        </View>
        <Btn title="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  const { i, left } = pos;
  const st = steps[i];
  const next = steps.slice(i + 1).find((s) => s.work);
  const sec = Math.max(0, Math.ceil(left));
  const shown = sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : String(sec);

  return (
    <Screen edges={['top', 'bottom']} scroll={false}>
      <Row between>
        <T v="label">{w.name}</T>
        <T v="muted">Step {i + 1} of {steps.length}</T>
      </Row>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <T v="label">{st.work ? (st.round ? `Round ${st.round} of ${w.rounds}` : 'Go') : st.name}</T>
        <T v="h1" style={{ textAlign: 'center' }}>{st.work ? st.name : next ? `Next: ${next.name}` : 'Almost done'}</T>
        <Ring value={st.sec - left} max={st.sec} size={240} stroke={18} color={st.work ? c.brand : c.accent}>
          <T v="display" style={{ fontSize: 60, lineHeight: 64, fontVariant: ['tabular-nums'] }}>{shown}</T>
          <T v="muted">{paused ? 'paused' : st.work ? 'seconds' : 'rest'}</T>
        </Ring>
        <Btn title={`How to do ${st.work ? st.name.toLowerCase() : 'this workout'}`} kind="ghost" small icon="logo-youtube"
          onPress={() => WebBrowser.openBrowserAsync(youtubeSearch(st.work ? `${st.name} exercise proper form` : w.video))} />
      </View>
      <Row gap={10}>
        <Btn flex title={paused ? 'Resume' : 'Pause'} kind="ghost" icon={paused ? 'play' : 'pause'} onPress={() => setPaused(!paused)} />
        <Btn flex title="Skip" kind="ghost" icon="play-skip-forward" onPress={() => { posRef.current = { ...posRef.current, left: 0.01 }; setPaused(false); }} />
      </Row>
      <Row gap={10}>
        <Btn flex title="Finish and log" icon="checkmark" onPress={finish} />
        <Btn flex title="Quit" kind="line" onPress={() => router.back()} />
      </Row>
    </Screen>
  );
}
