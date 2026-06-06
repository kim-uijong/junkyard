import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { Sun } from './icons/Sun';

interface BoosterTimerProps {
  endTimeMs: number;
  onEnd?: () => void;
}

function formatRemain(ms: number): string {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function BoosterTimer({ endTimeMs, onEnd }: BoosterTimerProps) {
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
    <View style={styles.wrap}>
      <Sun size={22} />
      <Text style={styles.text}>{`${COPY.main.boosterPrefix} ${formatRemain(endTimeMs - now)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF6E0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    justifyContent: 'center',
  },
  text: { fontSize: 15, color: COLORS.iconSun, fontWeight: '600' },
});
