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

// 확률 가중치 — 방치(idle)는 폐지·공병만(공병은 낮은 확률), 활동(광고 줍기)은 비싼 고물↑.
// 방치는 손수레 적재량으로만 관리(일일 상한 없음). 방치 고물 EV를 아주 낮게(≈1.08냥/개) →
// 부지런히 비워가며 채워도(하루 최대 ~3카트) 광고로 현금화하므로 마진 흑자. 고철·금덩이는 줍기에서만.
export const IDLE_WEIGHTS: Record<GomulType, number> = { paper: 98, bottle: 2, scrap: 0, special: 0 };
// 활동(광고 줍기): EV≈10.6냥. 5~10개(평균 7.5) → 줍기 광고당 약 80냥(≈0.8원) = 빙수와 동급 마진(~37%).
export const ACTIVE_WEIGHTS: Record<GomulType, number> = { paper: 25, bottle: 47, scrap: 25, special: 3 };

export const CART_CAPACITY = 120;   // 손수레 최대 적재(개)
// '추가로 고물 모으기' 광고 1회당 고물 수 = 5~10개 랜덤(평균 7.5, 가끔 대박)
export const ITEMS_PER_PICK_MIN = 5;
export const ITEMS_PER_PICK_MAX = 10;

// 전환 (엽전 → 토스 포인트). 100냥 = 1원 (금덩이 1개 = 1원 잭팟).
export const YEOP_PER_WON = 100;
export const DAILY_EXCHANGE_CAP_WON = 1000;  // 일일 전환 토스 지급 캡(원) — 마케팅 상한. 실제 지급은 광고 시청량이 제한(방치 2원/일 상한)
export const LIFETIME_CAP_WON = 5000;      // 1인 누적 한도(원)

// 출석(광고 보고 1원). 하루 5회.
export const ATTEND_DAILY_LIMIT = 5;
export const ATTEND_WON = 1;

// 개근 보너스 — 7일 연속 방문 시 수집량 +10%.
export const STREAK_BONUS_DAYS = 7;
export const STREAK_BONUS_MULT = 1.1;

// 방치 수집 속도: 6분당 고물 1개 → 손수레(120개)가 12시간이면 가득. 오프라인 누적 캡도 12시간.
// 방치는 '손수레 가득'까지만 자동으로 쌓이고, 팔아서 비우면 다시 채워짐(일일 냥 상한 없음).
export const IDLE_MS_PER_ITEM = 6 * 60 * 1000;
export const OFFLINE_CAP_MS = 12 * 60 * 60 * 1000;

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
