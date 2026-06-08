import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { type GomulCounts, GOMUL_TYPES, sellValue, totalCount } from '../constants/gomul';
import { GomulIcon } from './GomulIcon';

interface RewardPopupProps {
  visible: boolean;
  counts: GomulCounts;
  title: string;
  onClose: () => void;
}

// 줍기/오프라인 복귀 시 획득한 고물 내역 팝업.
export function RewardPopup({ visible, counts, title, onClose }: RewardPopupProps) {
  const total = totalCount(counts);
  const yeop = sellValue(counts);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.row}>
            {GOMUL_TYPES.map((t) => (
              <View key={t} style={[styles.item, counts[t] <= 0 && styles.itemDim]}>
                <GomulIcon type={t} size={34} />
                <Text style={styles.count}>+{counts[t]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.total}>{COPY.main.rewardCountFormat(total, yeop)}</Text>

          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>{COPY.main.rewardConfirm}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  title: { fontSize: 19, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  item: { alignItems: 'center', gap: 4 },
  itemDim: { opacity: 0.3 },
  count: { fontSize: 16, fontWeight: '800', color: COLORS.redBerryShade },
  total: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  btn: {
    width: '100%',
    backgroundColor: COLORS.redBerry,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
