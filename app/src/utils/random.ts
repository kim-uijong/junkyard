// 가중 랜덤 추첨 (빙수 weightedRandom 패턴 차용).
import {
  type GomulType,
  type GomulCounts,
  GOMUL_TYPES,
  EMPTY_COUNTS,
} from '../constants/gomul';

/** 가중치 맵에서 종류 하나를 뽑는다. */
export function pickGomul(weights: Record<GomulType, number>): GomulType {
  const total = GOMUL_TYPES.reduce((s, t) => s + weights[t], 0);
  let x = Math.random() * total;
  for (const t of GOMUL_TYPES) {
    x -= weights[t];
    if (x < 0) return t;
  }
  return 'paper';
}

/** n개를 가중치대로 뽑아 종류별 개수로 집계. */
export function drawGomul(n: number, weights: Record<GomulType, number>): GomulCounts {
  const out: GomulCounts = { ...EMPTY_COUNTS };
  for (let i = 0; i < n; i++) {
    out[pickGomul(weights)] += 1;
  }
  return out;
}

/** 두 묶음 합산. */
export function addCounts(a: GomulCounts, b: GomulCounts): GomulCounts {
  return {
    paper: a.paper + b.paper,
    bottle: a.bottle + b.bottle,
    scrap: a.scrap + b.scrap,
    special: a.special + b.special,
  };
}
