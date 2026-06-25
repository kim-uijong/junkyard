import { Storage } from '@apps-in-toss/framework';
import { type GomulCounts, EMPTY_COUNTS } from '../constants/gomul';

// ⚠️ AsyncStorage는 앱인토스에서 사용 불가(화이트아웃/미영속) → 앱인토스 네이티브 Storage 사용.
// Storage.getItem/setItem/removeItem 으로 앱 재시작에도 데이터 유지.

export interface UserState {
  cart: GomulCounts;          // 손수레 (방치/활동으로 쌓이는 고물)
  yeopjeon: number;           // 인앱 재화
  lastUpdateTime: number;     // 마지막 방치 정산 서버시각(ms)
  boosterEndTime: number;
  monthExchangedWon: number;  // 이번 달 교환액(원) — 월 단위로 리셋
  exchangeMonth: string;      // 월 리셋 키 (KST yyyy-mm)
  todayDate: string;          // 일일 리셋 키 (KST yyyy-mm-dd)
  todayExchangedWon: number;  // 오늘 전환액(원)
  todayAttendCount: number;   // 오늘 출석(광고 1원) 횟수
  visitStreak: number;        // 연속 방문일 (개근 보너스용)
  isFirstLaunch: boolean;
}

const STORAGE_KEY = 'gomulsang_user_state_v1';

export const DEFAULT_STATE: UserState = {
  cart: { ...EMPTY_COUNTS },
  yeopjeon: 0,
  lastUpdateTime: 0,
  boosterEndTime: 0,
  monthExchangedWon: 0,
  exchangeMonth: '',
  todayDate: '',
  todayExchangedWon: 0,
  todayAttendCount: 0,
  visitStreak: 0,
  isFirstLaunch: true,
};

export async function loadUserState(): Promise<UserState> {
  try {
    const raw = await Storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<UserState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      cart: { ...EMPTY_COUNTS, ...(parsed.cart ?? {}) },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveUserState(state: UserState): Promise<void> {
  await Storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearUserState(): Promise<void> {
  await Storage.removeItem(STORAGE_KEY);
}
