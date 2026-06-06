import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COPY } from '../constants/copy';
import { Bolt } from './icons/Bolt';

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
      <Bolt size={22} />
      <Text style={styles.text}>{`${COPY.main.boosterPrefix} ${formatRemain(endTimeMs - now)}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF6E0',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 14, color: '#B07A12', fontWeight: '800' },
});
