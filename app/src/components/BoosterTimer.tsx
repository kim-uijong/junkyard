import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { Bolt } from './icons/Bolt';

interface BoosterTimerProps {
  endTimeMs: number;
  onEnd?: () => void;
  style?: StyleProp<ViewStyle>; // 행 배치(flex1) 등
}

function formatRemain(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// 부스터 활성 중에는 '빠르게 모으기' 버튼이 사라지지 않고, 이 활성 버튼(색+남은시간)으로 바뀜.
// 남은 시간이 0이 되면 onEnd 호출 → 다시 누를 수 있는 버튼으로 복귀.
export function BoosterTimer({ endTimeMs, onEnd, style }: BoosterTimerProps) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endTimeMs && !firedRef.current) {
        firedRef.current = true;
        onEnd?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTimeMs, onEnd]);

  return (
    <View style={[styles.block, style]}>
      <View style={styles.activeBtn}>
        <Bolt size={15} color="#FFFFFF" />
        <Text style={styles.time}>{formatRemain(endTimeMs - now)}</Text>
      </View>
      <Text style={styles.note}>{COPY.main.boosterPrefix}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { width: '100%', alignItems: 'center', gap: 3 },
  activeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    width: '100%',
    borderRadius: 12,
    paddingVertical: 9,
    backgroundColor: COLORS.iconSun, // 활성 = 채워진 황금색(비활성 outline과 구분)
  },
  time: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  note: { fontSize: 12, color: COLORS.redBerryShade, fontWeight: '700' },
});
