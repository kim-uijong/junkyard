import React from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';

interface MenuModalProps {
  visible: boolean;
  onClose: () => void;
  onReplayIntro: () => void;
  onReset: () => void;
}

const IS_DEV = true; // 출시 직전 false로 변경 → 초기화 메뉴 숨김

export function MenuModal({ visible, onClose, onReplayIntro, onReset }: MenuModalProps) {
  const handlePrivacy = () => {
    void Linking.openURL(COPY.menu.privacyUrl).catch(() => undefined);
  };
  const handleSupport = () => {
    Alert.alert(COPY.menu.support, COPY.menu.supportEmail);
  };
  const handleReset = () => {
    Alert.alert(COPY.menu.resetConfirmTitle, COPY.menu.resetConfirmMessage, [
      { text: COPY.menu.resetConfirmNo, style: 'cancel' },
      {
        text: COPY.menu.resetConfirmYes,
        style: 'destructive',
        onPress: () => {
          onReset();
          onClose();
        },
      },
    ]);
  };
  const handleReplay = () => {
    onReplayIntro();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{COPY.menu.headerTitle}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={styles.closeBtn}>닫기</Text>
            </Pressable>
          </View>

          <MenuItem label={COPY.menu.privacy} onPress={handlePrivacy} />
          <MenuItem label={COPY.menu.support} onPress={handleSupport} />
          <MenuItem label={COPY.menu.introReplay} onPress={handleReplay} />
          {IS_DEV ? <MenuItem label={COPY.menu.reset} onPress={handleReset} destructive /> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MenuItem({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Text style={[styles.itemLabel, destructive && styles.itemDestructive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E6D8',
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 14, color: COLORS.textMuted },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE3',
  },
  itemLabel: { fontSize: 15, color: COLORS.text },
  itemDestructive: { color: COLORS.redBerry },
  pressed: { opacity: 0.7 },
});
