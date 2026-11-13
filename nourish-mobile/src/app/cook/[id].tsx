import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { Btn, Card, Row, Screen, T } from '@/components/ui';
import { RECIPE_BY_ID } from '@/data/recipes';
import { useColors } from '@/theme';

/** Large-type, one-step-at-a-time view that keeps the screen on while cooking. */
export default function Cook() {
  useKeepAwake();
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = RECIPE_BY_ID[id];
  const [step, setStep] = useState(0);
  if (!r) return <Screen edges={[]}><T>Recipe not found.</T></Screen>;
  const last = step === r.steps.length - 1;
  return (
    <Screen edges={['bottom']} scroll={false}>
      <T v="label">{r.title}</T>
      <Row gap={4}>
        {r.steps.map((_, i) => <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i <= step ? c.brand : c.surface2 }} />)}
      </Row>
      <T v="muted">Step {step + 1} of {r.steps.length} · screen stays on</T>
      <Card style={{ flex: 1, justifyContent: 'center' }}>
        <T style={{ fontSize: 26, lineHeight: 36, fontWeight: '600' }}>{r.steps[step]}</T>
      </Card>
      <Row gap={10}>
        <Btn flex title="Back" kind="ghost" icon="arrow-back" disabled={step === 0} onPress={() => setStep(step - 1)} />
        {last ? <Btn flex title="Done" icon="checkmark" onPress={() => router.back()} /> : <Btn flex title="Next step" icon="arrow-forward" onPress={() => setStep(step + 1)} />}
      </Row>
    </Screen>
  );
}
