import { grantPromotionReward } from '@apps-in-toss/framework';

// 프로모션 지급 API 추상화.
// USE_MOCK=true (Phase 4~6 코드 작업): 항상 성공 반환.
// USE_MOCK=false (Phase 6 콘솔 프로모션 발급 후): 실제 grantPromotionReward 호출.

const USE_MOCK = false;
const MOCK_DELAY_MS = 600;

export type GrantResult = { key: string } | { errorCode: string | undefined };

export interface GrantParams {
  promotionCode: string;
  amount: number;
}

export async function grantPromotion(params: GrantParams): Promise<GrantResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    return { key: `mock-${Date.now()}-${params.amount}` };
  }
  return grantPromotionReal(params);
}

async function grantPromotionReal(params: GrantParams): Promise<GrantResult> {
  const result = await grantPromotionReward({
    params: { promotionCode: params.promotionCode, amount: params.amount },
  });
  if (result === undefined) return { errorCode: undefined }; // 토스앱 버전 미지원
  if (result === 'ERROR') return { errorCode: 'ERROR' };
  if ('key' in result) return { key: result.key };
  if ('errorCode' in result) return { errorCode: result.errorCode };
  if ('code' in result && typeof result.code === 'string') return { errorCode: result.code };
  return { errorCode: 'UNKNOWN' };
}
