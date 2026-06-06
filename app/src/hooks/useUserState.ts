import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ACTIVE_WEIGHTS,
  ATTEND_DAILY_LIMIT,
  ATTEND_WON,
  BOOSTER_MS,
  BOOSTER_MULTIPLIER,
  CART_CAPACITY,
  EMPTY_COUNTS,
  IDLE_MS_PER_ITEM,
  IDLE_WEIGHTS,
  ITEMS_PER_PICK,
  LIFETIME_CAP_WON,
  OFFLINE_CAP_MS,
  STREAK_BONUS_DAYS,
  STREAK_BONUS_MULT,
  YEOP_PER_WON,
  sellValue,
  totalCount,
} from '../constants/gomul';
import { addCounts, drawGomul } from '../utils/random';
import { DEFAULT_STATE, loadUserState, saveUserState, type UserState } from '../storage/userState';

// 서버 시각(ms) → KST 날짜 키. 일일 캡/리셋 기준.
function dateKeyKST(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface UseUserStateResult {
  state: UserState;
  loaded: boolean;
  pickUp: () => void;                 // 추가로 줍기 (활동 분포)
  sellCart: () => void;               // 손수레 고물 즉시 판매 → 엽전
  commitExchange: (won: number) => void; // 엽전 → 토스 지급 후 차감
  claimAttendance: () => void;        // 출석(광고 1원) 지급 후 기록
  markIntroSeen: () => void;
  applyIdle: (now: number) => void;   // 방치 적재 + 일일 리셋
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
      // 어제 방문했으면 연속+1, 아니면 1로 리셋
      const yesterday = dateKeyKST(now - 24 * 60 * 60 * 1000);
      const visitStreak = s.todayDate === yesterday ? s.visitStreak + 1 : 1;
      dayPatch = { todayDate: today, todayExchangedWon: 0, todayAttendCount: 0, visitStreak };
    }
    // 개근 보너스: 연속 방문 7일 이상이면 수집량 +10%
    const effectiveStreak = dayPatch ? dayPatch.visitStreak! : s.visitStreak;
    const bonusMult = effectiveStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1;

    if (s.lastUpdateTime === 0) {
      setState((p) => ({ ...p, ...dayPatch, lastUpdateTime: now }));
      return;
    }
    const room = CART_CAPACITY - totalCount(s.cart);
    const usedElapsed = Math.min(Math.max(0, now - s.lastUpdateTime), OFFLINE_CAP_MS);
    if (room <= 0 || usedElapsed <= 0) {
      setState((p) => ({ ...p, ...dayPatch, lastUpdateTime: now }));
      return;
    }
    const windowStart = now - usedElapsed;
    const boostedMs = Math.max(
      0,
      Math.min(s.boosterEndTime, now) - Math.max(s.lastUpdateTime, windowStart)
    );
    const normalMs = usedElapsed - boostedMs;
    const effectiveMs = normalMs + boostedMs * BOOSTER_MULTIPLIER;
    const items = Math.min(room, Math.floor((effectiveMs / IDLE_MS_PER_ITEM) * bonusMult));
    if (items <= 0) {
      setState((p) => ({ ...p, ...dayPatch, lastUpdateTime: now }));
      return;
    }
    const drawn = drawGomul(items, IDLE_WEIGHTS);
    setState((p) => ({ ...p, ...dayPatch, cart: addCounts(p.cart, drawn), lastUpdateTime: now }));
  }, []);

  const pickUp = useCallback(() => {
    const s = stateRef.current;
    const room = CART_CAPACITY - totalCount(s.cart);
    if (room <= 0) return;
    const bonusMult = s.visitStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1;
    const drawn = drawGomul(Math.min(room, Math.round(ITEMS_PER_PICK * bonusMult)), ACTIVE_WEIGHTS);
    setState((p) => ({ ...p, cart: addCounts(p.cart, drawn) }));
  }, []);

  // 손수레 고물을 즉시 판매 → 엽전 (광고 보고 팔기 = 엽전 획득)
  const sellCart = useCallback(() => {
    setState((s) => {
      const gain = sellValue(s.cart);
      if (gain <= 0) return s;
      return { ...s, yeopjeon: s.yeopjeon + gain, cart: { ...EMPTY_COUNTS } };
    });
  }, []);

  // 토스 지급 성공 후 호출 — 엽전 차감 + 누적/일일 갱신.
  const commitExchange = useCallback((won: number) => {
    setState((s) => {
      const cost = won * YEOP_PER_WON;
      if (won <= 0 || cost > s.yeopjeon) return s;
      return {
        ...s,
        yeopjeon: s.yeopjeon - cost,
        lifetimeExchanged: s.lifetimeExchanged + won,
        todayExchangedWon: s.todayExchangedWon + won,
      };
    });
  }, []);

  // 출석 광고(1원) 성공 후 호출 — 누적/일일 출석 갱신.
  const claimAttendance = useCallback(() => {
    setState((s) => {
      if (s.todayAttendCount >= ATTEND_DAILY_LIMIT) return s;
      if (s.lifetimeExchanged >= LIFETIME_CAP_WON) return s;
      return {
        ...s,
        lifetimeExchanged: s.lifetimeExchanged + ATTEND_WON,
        todayAttendCount: s.todayAttendCount + 1,
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
