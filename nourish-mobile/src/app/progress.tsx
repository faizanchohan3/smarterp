import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Btn, Card, Field, Row, Screen, T } from '@/components/ui';
import { GOALS, addDays, bmiLabel, dayKey, parseKey, targets } from '@/lib/core';
import { dayTotalsLog, useApp } from '@/store/app';
import { useColors } from '@/theme';

export default function Progress() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { state, update } = useApp();
  const p = state.profile!;
  const T0 = targets(p);
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState('');
  const W = state.weights.slice(-30);
  const cur = W[W.length - 1]?.kg ?? p.weightKg;
  const start = state.weights[0]?.kg ?? p.weightKg;
  const bmi = cur / (p.heightCm / 100) ** 2;
  const rate = Math.abs(GOALS.find((g) => g.id === p.goal)?.delta ?? 0) * 7 / 7700;
  const weeks = rate ? Math.ceil(Math.abs(cur - p.goalKg) / rate) : 0;
  let streak = 0;
  for (let d = dayKey(); (state.logs[d]?.items.length ?? 0) > 0; d = addDays(d, -1)) streak++;

  const save = () => {
    const v = parseFloat(input.replace(',', '.'));
    if (!(v >= 30 && v <= 300)) return setMsg('Enter a weight between 30 and 300 kg.');
    const kg = Math.round(v * 10) / 10;
    update((s) => ({ ...s, profile: s.profile ? { ...s.profile, weightKg: kg } : s.profile, weights: [...s.weights.filter((x) => x.d !== dayKey()), { d: dayKey(), kg }].sort((a, b) => (a.d < b.d ? -1 : 1)) }));
    setInput('');
    setMsg('Saved. Your calorie target has been updated.');
  };

  const cw = Math.min(width - 64, 560);
  return (
    <Screen edges={['bottom']}>
      <Row gap={10}>
        <Stat label="Weight" value={`${cur} kg`} sub={`${cur - start > 0 ? '+' : ''}${(cur - start).toFixed(1)} kg since start`} />
        <Stat label="BMI" value={bmi.toFixed(1)} sub={bmiLabel(bmi)} />
        <Stat label="Streak" value={`${streak} d`} sub="days logged" />
      </Row>

      <Card>
        <Row between><T v="h3">Weight trend</T><T v="muted">{Math.abs(cur - p.goalKg).toFixed(1)} kg to goal{weeks ? ` · about ${weeks} wk` : ''}</T></Row>
        <WeightChart points={W} goal={p.goalKg} w={cw} h={190} c={c} />
        <Row gap={8} style={{ alignItems: 'flex-end' }}>
          <Field label="Today’s weight (kg)" value={input} onChangeText={setInput} keyboardType="decimal-pad" placeholder={String(cur)} onSubmitEditing={save} />
          <Btn title="Save" onPress={save} />
        </Row>
        {msg ? <T v="small" color={msg.startsWith('Saved') ? c.brand : c.danger}>{msg}</T> : null}
      </Card>

      <Card>
        <Row between><T v="h3">Calories, last 7 days</T><T v="muted">dashed = target</T></Row>
        <WeekBars state={state} target={T0.kcal} w={cw} h={170} c={c} />
      </Card>
    </Screen>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card tone="soft" style={{ flex: 1, gap: 2, padding: 12 }}>
      <T v="label">{label}</T>
      <T v="h3" style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
      <T v="muted" style={{ fontSize: 11 }}>{sub}</T>
    </Card>
  );
}

type C = ReturnType<typeof useColors>;

