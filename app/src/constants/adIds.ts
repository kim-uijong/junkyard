// 광고 ID. Phase 7 출시 직전 IS_PRODUCTION true + 운영 ID로 교체.
// 운영 ID 사용 시 토스 정책 제재 가능 (테스트 단계에서는 절대 사용 금지).

const IS_PRODUCTION = false;

const TEST = {
  banner: 'ait-ad-test-banner-id',
  interstitial: 'ait-ad-test-interstitial-id',
} as const;

const PROD = {
  banner: 'TODO_PROD_BANNER_ID',
  interstitial: 'TODO_PROD_INTERSTITIAL_ID',
} as const;

export const AD_IDS = IS_PRODUCTION ? PROD : TEST;
