// 광고 그룹 ID + 프로모션 코드 (운영/출시용).
// ⚠️ 검수 정책: 출시 번들에는 '테스트용 광고 그룹 ID'를 넣을 수 없음 → 실제 발급 ID만 포함.
//    (테스트가 필요하면 별도 브랜치/임시로만 교체하고, 출시 번들엔 절대 남기지 말 것.)

export const AD_IDS = {
  banner: 'ait.v2.live.d8e4a509f9594143',
  interstitial: 'ait.v2.live.b56bdaffb9744510',
} as const;

// 프로모션 코드(콘솔 발급·승인 완료). attend=출석(광고 1원) / reward=고물 모으고 포인트 받기.
export const PROMO_CODES = {
  attend: '01KTGZC9XVCK3DFXDCTQRTSBQ2',
  reward: '01KTC3WX4FKP1V1DHYNMAMD1RJ',
} as const;
