import { InlineAd } from '@apps-in-toss/framework';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';

// USE_REAL_BANNER=false (Phase 5a): placeholder 표시. 샌드박스에서는 광고가 안 나오므로 자리만 확인.
// USE_REAL_BANNER=true (Phase 5b 라이브 베타): 실제 InlineAd 렌더.
// 토스 5.241.0 미만 사용자(R-06)는 InlineAd가 렌더되지 않을 수 있어 placeholder가 자연스러운 fallback이 됨.

const USE_REAL_BANNER = true;

interface BannerAdProps {
  adGroupId: string;
  theme?: 'auto' | 'light' | 'dark';
  tone?: 'blackAndWhite' | 'grey';
  variant?: 'expanded' | 'card';
  impressFallbackOnMount?: boolean;
}

export const BANNER_HEIGHT = 96;

export function BannerAd(props: BannerAdProps) {
  if (USE_REAL_BANNER) {
    return (
      <View style={styles.realWrap}>
        <InlineAd
          adGroupId={props.adGroupId}
          theme={props.theme ?? 'auto'}
          tone={props.tone ?? 'blackAndWhite'}
          variant={props.variant ?? 'expanded'}
          impressFallbackOnMount={props.impressFallbackOnMount ?? true}
        />
      </View>
    );
  }
  return (
    <View style={styles.placeholder}>
      <Text style={styles.label}>{COPY.ads.placeholderLabel}</Text>
      <Text style={styles.note}>{COPY.ads.placeholderNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  realWrap: {
    width: '100%',
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  placeholder: {
    width: '100%',
    height: BANNER_HEIGHT,
    backgroundColor: '#EFE6D6',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0D4BB',
  },
  label: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  note: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
