import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// 전면광고 추상화.
// USE_MOCK=true: 샌드박스/개발용. 1.5초 지연 후 성공.
// USE_MOCK=false (Phase 5b 라이브 베타 배포 시): 실제 loadFullScreenAd + showFullScreenAd.
// R-10 인터벌 가드: MIN_INTERVAL_MS 미만 간격 호출 시 AdCooldownError.

const USE_MOCK = true;
const MOCK_DELAY_MS = 1500;
export const MIN_INTERVAL_MS = 5000;

const state = { lastPlayedAt: 0 };

export class AdCooldownError extends Error {
  constructor() {
    super('ad-cooldown');
    this.name = 'AdCooldownError';
  }
}

export class AdFailedError extends Error {
  constructor(message = 'ad-failed') {
    super(message);
    this.name = 'AdFailedError';
  }
}

export async function playInterstitial(adGroupId: string): Promise<void> {
  const now = Date.now();
  if (now - state.lastPlayedAt < MIN_INTERVAL_MS) throw new AdCooldownError();

  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
    state.lastPlayedAt = Date.now();
    return;
  }

  if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
    throw new AdFailedError('not-supported');
  }
  await loadAdAsync(adGroupId);
  await showAdAsync(adGroupId);
  state.lastPlayedAt = Date.now();
}

function loadAdAsync(adGroupId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unregister: (() => void) | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      unregister?.();
      fn();
    };
    unregister = loadFullScreenAd({
      options: { adGroupId },
      onEvent: (e) => {
        if (e.type === 'loaded') finish(resolve);
      },
      onError: (err) => finish(() => reject(err instanceof Error ? err : new AdFailedError('load-error'))),
    });
  });
}

function showAdAsync(adGroupId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unregister: (() => void) | undefined;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      unregister?.();
      fn();
    };
    unregister = showFullScreenAd({
      options: { adGroupId },
      onEvent: (e) => {
        if (e.type === 'dismissed') finish(resolve);
        else if (e.type === 'failedToShow') finish(() => reject(new AdFailedError('failed-to-show')));
      },
      onError: (err) => finish(() => reject(err instanceof Error ? err : new AdFailedError('show-error'))),
    });
  });
}
