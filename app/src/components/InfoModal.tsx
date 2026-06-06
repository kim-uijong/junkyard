import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { GOMUL_INFO, GOMUL_TYPES } from '../constants/gomul';
import { GomulIcon } from './GomulIcon';

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function InfoModal({ visible, onClose }: InfoModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{COPY.guide.headerTitle}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.close}>{COPY.guide.close}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Section title={COPY.guide.gomulTitle}>
              {GOMUL_TYPES.map((t) => (
                <View key={t} style={styles.gomulLine}>
                  <GomulIcon type={t} size={24} />
                  <Text style={styles.line}>
                    {COPY.guide.gomulLineFormat(GOMUL_INFO[t].label, GOMUL_INFO[t].price)}
                  </Text>
                </View>
              ))}
            </Section>

            <Section title={COPY.guide.howTitle}>
              <Text style={styles.line}>{COPY.guide.howIdle}</Text>
              <Text style={styles.line}>{COPY.guide.howActive}</Text>
              <Text style={styles.line}>{COPY.guide.howMove}</Text>
            </Section>

            <Section title={COPY.guide.exchangeTitle}>
              <Text style={styles.line}>{COPY.guide.exchangeBody}</Text>
            </Section>

            <View style={styles.noticeBox}>
              <Text style={styles.notice}>{COPY.guide.notice}</Text>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDCB',
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  close: { fontSize: 14, color: COLORS.textMuted },
  content: { paddingVertical: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  sectionBody: { gap: 6 },
  gomulLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  noticeBox: {
    backgroundColor: '#FFF6E0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: COLORS.seedYellow,
  },
  notice: { fontSize: 14, fontWeight: '600', color: COLORS.redBerryShade, textAlign: 'center' },
});
