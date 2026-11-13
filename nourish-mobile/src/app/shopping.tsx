import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, Share, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Btn, Card, Field, Row, Screen, Seg, T } from '@/components/ui';
import { buildShopping, dayKey, fmtQty, parseKey, uid, weekStart } from '@/lib/core';
import { useApp } from '@/store/app';
import { useColors } from '@/theme';

export default function Shopping() {
  const c = useColors();
  const params = useLocalSearchParams<{ week?: string }>();
  const ws = params.week ?? weekStart(dayKey());
  const { state, update, ensureWeek } = useApp();
  useEffect(() => { ensureWeek(ws); }, [ws, ensureWeek]);
  const plan = state.plans[ws];
  const isThisWeek = ws === weekStart(dayKey());
  const todayIdx = isThisWeek ? (parseKey(dayKey()).getDay() + 6) % 7 : 0;
  const [range, setRange] = useState<'rest' | 'week'>(isThisWeek ? 'rest' : 'week');
  const [extra, setExtra] = useState('');
  const lines = useMemo(() => (plan ? buildShopping(plan, range === 'rest' ? todayIdx : 0) : []), [plan, range, todayIdx]);
  const checked = new Set(state.shopping.checked);
  const toggle = (key: string) =>
    update((s) => ({ ...s, shopping: { ...s.shopping, checked: s.shopping.checked.includes(key) ? s.shopping.checked.filter((k) => k !== key) : [...s.shopping.checked, key] } }));

  const aisles = [...new Set(lines.map((l) => l.aisle))];
  const left = lines.filter((l) => !checked.has(l.key)).length + state.shopping.extra.filter((e) => !e.done).length;

  const share = () => {
    const text = aisles.map((a) => `${a}\n` + lines.filter((l) => l.aisle === a && !checked.has(l.key)).map((l) => `• ${l.name} — ${fmtQty(l.qty, l.unit)}`).join('\n')).join('\n\n')
      + (state.shopping.extra.length ? '\n\nExtras\n' + state.shopping.extra.filter((e) => !e.done).map((e) => `• ${e.name}`).join('\n') : '');
    Share.share({ message: `Nourish shopping list\n\n${text}` }).catch(() => {});
  };

  return (
    <Screen edges={['bottom']}>
      <Seg options={[{ v: 'rest', label: isThisWeek ? 'Rest of this week' : 'Whole week' }, { v: 'week', label: 'All 7 days' }]} value={range} onChange={setRange} />
      <Row between>
        <T v="muted">{left} item{left === 1 ? '' : 's'} to buy</T>
        <Row gap={8}>
          <Btn title="Share" small kind="ghost" icon="share-outline" onPress={share} />
          <Btn title="Clear ticks" small kind="line" onPress={() => update((s) => ({ ...s, shopping: { checked: [], extra: s.shopping.extra.filter((e) => !e.done) } }))} />
        </Row>
      </Row>

      {aisles.map((a) => (
        <Card key={a} style={{ gap: 0, paddingVertical: 6 }}>
          <T v="label" style={{ paddingVertical: 8 }}>{a}</T>
          {lines.filter((l) => l.aisle === a).map((l) => {
            const on = checked.has(l.key);
            return (
              <Pressable key={l.key} onPress={() => toggle(l.key)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? c.brand : c.muted} />
                <View style={{ flex: 1 }}>
                  <T v="small" style={{ fontWeight: '600', textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.5 : 1 }}>{l.name}</T>
                  <T v="muted" style={{ fontSize: 12 }} numberOfLines={1}>{l.from.join(', ')}</T>
                </View>
                <T v="num" style={{ opacity: on ? 0.5 : 1 }}>{fmtQty(l.qty, l.unit)}</T>
              </Pressable>
            );
          })}
        </Card>
      ))}

      <Card>
        <T v="h3">Extras</T>
        <Row gap={8}>
          <Field placeholder="Add an item, e.g. washing-up liquid" value={extra} onChangeText={setExtra} onSubmitEditing={() => {
            if (!extra.trim()) return;
            update((s) => ({ ...s, shopping: { ...s.shopping, extra: [...s.shopping.extra, { id: uid(), name: extra.trim().slice(0, 60), done: false }] } }));
            setExtra('');
          }} returnKeyType="done" />
        </Row>
        {state.shopping.extra.map((e) => (
          <Pressable key={e.id} onPress={() => update((s) => ({ ...s, shopping: { ...s.shopping, extra: s.shopping.extra.map((x) => (x.id === e.id ? { ...x, done: !x.done } : x)) } }))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name={e.done ? 'checkbox' : 'square-outline'} size={22} color={e.done ? c.brand : c.muted} />
            <T v="small" style={{ flex: 1, textDecorationLine: e.done ? 'line-through' : 'none' }}>{e.name}</T>
            <Pressable accessibilityLabel={`Delete ${e.name}`} hitSlop={8} onPress={() => update((s) => ({ ...s, shopping: { ...s.shopping, extra: s.shopping.extra.filter((x) => x.id !== e.id) } }))}>
              <Ionicons name="close" size={18} color={c.muted} />
            </Pressable>
          </Pressable>
        ))}
      </Card>
      <T v="muted">Quantities are added up from every recipe in your plan and scaled to your servings.</T>
    </Screen>
  );
}
