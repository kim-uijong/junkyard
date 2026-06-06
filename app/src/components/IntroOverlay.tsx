import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { Cart } from './Cart';

interface IntroOverlayProps {
  visible: boolean;
  autoCloseMs?: number;
  onDone: () => void;
}

export function IntroOverlay({ visible, autoCloseMs = 3000, onDone }: IntroOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onDone, autoCloseMs);
    return () => clearTimeout(id);
  }, [visible, autoCloseMs, onDone]);

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <View style={styles.container}>
        <View style={styles.logoCircle}>
          <Cart fillRatio={1} size={200} />
        </View>
        <Text style={styles.appName}>{COPY.appName}</Text>
        <Text style={styles.title}>{COPY.intro.title}</Text>
        <Text style={styles.subtitle}>{COPY.intro.subtitle}</Text>

        <View style={styles.spacer} />

        <Pressable
          onPress={onDone}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Text style={styles.ctaText}>{COPY.intro.cta}</Text>
        </Pressable>
        <Text style={styles.autoHint}>{COPY.intro.autoHint}</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  logoCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#EFE6D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  title: { fontSize: 16, color: COLORS.text, textAlign: 'center', lineHeight: 24 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  spacer: { height: 20 },
  cta: {
    backgroundColor: COLORS.redBerry,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 12,
  },
  ctaText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  autoHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 6 },
});
