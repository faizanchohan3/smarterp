import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import { Btn, Card, Row, Screen, T } from '@/components/ui';
import { GUIDES } from '@/data/programs';
import { youtubeSearch } from '@/lib/core';
import { useColors } from '@/theme';

export default function Guides() {
  const c = useColors();
  const [open, setOpen] = useState<string | null>(GUIDES[0].id);
  return (
    <Screen edges={['bottom']}>
      <T v="muted">Short reads to help you eat well, plus videos you can watch on YouTube.</T>
      {GUIDES.map((g) => {
        const isOpen = open === g.id;
        return (
          <Card key={g.id}>
            <Pressable onPress={() => setOpen(isOpen ? null : g.id)} accessibilityState={{ expanded: isOpen }}>
              <Row between>
                <View style={{ flex: 1 }}>
                  <T v="h3">{g.title}</T>
                  <T v="muted">{g.minutes} min read</T>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={20} color={c.muted} />
              </Row>
            </Pressable>
            {isOpen ? (
              <View style={{ gap: 12 }}>
                {g.sections.map((s, i) => (
                  <View key={i} style={{ gap: 4 }}>
                    <T v="label">{s.h}</T>
                    {s.items.map((it) => (
                      <Row key={it} gap={8} style={{ alignItems: 'flex-start' }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c.brand, marginTop: 7 }} />
                        <T v="small" style={{ flex: 1 }}>{it}</T>
                      </Row>
                    ))}
                  </View>
                ))}
                <Btn title="Watch videos on this" kind="ghost" small icon="logo-youtube" onPress={() => WebBrowser.openBrowserAsync(youtubeSearch(g.video))} />
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}
