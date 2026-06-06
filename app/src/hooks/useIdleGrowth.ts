import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getServerTimeWithFallback } from '../utils/timeUtils';

export function useIdleGrowth(apply: (now: number) => void, enabled = true): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // 서버시각을 1회(및 포그라운드마다) 가져와 오프셋을 잡고, 이후엔 로컬에서 1초마다 틱.
    // → 앱을 켜둔 동안에도 손수레가 실시간으로 차오름(클럭 조작은 포그라운드 재동기화로 제한).
    let offset = 0;
    const tick = () => {
      if (!cancelled) applyRef.current(Date.now() + offset);
    };
    const resync = async () => {
      const server = await getServerTimeWithFallback();
      offset = server - Date.now();
      tick();
    };
    void resync();
    const id = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') void resync();
    });
    return () => {
      cancelled = true;
      clearInterval(id);
      sub.remove();
    };
  }, [enabled]);
}
