import { COPY } from '../constants/copy';

// 프로모션 SDK 에러 → 사용자 노출 메시지 매핑. 텍스트는 copy.ts에서.

export interface ExchangeError {
  message: string;
  canRetry: boolean;
}

export function promotionErrorMessage(errorCode: string | undefined): ExchangeError {
  const e = COPY.promotionError;
  if (errorCode === undefined) {
    return { message: e.versionMessage, canRetry: false };
  }
  switch (errorCode) {
    case '4100':
      return { message: e.retryMessage, canRetry: true };
    case '4109':
      return { message: e.suspendedMessage, canRetry: false };
    case '4110':
      return { message: e.retryMessage, canRetry: true };
    case '4112':
      return { message: e.budgetMessage, canRetry: false };
    case '4114':
      return { message: e.overLimitMessage, canRetry: false };
    case 'ERROR':
      return { message: e.retryMessage, canRetry: true };
    default:
      return { message: e.unknownFormat(errorCode), canRetry: true };
  }
}
