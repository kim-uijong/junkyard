import { createRoute } from '@granite-js/react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cart } from '../src/components/Cart';
import { COLORS } from '../src/constants/colors';
import { CART_CAPACITY, GOMUL_INFO, GOMUL_TYPES } from '../src/constants/gomul';

export const Route = createRoute('/gallery', { component: Page });

function Page() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>나만의고물상 · SVG 갤러리</Text>
      <Text style={styles.caption}>개발용 시각 확인</Text>

      <Section title="손수레 적재율">
        <View style={styles.gridRow}>
          {[0, 0.33, 0.66, 1].map((f) => (
            <View key={f} style={styles.gridCell}>
              <Cart fillRatio={f} size={120} />
              <Text style={styles.cellLabel}>{Math.round(f * 100)}%</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="고물 종류 · 시세">
        {GOMUL_TYPES.map((t) => (
          <Text key={t} style={styles.gomulLine}>
            {GOMUL_INFO[t].emoji} {GOMUL_INFO[t].label} — {GOMUL_INFO[t].price}냥
          </Text>
        ))}
        <Text style={styles.caption}>손수레 적재 한도 {CART_CAPACITY}개</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.h2}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 16, paddingVertical: 24, paddingBottom: 80 },
  h1: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  caption: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20, marginTop: 4 },
  h2: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  section: { marginBottom: 28 },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  gridCell: { alignItems: 'center', marginBottom: 16, minWidth: 110 },
  cellLabel: { marginTop: 4, fontSize: 12, color: COLORS.textMuted },
  gomulLine: { fontSize: 16, color: COLORS.text, marginBottom: 8 },
});
