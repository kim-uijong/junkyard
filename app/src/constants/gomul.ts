// 나만의고물상 핵심 상수 — 고물 종류/시세/확률/한도. BM_DESIGN.md 기준.

export type GomulType = 'paper' | 'bottle' | 'scrap' | 'special';

export const GOMUL_TYPES: GomulType[] = ['paper', 'bottle', 'scrap', 'special'];

export interface GomulInfo {
  label: string;
  emoji: string;
  price: number; // 개당 엽전 (시세)
}

export const GOMUL_INFO: Record<GomulType, GomulInfo> = {
  paper:   { label: '폐지', emoji: '📄', price: 1 },
  bottle:  { label: '공병', emoji: '🍾', price: 5 },
  scrap:   { label: '고철', emoji: '⚙️', price: 20 },
  special: { label: '금덩이', emoji: '🪙', price: 100 },
};

// 확률 가중치 — 방치(idle)는 싼 고물↑, 활동(광고 줍기)은 비싼 고물↑.
export const IDLE_WEIGHTS: Record<GomulType, number> = { paper: 70, bottle: 22, scrap: 7, special: 1 };
export const ACTIVE_WEIGHTS: Record<GomulType, number> = { paper: 25, bottle: 35, scrap: 35, special: 5 };

export const CART_CAPACITY = 120;   // 손수레 최대 적재(개)
export const ITEMS_PER_PICK = 5;    // '추가로 줍기' 광고 1회당 고물 수

// 전환 (엽전 → 토스 포인트). 130냥 = 1원.
export const YEOP_PER_WON = 130;
export const DAILY_EXCHANGE_CAP_WON = 15;  // 일일 전환 토스 지급 캡(원)
export const LIFETIME_CAP_WON = 5000;      // 1인 누적 한도(원)

// 출석(광고 보고 1원). 하루 5회.
export const ATTEND_DAILY_LIMIT = 5;
export const ATTEND_WON = 1;

// 개근 보너스 — 7일 연속 방문 시 수집량 +10%.
export const STREAK_BONUS_DAYS = 7;
export const STREAK_BONUS_MULT = 1.1;

// 방치 수집 속도: 8초당 고물 1개 (손수레가 눈에 보이게 차오름). 오프라인 누적 캡 8시간.
// 지급은 엽전→토스 교환의 일일 캡(15원)이 묶으므로 방치가 빨라도 BM 안전.
export const IDLE_MS_PER_ITEM = 8 * 1000;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;

// 빠르게 모으기(부스터): 일정 시간 수집 속도 25배.
export const BOOSTER_MULTIPLIER = 25;
export const BOOSTER_MS = 60 * 60 * 1000;

export type GomulCounts = Record<GomulType, number>;

export const EMPTY_COUNTS: GomulCounts = { paper: 0, bottle: 0, scrap: 0, special: 0 };

export function totalCount(c: GomulCounts): number {
  return c.paper + c.bottle + c.scrap + c.special;
}

// 고물 묶음의 판매가(엽전) 합.
export function sellValue(c: GomulCounts): number {
  return (
    c.paper * GOMUL_INFO.paper.price +
    c.bottle * GOMUL_INFO.bottle.price +
    c.scrap * GOMUL_INFO.scrap.price +
    c.special * GOMUL_INFO.special.price
  );
}
