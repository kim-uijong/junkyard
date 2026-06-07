// 나만의고물상 BM 시뮬레이션 — eCPM 1,500 · 토스 15% 수수료 가정.
// 실제 코드 상수(app/src/constants/gomul.ts)를 그대로 반영.
// 페르소나별 Monte Carlo로 광고 순수익 vs 토스 포인트 지급(마진) 계산.
// 실행: node sim/bm-sim.mjs

// ── 상수 (코드와 동일) ──────────────────────────────────────────
const PRICE = { paper: 1, bottle: 5, scrap: 20, special: 100 };
const IDLE_W = { paper: 90, bottle: 9, scrap: 1, special: 0 };
const ACTIVE_W = { paper: 25, bottle: 35, scrap: 35, special: 5 };
const TYPES = ['paper', 'bottle', 'scrap', 'special'];

const YEOP_PER_WON = 100;
const DAILY_CAP_WON = 1000;
const LIFETIME_WON = 5000;
const CART = 120;
const PICK = 4; // 줍기 광고 1회당 고물 수
const IDLE_CAP_YEOP = 200; // 방치 일일 적립 상한
const ATTEND_LIMIT = 5;
const ATTEND_WON = 1;

const ECPM = 1500;
const TOSS_FEE = 0.15;
const AD_NET = (ECPM / 1000) * (1 - TOSS_FEE); // 전면광고 1회 순수령 = 1.275원
const BANNER_NET_PER_SESSION = 0.3; // 배너: 현실 eCPM 낮아 세션당 소액(보수적)

// ── 가중 추첨 ───────────────────────────────────────────────────
function draw(W) {
  const total = TYPES.reduce((s, t) => s + W[t], 0);
  let r = Math.random() * total;
  for (const t of TYPES) {
    r -= W[t];
    if (r < 0) return PRICE[t];
  }
  return PRICE.paper;
}

// 방치: 하루 동안 일일 상한(200냥)까지 적립. 손수레(120) 단위로 판매 광고 필요.
function idleDay() {
  let yeop = 0;
  let items = 0;
  while (yeop < IDLE_CAP_YEOP && items < 1000) {
    yeop += draw(IDLE_W);
    items++;
  }
  return { yeop: Math.min(IDLE_CAP_YEOP, yeop), items };
}

// 줍기: nPick 광고 × 4개(활동 분포)
function pickupDay(nPick) {
  let yeop = 0;
  let items = 0;
  for (let i = 0; i < nPick; i++) {
    for (let j = 0; j < PICK; j++) {
      yeop += draw(ACTIVE_W);
      items++;
    }
  }
  return { yeop, items };
}

// 하루 시뮬 (정상 상태 — 누적 한도는 별도, 여기선 일일 마진)
function simDay(p) {
  const idle = p.idleOpen ? idleDay() : { yeop: 0, items: 0 };
  const pick = pickupDay(p.pickups);
  const totalItems = idle.items + pick.items;
  const cartYeop = idle.yeop + pick.yeop;

  // 판매 광고: 손수레가 가득 찰 때마다 1회 (영리한 유저는 마지막에 몰아 판매)
  const sellAds = totalItems > 0 ? Math.ceil(totalItems / CART) : 0;

  // 교환: 일일 캡(1,000원)까지. 1회 광고로 가능한 만큼 환전(영리한 유저).
  const wonAvail = Math.min(Math.floor(cartYeop / YEOP_PER_WON), DAILY_CAP_WON);
  const exchangeAds = wonAvail > 0 ? 1 : 0;
  const exchangedWon = wonAvail;

  // 출석: 광고 1회당 1원, 하루 최대 5회
  const attend = Math.min(p.attend, ATTEND_LIMIT);
  const attendWon = attend * ATTEND_WON;

  const booster = p.booster || 0; // 부스터 광고(방치 상한 때문에 지급은 0, 광고 수익만)

  const ads = p.pickups + sellAds + exchangeAds + booster + attend;
  const sessions = p.sessions || 1;
  const revenue = ads * AD_NET + (p.idleOpen || p.pickups > 0 ? BANNER_NET_PER_SESSION * sessions : 0);
  const payout = exchangedWon + attendWon;

  return { ads, revenue, payout };
}

function run(name, p, N = 50000) {
  let ads = 0;
  let rev = 0;
  let pay = 0;
  for (let i = 0; i < N; i++) {
    const r = simDay(p);
    ads += r.ads;
    rev += r.revenue;
    pay += r.payout;
  }
  const avgAds = ads / N;
  const avgRev = rev / N;
  const avgPay = pay / N;
  const margin = (avgRev - avgPay) / avgRev;
  const profit = avgRev - avgPay;
  return { name, avgAds, avgRev, avgPay, profit, margin };
}

// ── 페르소나 ────────────────────────────────────────────────────
const personas = [
  { name: '가벼운 유저   (줍기2·출석2)', pickups: 2, attend: 2, booster: 0, idleOpen: true, sessions: 1 },
  { name: '보통 유저     (줍기10·출석5)', pickups: 10, attend: 5, booster: 0, idleOpen: true, sessions: 2 },
  { name: '헤비 유저     (줍기30·출석5·부스터)', pickups: 30, attend: 5, booster: 1, idleOpen: true, sessions: 3 },
  { name: '방치충        (줍기0·출석5)', pickups: 0, attend: 5, booster: 0, idleOpen: true, sessions: 1 },
  { name: '악의적 유저   (줍기0·출석5·광고최소)', pickups: 0, attend: 5, booster: 0, idleOpen: true, sessions: 1 },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log(' 나만의고물상 BM 시뮬레이션  (eCPM 1,500원 · 토스 15% → 광고당 순수령 1.275원)');
console.log('═══════════════════════════════════════════════════════════════');
console.log(
  ['페르소나'.padEnd(34), '광고/일', '매출/일', '지급/일', '순익/일', '마진'].join('  ')
);
console.log('───────────────────────────────────────────────────────────────');
const rows = personas.map((p) => run(p.name, p));
for (const r of rows) {
  console.log(
    [
      r.name.padEnd(34),
      r.avgAds.toFixed(1).padStart(6),
      (r.avgRev.toFixed(2) + '원').padStart(8),
      (r.avgPay.toFixed(2) + '원').padStart(8),
      (r.profit.toFixed(2) + '원').padStart(8),
      ((r.margin * 100).toFixed(1) + '%').padStart(7),
    ].join('  ')
  );
}
console.log('───────────────────────────────────────────────────────────────');

// 손익분기 eCPM (출석 1원이 마진을 가장 압박 → 출석 위주 유저로 역산)
const worst = rows[rows.length - 1];
console.log(
  `\n· 최저 마진 페르소나: "${worst.name.trim()}" → ${(worst.margin * 100).toFixed(1)}% (그래도 흑자)`
);
// 출석 1광고=1원 지급. 손익분기 = 광고순수령 ≥ 1원 → eCPM*(0.85)/1000 ≥ 1 → eCPM ≥ 1176원
console.log(`· 출석(1원) 손익분기 eCPM ≈ ${Math.ceil(1000 / (1 - TOSS_FEE))}원 (이보다 낮으면 출석에서 손실)`);
console.log(`· 누적 한도 ${LIFETIME_WON.toLocaleString()}원/인 = 지급 총량의 하드 상한(서버측 프로모션 캡 필수).`);
console.log('═══════════════════════════════════════════════════════════════');
