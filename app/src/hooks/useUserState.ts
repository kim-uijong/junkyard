import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACTIVE_WEIGHTS,
  ATTEND_DAILY_LIMIT,
  BOOSTER_MS,
  BOOSTER_MULTIPLIER,
  CART_CAPACITY,
  EMPTY_COUNTS,
  IDLE_MS_PER_ITEM,
  IDLE_WEIGHTS,
  ITEMS_PER_PICK_MAX,
  ITEMS_PER_PICK_MIN,
  OFFLINE_CAP_MS,
  STREAK_BONUS_DAYS,
  STREAK_BONUS_MULT,
  YEOP_PER_WON,
  type GomulCounts,
  sellValue,
  totalCount,
} from '../constants/gomul';
import { addCounts, drawGomul } from '../utils/random';
import { DEFAULT_STATE, loadUserState, saveUserState, type UserState } from '../storage/userState';

// 서버 시각(ms) → KST 날짜 키. 일일 캡/리셋 기준.
function dateKeyKST(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 주 리셋 키(KST, 월요일 시작 7일 버킷). 서버시각 기준이라 클럭 조작에 안전.
// 1970-01-01(목)=day0 → (day+3)/7 로 월요일 경계 정렬.
function weekKeyKST(ms: number): string {
  const dayIndex = Math.floor((ms + 9 * 60 * 60 * 1000) / 86400000);
  return `W${Math.floor((dayIndex + 3) / 7)}`;
}

export interface UseUserStateResult {
  state: UserState;
  loaded: boolean;
  pickUp: () => GomulCounts | null;   // 추가로 줍기 (활동 분포) → 주운 고물 반환
  sellCart: () => void;               // 손수레 고물 즉시 판매 → 엽전
  commitExchange: (won: number) => void; // 엽전 → 토스 지급 후 차감
  claimAttendance: () => void;        // 출석(광고 1원) 지급 후 기록
  markIntroSeen: () => void;
  applyIdle: (now: number) => GomulCounts | null; // 방치 적재 + 일일 리셋 → 적재된 고물 반환
  activateBooster: (now: number, durationMs?: number) => void;
  resetForDev: () => void;
}

export function useUserState(): UseUserStateResult {
  const [state, setState] = useState<UserState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let cancelled = false;
    loadUserState().then((s) => {
      if (!cancelled) {
        setState(s);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveChain.current = saveChain.current.then(() => saveUserState(state)).catch(() => undefined);
  }, [state, loaded]);

  // 방치 적재 — 경과 시간만큼 방치 분포로 고물을 손수레에 채움(적재 한도까지). 일일 리셋 포함.
  const applyIdle = useCallback((now: number) => {
    const s = stateRef.current;
    const today = dateKeyKST(now);
    let dayPatch: Partial<UserState> | null = null;
    if (s.todayDate !== today) {
      // 어제 방문했으면 연속+1, 아니면 1로 리셋.
      const yesterday = dateKeyKST(now - 24 * 60 * 60 * 1000);
      const visitStreak = s.todayDate === yesterday ? s.visitStreak + 1 : 1;
      dayPatch = {
        todayDate: today,
        todayExchangedWon: 0,
        todayAttendCount: 0,
        visitStreak,
      };
    }
    // 주가 바뀌면 이번 주 교환액 리셋(7일 단위 교환 한도). 주 변경은 항상 일 변경을 동반.
    const thisWeek = weekKeyKST(now);
    if (s.exchangeWeek !== thisWeek) {
      dayPatch = { ...(dayPatch ?? {}), weekExchangedWon: 0, exchangeWeek: thisWeek };
    }
    // 개근 보너스: 연속 방문 7일 이상이면 수집량 +10%
    const effectiveStreak = dayPatch ? dayPatch.visitStreak! : s.visitStreak;
    const bonusMult = effectiveStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1;

    if (s.lastUpdateTime === 0) {
      setState((p) => ({ ...p, ...dayPatch, lastUpdateTime: now }));
      return null;
    }
    const room = CART_CAPACITY - totalCount(s.cart);
    if (room <= 0) {
      // 손수레 가득 — 더 안 쌓임(팔아서 비우면 다시 채워짐). 기준 시각만 갱신.
      setState((p) => ({ ...p, ...dayPatch, lastUpdateTime: now }));
      return null;
    }
    const usedElapsed = Math.min(Math.max(0, now - s.lastUpdateTime), OFFLINE_CAP_MS);
    const windowStart = now - usedElapsed;
    const boostedMs = Math.max(
      0,
      Math.min(s.boosterEndTime, now) - Math.max(s.lastUpdateTime, windowStart)
    );
    const normalMs = usedElapsed - boostedMs;
    const effectiveMs = normalMs + boostedMs * BOOSTER_MULTIPLIER;
    // 방치 적재는 손수레 빈자리(room)까지만. 일일 냥 상한 없음.
    const items = Math.min(room, Math.floor((effectiveMs / IDLE_MS_PER_ITEM) * bonusMult));
    if (items <= 0) {
      // 아직 1개를 못 채움 → lastUpdateTime 유지(잔여 시간 누적), 날짜 리셋만 반영
      if (dayPatch) setState((p) => ({ ...p, ...dayPatch }));
      return null;
    }
    const drawn = drawGomul(items, IDLE_WEIGHTS);
    setState((p) => ({ ...p, ...dayPatch, cart: addCounts(p.cart, drawn), lastUpdateTime: now }));
    return drawn;
  }, []);

  const pickUp = useCallback((): GomulCounts | null => {
    const s = stateRef.current;
    const room = CART_CAPACITY - totalCount(s.cart);
    if (room <= 0) return null;
    const bonusMult = s.visitStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1;
    // 5~10개 랜덤
    const pickCount =
      ITEMS_PER_PICK_MIN + Math.floor(Math.random() * (ITEMS_PER_PICK_MAX - ITEMS_PER_PICK_MIN + 1));
    const drawn = drawGomul(Math.min(room, Math.round(pickCount * bonusMult)), ACTIVE_WEIGHTS);
    setState((p) => ({ ...p, cart: addCounts(p.cart, drawn) }));
    return drawn;
  }, []);

  // 손수레 고물을 즉시 판매 → 엽전 (광고 보고 팔기 = 엽전 획득)
  const sellCart = useCallback(() => {
    setState((s) => {
      const gain = sellValue(s.cart);
      if (gain <= 0) return s;
      return { ...s, yeopjeon: s.yeopjeon + gain, cart: { ...EMPTY_COUNTS } };
    });
  }, []);

  // 토스 지급 성공 후 호출 — 엽전 차감 + 이번 주/일일 교환액 갱신.
  const commitExchange = useCallback((won: number) => {
    setState((s) => {
      const cost = won * YEOP_PER_WON;
      if (won <= 0 || cost > s.yeopjeon) return s;
      return {
        ...s,
        yeopjeon: s.yeopjeon - cost,
        weekExchangedWon: s.weekExchangedWon + won,
        todayExchangedWon: s.todayExchangedWon + won,
      };
    });
  }, []);

  // 출석 광고(1원) 성공 후 호출 — 일일 출석 횟수 + 쿨타임 시각 갱신.
  const claimAttendance = useCallback(() => {
    setState((s) => {
      if (s.todayAttendCount >= ATTEND_DAILY_LIMIT) return s;
      return {
        ...s,
        todayAttendCount: s.todayAttendCount + 1,
        lastAttendTime: Date.now(),
      };
    });
  }, []);

  const activateBooster = useCallback((now: number, durationMs: number = BOOSTER_MS) => {
    setState((s) => (s.boosterEndTime > now ? s : { ...s, boosterEndTime: now + durationMs }));
  }, []);

  const markIntroSeen = useCallback(() => {
    setState((s) => (s.isFirstLaunch ? { ...s, isFirstLaunch: false } : s));
  }, []);

  const resetForDev = useCallback(() => {
    setState({ ...DEFAULT_STATE, isFirstLaunch: false });
  }, []);

  return {
    state,
    loaded,
    pickUp,
    sellCart,
    commitExchange,
    claimAttendance,
    markIntroSeen,
    applyIdle,
    activateBooster,
    resetForDev,
  };
}