function WeightChart({ points, goal, w, h, c }: { points: { d: string; kg: number }[]; goal: number; w: number; h: number; c: C }) {
  if (points.length === 0) return <T v="muted">Log your weight to see a trend.</T>;
  const pad = { l: 34, r: 10, t: 14, b: 24 };
  const vals = [...points.map((x) => x.kg), goal];
  const lo = Math.floor(Math.min(...vals) - 1), hi = Math.ceil(Math.max(...vals) + 1);
  const t0 = parseKey(points[0].d).getTime();
  const t1 = Math.max(t0 + 864e5, parseKey(points[points.length - 1].d).getTime());
  const X = (d: string) => pad.l + ((parseKey(d).getTime() - t0) / (t1 - t0)) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + ((hi - v) / (hi - lo)) * (h - pad.t - pad.b);
  const path = points.map((pt, i) => `${i ? 'L' : 'M'}${X(pt.d).toFixed(1)} ${Y(pt.kg).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const fmt = (d: string) => parseKey(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const ticks = [lo, Math.round(((lo + hi) / 2) * 10) / 10, hi];
  return (
    <Svg width={w} height={h}>
      {ticks.map((v) => (
        <Line key={v} x1={pad.l} x2={w - pad.r} y1={Y(v)} y2={Y(v)} stroke={c.line} strokeWidth={1} />
      ))}
      {ticks.map((v) => (
        <SvgText key={`t${v}`} x={pad.l - 6} y={Y(v) + 4} fontSize={11} fill={c.muted} textAnchor="end">{v}</SvgText>
      ))}
      <Line x1={pad.l} x2={w - pad.r} y1={Y(goal)} y2={Y(goal)} stroke={c.accent} strokeDasharray="4 4" strokeWidth={1.5} />
      <SvgText x={w - pad.r} y={Y(goal) - 5} fontSize={11} fill={c.accent} textAnchor="end">Goal {goal}</SvgText>
      <Path d={`${path} L${X(last.d)} ${h - pad.b} L${X(points[0].d)} ${h - pad.b} Z`} fill={c.brand} opacity={0.12} />
      <Path d={path} stroke={c.brand} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {points.map((pt) => <Circle key={pt.d} cx={X(pt.d)} cy={Y(pt.kg)} r={2.5} fill={c.brand} />)}
      <Circle cx={X(last.d)} cy={Y(last.kg)} r={5} fill={c.surface} stroke={c.brand} strokeWidth={2.5} />
      <SvgText x={pad.l} y={h - 6} fontSize={11} fill={c.muted}>{fmt(points[0].d)}</SvgText>
      <SvgText x={w - pad.r} y={h - 6} fontSize={11} fill={c.muted} textAnchor="end">{fmt(last.d)}</SvgText>
    </Svg>
  );
}

function WeekBars({ state, target, w, h, c }: { state: ReturnType<typeof useApp>['state']; target: number; w: number; h: number; c: C }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(dayKey(), i - 6));
  const vals = days.map((d) => dayTotalsLog(state.logs[d]).kcal);
  const max = Math.max(target * 1.3, ...vals);
  const pad = { l: 6, r: 6, t: 16, b: 22 };
  const bw = (w - pad.l - pad.r) / 7;
  const Y = (v: number) => pad.t + (1 - v / max) * (h - pad.t - pad.b);
  return (
    <Svg width={w} height={h}>
      <Line x1={pad.l} x2={w - pad.r} y1={Y(target)} y2={Y(target)} stroke={c.accent} strokeDasharray="4 4" strokeWidth={1.5} />
      {days.map((d, i) => {
        const v = vals[i];
        const x = pad.l + i * bw + bw * 0.18;
        const label = parseKey(d).toLocaleDateString(undefined, { weekday: 'narrow' });
        return [
          v ? <Rect key={`r${d}`} x={x} y={Y(v)} width={bw * 0.64} height={Math.max(0, h - pad.b - Y(v))} rx={4} fill={v > target * 1.05 ? c.accent : c.brand} /> : null,
          v ? <SvgText key={`v${d}`} x={x + bw * 0.32} y={Y(v) - 4} fontSize={10} fill={c.muted} textAnchor="middle">{v}</SvgText> : null,
          <SvgText key={`l${d}`} x={x + bw * 0.32} y={h - 6} fontSize={11} fill={c.muted} textAnchor="middle">{label}</SvgText>,
        ];
      })}
    </Svg>
  );
}
