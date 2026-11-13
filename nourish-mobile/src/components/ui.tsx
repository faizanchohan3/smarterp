import React from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark, radius, type Palette } from '@/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true, edges = ['top'], padded = true }: { children: React.ReactNode; scroll?: boolean; edges?: Edge[]; padded?: boolean }) {
  const c = useColors();
  const inner = padded ? { paddingHorizontal: 16, paddingBottom: 32, gap: 14 } : undefined;
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.bg }}>
      {scroll ? (
        <ScrollView contentContainerStyle={[{ paddingTop: 8 }, inner]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingTop: 8 }, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'muted' | 'label' | 'num';
export function T({ v = 'body', style, children, color, numberOfLines }: { v?: Variant; style?: StyleProp<TextStyle>; children: React.ReactNode; color?: string; numberOfLines?: number }) {
  const c = useColors();
  const base: Record<Variant, TextStyle> = {
    display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, color: c.ink, lineHeight: 38 },
    h1: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, color: c.ink },
    h2: { fontSize: 20, fontWeight: '700', color: c.ink },
    h3: { fontSize: 16, fontWeight: '700', color: c.ink },
    body: { fontSize: 15, color: c.ink, lineHeight: 21 },
    small: { fontSize: 13, color: c.ink, lineHeight: 18 },
    muted: { fontSize: 13, color: c.muted, lineHeight: 18 },
    label: { fontSize: 11, color: c.muted, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
    num: { fontSize: 15, color: c.ink, fontVariant: ['tabular-nums'], fontWeight: '600' },
  };
  return <Text numberOfLines={numberOfLines} style={[base[v], color ? { color } : null, style]}>{children}</Text>;
}

export function Card({ children, style, onPress, tone }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: 'soft' | 'brand' }) {
  const c = useColors();
  const bg = tone === 'soft' ? c.surface2 : tone === 'brand' ? c.brandSoft : c.surface;
  const s: ViewStyle = { backgroundColor: bg, borderRadius: radius.lg, padding: 16, borderWidth: tone ? 0 : StyleSheet.hairlineWidth * 2, borderColor: c.line, gap: 10 };
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85 }, style]}>{children}</Pressable>;
  return <View style={[s, style]}>{children}</View>;
}

export function Row({ children, style, gap = 10, between, wrap }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; gap?: number; between?: boolean; wrap?: boolean }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, between && { justifyContent: 'space-between' }, wrap && { flexWrap: 'wrap' }, style]}>{children}</View>;
}

type BtnKind = 'primary' | 'ghost' | 'line' | 'danger' | 'gold';
export function Btn({ title, onPress, kind = 'primary', icon, small, disabled, style, flex }: { title: string; onPress?: () => void; kind?: BtnKind; icon?: IconName; small?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; flex?: boolean }) {
  const c = useColors();
  const map: Record<BtnKind, [string, string, string?]> = {
    primary: [c.brand, c.brandInk], ghost: [c.surface2, c.ink], line: ['transparent', c.ink, c.line], danger: [c.danger, '#fff'], gold: [c.gold, c.bg],
  };
  const [bg, fg, border] = map[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress?.(); }}
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: small ? 10 : 13, paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 12 : 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        borderWidth: border ? 1 : 0, borderColor: border,
      }, flex && { flex: 1 }, style]}
    >
      {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, label, size = 20 }: { icon: IconName; onPress: () => void; label: string; size?: number }) {
  const c = useColors();
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" hitSlop={8} onPress={onPress}
      style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name={icon} size={size} color={c.ink} />
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected: !!on }}
      style={{ paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.surface }}>
      <Text style={{ color: on ? c.bg : c.ink, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }} style={{ marginHorizontal: -16, paddingLeft: 16, flexGrow: 0 }}>{children}</ScrollView>;
}

export function Seg<V extends string | number>({ options, value, onChange }: { options: { v: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surface2, borderRadius: 12, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable key={String(o.v)} onPress={() => onChange(o.v)} accessibilityState={{ selected: on }}
            style={{ flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', backgroundColor: on ? c.surface : 'transparent' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: on ? c.ink : c.muted }} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label?: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {label ? <T v="muted" style={{ fontWeight: '600' }}>{label}</T> : null}
      <TextInput placeholderTextColor={c.muted} {...props}
        style={[{ borderWidth: 1, borderColor: c.line, backgroundColor: c.bg, color: c.ink, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 }, props.style]} />
    </View>
  );
}

export function Ring({ value, max, size = 150, stroke = 14, color, children }: { value: number; max: number; size?: number; stroke?: number; color: string; children?: React.ReactNode }) {
  const c = useColors();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surface2} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - pct)} />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>{children}</View>
    </View>
  );
}

export function Bar({ value, max, color, label, unit = 'g' }: { value: number; max: number; color: string; label: string; unit?: string }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <View style={{ gap: 5 }}>
      <Row between><T v="small">{label}</T><T v="small" style={{ fontVariant: ['tabular-nums'] }}><Text style={{ fontWeight: '700' }}>{Math.round(value)}</Text> / {max} {unit}</T></Row>
      <View style={{ height: 8, borderRadius: 99, backgroundColor: c.surface2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', borderRadius: 99, backgroundColor: color }} />
      </View>
    </View>
  );
}

export function Stepper({ value, onChange, step = 0.5, min = 0.5, max = 20, suffix }: { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  const c = useColors();
  const b = (d: number, ic: IconName, label: string) => (
    <Pressable accessibilityLabel={label} onPress={() => onChange(Math.max(min, Math.min(max, Math.round((value + d) * 100) / 100)))}
      style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={ic} size={20} color={c.ink} />
    </Pressable>
  );
  return (
    <Row gap={12}>
      {b(-step, 'remove', 'Less')}
      <T v="h2" style={{ minWidth: 48, textAlign: 'center', fontVariant: ['tabular-nums'] }}>{value}</T>
      {b(step, 'add', 'More')}
      {suffix ? <T v="muted" style={{ flex: 1 }}>{suffix}</T> : null}
    </Row>
  );
}

export function VipBadge({ label = 'VIP' }: { label?: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.goldSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' }}>
      <Ionicons name="diamond" size={10} color={c.gold} />
      <Text style={{ color: c.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

/** Illustrated tile for a recipe: a tinted plate with an icon, so the app ships with no stock photos. */
export function RecipeArt({ hue, size = 72, icon = 'restaurant', rounded = 16 }: { hue: number; size?: number | '100%'; icon?: IconName; rounded?: number }) {
  const isDark = useIsDark();
  const bg = `hsl(${hue}, ${isDark ? 30 : 55}%, ${isDark ? 22 : 86}%)`;
  const plate = `hsl(${hue}, ${isDark ? 35 : 60}%, ${isDark ? 32 : 76}%)`;
  const ink = `hsl(${hue}, 45%, ${isDark ? 78 : 30}%)`;
  const dim = typeof size === 'number' ? size : 160;
  return (
    <View style={{ width: size, height: typeof size === 'number' ? size : 170, borderRadius: rounded, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <View style={{ width: dim * 0.62, height: dim * 0.62, borderRadius: dim, backgroundColor: plate, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={dim * 0.3} color={ink} />
      </View>
    </View>
  );
}

export function Divider() {
  const c = useColors();
  return <View style={{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.line }} />;
}

export function Macro({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <T v="h3" color={color} style={{ fontVariant: ['tabular-nums'] }}>{value}</T>
      <T v="muted" style={{ fontSize: 12 }}>{label}</T>
    </View>
  );
}

export function usePalette(): Palette {
  return useColors();
}
