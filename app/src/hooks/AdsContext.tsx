import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import { AdLoadingPopup } from '../components/AdLoadingPopup';
import { SmallLoading } from '../components/SmallLoading';
import { AD_IDS } from '../constants/adIds';
import { playInterstitial, preloadInterstitial } from '../utils/ads';

type LoadingMode = 'small' | 'full';

interface AdsContextValue {
  playInterstitial: (adGroupId: string, loadingMode: LoadingMode) => Promise<void>;
}

const AdsContext = createContext<AdsContextValue | null>(null);

export function AdsProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<LoadingMode | null>(null);

  // 화면 진입 시 전면광고 미리 로드 → 탭 시 즉시 표시(대기시간 제거).
  useEffect(() => {
    preloadInterstitial(AD_IDS.interstitial);
  }, []);

  const play = useCallback(async (adGroupId: string, loadingMode: LoadingMode) => {
    setMode(loadingMode);
    try {
      await playInterstitial(adGroupId);
    } finally {
      setMode(null);
    }
  }, []);

  return (
    <AdsContext.Provider value={{ playInterstitial: play }}>
      {children}
      <AdLoadingPopup visible={mode === 'full'} />
      <SmallLoading visible={mode === 'small'} />
    </AdsContext.Provider>
  );
}

export function useAds(): AdsContextValue {
  const ctx = useContext(AdsContext);
  if (!ctx) throw new Error('AdsProvider not mounted');
  return ctx;
}
