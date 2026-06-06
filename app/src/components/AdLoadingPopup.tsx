import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { Cart } from './Cart';

interface AdLoadingPopupProps {
  visible: boolean;
}

export function AdLoadingPopup({ visible }: AdLoadingPopupProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Cart fillRatio={1} size={150} />
          <Text style={styles.title}>{COPY.ads.fullPopupTitle}</Text>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.redBerry} />
            <Text style={styles.loadingText}>{COPY.ads.fullPopupLoading}</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 14,
    width: '100%',
    maxWidth: 360,
  },
  title: { fontSize: 15, color: COLORS.text, textAlign: 'center', fontWeight: '500', lineHeight: 22 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  loadingText: { fontSize: 13, color: COLORS.textMuted },
});
