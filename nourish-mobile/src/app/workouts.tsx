import { useState } from 'react';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Btn, Card, Row, Screen, T } from '@/components/ui';
import { WORKOUTS, workoutMinutes } from '@/data/programs';
import { burned, dayKey, youtubeSearch } from '@/lib/core';
import { useApp, withDay } from '@/store/app';
import { useColors } from '@/theme';

export default function Workouts() {
  const c = useColors();
  const { state, update } = useApp();
  const kg = state.profile!.weightKg;
  const [logged, setLogged] = useState<string | null>(null);
  return (
    <Screen edges={['bottom']}>
      <T v="muted">Start the guided timer, or open follow-along videos. Calories are estimated for {kg} kg.</T>
      {logged ? <T v="small" color={c.brand}>{logged}</T> : null}
      {WORKOUTS.map((w) => {
        const min = workoutMinutes(w);
        const kc = burned(w.met, kg, min);
        return (
          <Card key={w.id}>
            <Row between><T v="h3">{w.name}</T><T v="label">{w.level}</T></Row>
            <T v="muted">{min} min · about {kc} kcal · {w.steadyMinutes ? 'continuous' : `${w.rounds} × ${w.moves.length} moves, ${w.work}s on${w.rest ? ` / ${w.rest}s rest` : ''}`}</T>
            <T v="small">{w.moves.join(' · ')}</T>
            <Row gap={8} wrap>
              <Btn title="Start" small icon="play" onPress={() => router.push(`/workout/${w.id}`)} />
              <Btn title="Videos" small kind="ghost" icon="logo-youtube" onPress={() => WebBrowser.openBrowserAsync(youtubeSearch(w.video))} />
              <Btn title="Log as done" small kind="line" onPress={() => {
                update((s) => withDay(s, dayKey(), (d) => ({ ...d, workouts: [...d.workouts, { name: w.name, minutes: min, kcal: kc }] })));
                setLogged(`Logged ${w.name}: ${kc} kcal added back to today.`);
              }} />
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
