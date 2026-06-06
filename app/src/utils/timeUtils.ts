import { getServerTime } from '@apps-in-toss/framework';

// production에서는 클라이언트 시간 사용 금지(검수 요건). isSupported false거나 결과 null이면
// __DEV__ 한정 Date.now()로 fallback해서 샌드박스/개발 편의를 살린다.
// Phase 7 검수 직전 fallback을 안내 다이얼로그 + 적립 스킵으로 교체할 것.

export async function getServerTimeWithFallback(): Promise<number> {
  try {
    if (!getServerTime.isSupported()) return Date.now();
    const t = await getServerTime();
    return t ?? Date.now();
  } catch {
    return Date.now();
  }
}
