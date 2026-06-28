import { drawGomul, pickGomul, addCounts } from '../random';
import {
  ACTIVE_WEIGHTS,
  IDLE_WEIGHTS,
  GOMUL_TYPES,
  EMPTY_COUNTS,
  sellValue,
  totalCount,
  type GomulType,
} from '../../constants/gomul';

describe('pickGomul — 가중치 분포', () => {
  function ratios(weights: Record<GomulType, number>) {
    const N = 200_000;
    const cnt: Record<GomulType, number> = { paper: 0, bottle: 0, scrap: 0, special: 0 };
    for (let i = 0; i < N; i++) cnt[pickGomul(weights)]++;
    const total = GOMUL_TYPES.reduce((s, t) => s + weights[t], 0);
    for (const t of GOMUL_TYPES) {
      const actual = cnt[t] / N;
      const expected = weights[t] / total;
      expect(Math.abs(actual - expected)).toBeLessThan(0.02);
    }
  }
  it('방치 분포가 94/5/1/0에 근접해야 한다 (폐지 위주·고철 소량)', () => ratios(IDLE_WEIGHTS));
  it('활동 분포가 30/48/20/2에 근접해야 한다', () => ratios(ACTIVE_WEIGHTS));
});

describe('drawGomul — 개수/합산', () => {
  it('뽑은 총 개수가 요청 수와 같아야 한다', () => {
    for (let i = 0; i < 1000; i++) {
      const n = Math.floor(Math.random() * 20);
      expect(totalCount(drawGomul(n, ACTIVE_WEIGHTS))).toBe(n);
    }
  });
  it('addCounts가 두 묶음을 정확히 합쳐야 한다', () => {
    const a = drawGomul(10, IDLE_WEIGHTS);
    const b = drawGomul(7, ACTIVE_WEIGHTS);
    expect(totalCount(addCounts(a, b))).toBe(17);
  });
});

describe('sellValue — 판매가(엽전)', () => {
  it('빈 묶음은 0냥', () => {
    expect(sellValue({ ...EMPTY_COUNTS })).toBe(0);
  });
  it('시세대로 합산되어야 한다', () => {
    expect(sellValue({ paper: 2, bottle: 1, scrap: 1, special: 1 })).toBe(2 * 1 + 5 + 20 + 100);
  });
  it('고물이 1개라도 있으면 판매가는 1냥 이상이어야 한다 (0냥 방지)', () => {
    for (let i = 0; i < 10_000; i++) {
      const c = drawGomul(1 + Math.floor(Math.random() * 5), IDLE_WEIGHTS);
      expect(sellValue(c)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('활동 인센티브 — 광고로 줍는 게 더 값짐', () => {
  it('활동 분포 1개 기댓값 > 방치 분포 1개 기댓값', () => {
    const N = 300_000;
    let idle = 0;
    let active = 0;
    for (let i = 0; i < N; i++) {
      idle += sellValue(drawGomul(1, IDLE_WEIGHTS));
      active += sellValue(drawGomul(1, ACTIVE_WEIGHTS));
    }
    const idleAvg = idle / N;
    const activeAvg = active / N;
    expect(idleAvg).toBeGreaterThan(1.1); // ≈1.35 (폐지 위주·고철 소량)
    expect(idleAvg).toBeLessThan(1.7);
    expect(activeAvg).toBeGreaterThan(7); // ≈8.7
    expect(activeAvg).toBeLessThan(10.5);
    expect(activeAvg).toBeGreaterThan(idleAvg * 2.5);
  });
});
