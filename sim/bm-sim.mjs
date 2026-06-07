// 나만의고물상 BM/악용 시뮬레이션 — eCPM 1,500 · 토스 15% 수수료.
// 현재 코드 상수 반영(2026-06-07): 방치 98/2(EV1.08), 활동 24/53/20/2(EV8.98), 줍기 5개,
//   방치 일일 냥 상한 없음(손수레 적재량으로만), 6분/개(12h 가득).
// 실행: node sim/bm-sim.mjs

const PRICE = { paper: 1, bottle: 5, scrap: 20, special: 100 };
const IDLE_W = { paper: 98, bottle: 2, scrap: 0, special: 0 };
const ACTIVE_W = { paper: 24, bottle: 53, scrap: 20, special: 2 };
const TYPES = ['paper', 'bottle', 'scrap', 'special'];

const YEOP_PER_WON = 100;
const DAILY_CAP_WON = 1000;
const CART = 120;
const PICK = 5;
const ATTEND_LIMIT = 5;

const ECPM = 1500;
const AD_NET = (ECPM / 1000) * 0.85; // 전면광고 1회 순수령 = 1.275원
const BANNER_NET_PER_SESSION = 0.3;

function draw(W) {
  const total = TYPES.reduce((s, t) => s + W[t], 0);
  let r = Math.random() * total;
  for (const t of TYPES) {
    r -= W[t];
    if (r < 0) return PRICE[t];
  }
  return PRICE.paper;
}
function cartIdleYeop() {
  let y = 0;
  for (let i = 0; i < CART; i++) y += draw(IDLE_W);
  return y; // 방치로 가득 채운 손수레 값 ≈130냥
}
function pickupYeop(n) {
  let y = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < PICK; j++) y += draw(ACTIVE_W);
  return y;
}

// p: { pickups, attend, idleCarts, booster }
function simDay(p) {
  const idleYeop = (p.idleCarts || 0) > 0 ? Array.from({ length: p.idleCarts }, cartIdleYeop).reduce((a, b) => a + b, 0) : 0;
  const pickY = pickupYeop(p.pickups);
  const totalYeop = idleYeop + pickY;

  // 판매 광고: 손수레가 찰 때마다 1회 (방치 카트 + 줍기 분량)
  const sellAds = (p.idleCarts || 0) + (p.pickups > 0 ? Math.ceil((p.pickups * PICK) / CART) : 0);

  // 교환: 일일 캡(1,000원)까지 1광고로 환전
  const wonAvail = Math.min(Math.floor(totalYeop / YEOP_PER_WON), DAILY_CAP_WON);
  const exchangeAds = wonAvail > 0 ? 1 : 0;

  const attend = Math.min(p.attend, ATTEND_LIMIT);
  const booster = p.booster || 0;

  const ads = p.pickups + sellAds + exchangeAds + booster + attend;
  const revenue = ads * AD_NET + BANNER_NET_PER_SESSION;
  const payout = wonAvail + attend; // 교환 + 출석(1원씩)
  return { ads, revenue, payout };
}

function run(name, p, N = 50000) {
  let ads = 0, rev = 0, pay = 0;
  for (let i = 0; i < N; i++) {
    const r = simDay(p);
    ads += r.ads; rev += r.revenue; pay += r.payout;
  }
  const avgRev = rev / N, avgPay = pay / N;
  return { name, avgAds: ads / N, avgRev, avgPay, profit: avgRev - avgPay, margin: (avgRev - avgPay) / avgRev };
}

const personas = [
  { name: '가벼운 유저   (줍기3·출석2·방치1카트)', pickups: 3, attend: 2, idleCarts: 1 },
  { name: '보통 유저     (줍기10·출석5·방치1카트)', pickups: 10, attend: 5, idleCarts: 1 },
  { name: '헤비 유저     (줍기30·출석5·방치2·부스터)', pickups: 30, attend: 5, idleCarts: 2, booster: 1 },
  { name: '방치충        (줍기0·출석5·방치2카트)', pickups: 0, attend: 5, idleCarts: 2 },
  { name: '악의적-경제   (광고최소·방치2·출석5)', pickups: 0, attend: 5, idleCarts: 2 },
];

console.log('═══════════════════════════════════════════════════════════════════');
console.log(' 나만의고물상 BM/악용 시뮬  (eCPM 1,500 · 토스 15% → 광고당 1.275원)');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(['페르소나'.padEnd(38), '광고/일', '매출/일', '지급/일', '순익/일', '마진'].join(' '));
console.log('───────────────────────────────────────────────────────────────────');
for (const p of personas) {
  const r = run(p.name, p);
  console.log([
    r.name.padEnd(38),
    r.avgAds.toFixed(1).padStart(6),
    (r.avgRev.toFixed(2) + '원').padStart(8),
    (r.avgPay.toFixed(2) + '원').padStart(8),
    (r.profit.toFixed(2) + '원').padStart(8),
    ((r.margin * 100).toFixed(0) + '%').padStart(5),
  ].join(' '));
}
console.log('───────────────────────────────────────────────────────────────────');
console.log('· 방치 가득 1카트 ≈ ' + Math.round(cartIdleYeop()) + '냥(≈' + (cartIdleYeop() / 100).toFixed(1) + '원). 카트당 판매광고 필수.');
console.log('· 출석(1원) 손익분기 eCPM ≈ ' + Math.ceil(1000 / 0.85) + '원.');
console.log('· ⚠️ 무제한 시계조작/로컬조작은 클라로 못 막음 → 콘솔 서버측 프로모션 캡(일일1,000·누적5,000)이 최종 방어.');
console.log('═══════════════════════════════════════════════════════════════════');
