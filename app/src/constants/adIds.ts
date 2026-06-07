// 광고 ID + 프로모션 코드. 외부(콘솔) 발급 식별자 모음.
// ⚠️ 인앱광고 정책: 개발/테스트 단계에서는 반드시 '공식 테스트 ID'를 사용해야 함.
//    실제 광고 ID로 테스트하면 정책 위반(불이익). 샌드박스는 인앱광고 미지원 → 목(mock)으로 흐름만 확인.
// 출시 직전에만 IS_PRODUCTION=true 로 전환해 운영 ID 사용.

const IS_PRODUCTION = true;

// 개발/테스트 — 앱인토스 공식 테스트 광고 ID (docs/ads · 따라야 함)
const TEST = {
  banner: 'ait-ad-test-banner-id', // 리스트형(하단 고정 96px)
  interstitial: 'ait-ad-test-interstitial-id',
} as const;

// 운영(출시) — 콘솔 발급 실제 광고 단위 ID
const PROD = {
  banner: 'ait.v2.live.d8e4a509f9594143',
  interstitial: 'ait.v2.live.b56bdaffb9744510',
} as const;

export const AD_IDS = IS_PRODUCTION ? PROD : TEST;

// 프로모션 코드(토스 포인트 지급). 둘 다 콘솔 발급·승인 완료.
//   attend(출석 광고 1원) / reward(고물 모으고 포인트 받기·엽전 교환)
//   ⚠️ TEST_ 접두사 = 테스트용. 접두사 제거한 코드가 '정식(운영)' 코드.
const PROMO_TEST = {
  attend: 'TEST_01KTGZC9XVCK3DFXDCTQRTSBQ2',
  reward: 'TEST_01KTC3WX4FKP1V1DHYNMAMD1RJ',
} as const;

const PROMO_PROD = {
  attend: '01KTGZC9XVCK3DFXDCTQRTSBQ2',
  reward: '01KTC3WX4FKP1V1DHYNMAMD1RJ',
} as const;

export const PROMO_CODES = IS_PRODUCTION ? PROMO_PROD : PROMO_TEST;
