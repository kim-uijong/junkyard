import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getServerTimeWithFallback } from '../utils/timeUtils';

export function useIdleGrowth(apply: (now: number) => void, enabled = true): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async () => {
      const now = await getServerTimeWithFallback();
      if (!cancelled) applyRef.current(now);
    };
    void run();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void run();
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled]);
}
