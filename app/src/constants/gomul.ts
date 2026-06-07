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

// 확률 가중치 — 방치(idle)는 싼 고물(폐지) 위주, 활동(광고 줍기)은 비싼 고물↑.
// 방치 EV를 낮춰(≈1.55냥/개) 손수레 가득(120개)=약 186냥<일일상한 200냥 → 방치만으로도 가득 채울 수 있게.
export const IDLE_WEIGHTS: Record<GomulType, number> = { paper: 90, bottle: 9, scrap: 1, special: 0 };
export const ACTIVE_WEIGHTS: Record<GomulType, number> = { paper: 25, bottle: 35, scrap: 35, special: 5 };

export const CART_CAPACITY = 120;   // 손수레 최대 적재(개)
export const ITEMS_PER_PICK = 4;    // '추가로 고물 모으기' 광고 1회당 고물 수 (100냥/원 맞춰 5→4로 마진 보전)

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

// 방치 수집 속도: 4분당 고물 1개 → 손수레(120개)가 8시간이면 가득. 오프라인 누적 캡도 8시간.
export const IDLE_MS_PER_ITEM = 4 * 60 * 1000;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;

// 방치 일일 적립 상한(냥). BM 핵심 — 방치는 '안심용 장식', 의미 있는 적립은 광고로만.
// 상한이 있으면 방치 속도는 '얼마나 빨리 상한까지 차느냐'만 결정. (무임승차 차단)
export const IDLE_DAILY_CAP_YEOP = 200; // = 2원/일 (100냥=1원)
// 방치 분포 기대값(냥/개) — 일일 상한을 개수로 환산할 때 사용. 폐지90/공병9/고철1/금덩이0 → 1.55
export const IDLE_AVG_YEOP = 1.55;

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
