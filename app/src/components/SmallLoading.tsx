import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';

interface SmallLoadingProps {
  visible: boolean;
}

export function SmallLoading({ visible }: SmallLoadingProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.pill}>
          <ActivityIndicator color={COLORS.redBerry} />
          <Text style={styles.text}>{COPY.ads.smallLoading}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
  },
  text: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
});
