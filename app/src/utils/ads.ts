import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// 전면광고 추상화. 문서 권장 패턴: load(미리) → show → 다음 load.
// 화면 진입 시 preloadInterstitial로 미리 로드해 두면, 탭 시 즉시 표시(대기시간 X).
// USE_MOCK=true: 샌드박스/개발용. 1.5초 지연 후 성공.
// R-10 인터벌 가드: MIN_INTERVAL_MS 미만 간격 호출 시 AdCooldownError.

const USE_MOCK = false;
const MOCK_DELAY_MS = 1500;
export const MIN_INTERVAL_MS = 5000;

// lastPlayedAt: 인터벌 가드. inFlight: 재생 중 중복 호출 차단(더블탭 이중보상 방지).
// loaded: 미리 로드 완료 여부. loadPromise: 진행 중인 로드(중복 로드 방지, 같은 adGroupId 1개만).
const state = { lastPlayedAt: 0, inFlight: false, loaded: false };
let loadPromise: Promise<void> | null = null;

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

// 광고가 준비될 때까지의 Promise. 이미 로드됐으면 즉시 resolve, 진행 중이면 그 Promise 재사용.
function ensureLoaded(adGroupId: string): Promise<void> {
  if (state.loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = loadAdAsync(adGroupId)
    .then(() => {
      state.loaded = true;
    })
    .finally(() => {
      loadPromise = null;
    });
  return loadPromise;
}

// 화면 진입 / 광고 닫힘 직후 호출 → 다음 광고를 백그라운드로 미리 로드.
export function preloadInterstitial(adGroupId: string): void {
  if (USE_MOCK) return;
  if (!loadFullScreenAd.isSupported()) return;
  void ensureLoaded(adGroupId).catch(() => undefined);
}

export async function playInterstitial(adGroupId: string): Promise<void> {
  if (state.inFlight) throw new AdCooldownError();
  const now = Date.now();
  if (now - state.lastPlayedAt < MIN_INTERVAL_MS) throw new AdCooldownError();

  state.inFlight = true;
  try {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, MOCK_DELAY_MS));
      state.lastPlayedAt = Date.now();
      return;
    }

    if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
      throw new AdFailedError('not-supported');
    }
    // 미리 로드돼 있으면 즉시, 아니면 로드 완료까지 대기(폴백).
    await ensureLoaded(adGroupId);
    state.loaded = false; // 소비
    await showAdAsync(adGroupId);
    state.lastPlayedAt = Date.now();
  } finally {
    state.inFlight = false;
    preloadInterstitial(adGroupId); // 다음 광고 미리 로드
  }
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
