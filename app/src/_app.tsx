import React, { type PropsWithChildren } from 'react';
import { Text, TextInput } from 'react-native';
import { type InitialProps } from '@granite-js/react-native';
import { AppsInToss } from '@apps-in-toss/framework';
import { context } from '../require.context';
import { AdsProvider } from './hooks/AdsContext';
import { UserStateProvider } from './hooks/UserStateContext';

// OS "글자 크기/접근성 큰 글씨" 설정으로 텍스트만 부풀어 고정 dp 레이아웃이 밀리는 문제 방지
// (빙수 교훈 — 모든 기기에서 디자인 동일하게 유지).
type FontScalable = { defaultProps?: { allowFontScaling?: boolean } };
const TextDefaults = Text as unknown as FontScalable;
TextDefaults.defaultProps = { ...TextDefaults.defaultProps, allowFontScaling: false };
const TextInputDefaults = TextInput as unknown as FontScalable;
TextInputDefaults.defaultProps = { ...TextInputDefaults.defaultProps, allowFontScaling: false };

function AppContainer({ children }: PropsWithChildren<InitialProps>) {
  return (
    <UserStateProvider>
      <AdsProvider>{children}</AdsProvider>
    </UserStateProvider>
  );
}

// AppsInToss.registerApp: 토스 호스트 통합(네비게이션 바 + TDS Overlay 등) 연결.
// Granite.registerApp은 저수준이라 호스트 네비바가 안 뜸.
export default AppsInToss.registerApp(AppContainer, {
  context,
});
