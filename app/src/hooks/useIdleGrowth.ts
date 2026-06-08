import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { type GomulCounts, totalCount } from '../constants/gomul';
import { getServerTimeWithFallback } from '../utils/timeUtils';

// 오프라인 복귀 시 '그동안 모은 고물' 팝업을 띄울 최소 개수(자잘한 재진입엔 안 뜨게).
const OFFLINE_POPUP_MIN = 5;

export function useIdleGrowth(
  apply: (now: number) => GomulCounts | null,
  enabled = true,
  onOfflineGain?: (gain: GomulCounts) => void
): void {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const gainRef = useRef(onOfflineGain);
  gainRef.current = onOfflineGain;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    // 서버시각을 1회(및 포그라운드마다) 가져와 오프셋을 잡고, 이후엔 로컬에서 1초마다 틱.
    // → 앱을 켜둔 동안에도 손수레가 실시간으로 차오름(클럭 조작은 포그라운드 재동기화로 제한).
    let offset = 0;
    const tick = () => {
      if (!cancelled) applyRef.current(Date.now() + offset);
    };
    // 진입/포그라운드 복귀: 그동안 쌓인 오프라인 분을 한 번에 정산 → 충분히 많으면 팝업.
    const resync = async () => {
      const server = await getServerTimeWithFallback();
      offset = server - Date.now();
      if (cancelled) return;
      const gain = applyRef.current(Date.now() + offset);
      if (gain && totalCount(gain) >= OFFLINE_POPUP_MIN) gainRef.current?.(gain);
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
