import { router } from '@granite-js/plugin-router';
import { hermes } from '@granite-js/plugin-hermes';
import { defineConfig } from '@granite-js/react-native/config';
import { appsInToss } from '@apps-in-toss/framework/plugins';

// ait build로 .ait artifact를 만들려면 appsInToss plugin 필수.
// appType: 'general'이 있어야 토스 비게임 네비게이션 바(앱이름+더보기+X)가 정식으로 뜸.

export default defineConfig({
  appName: 'junkyard',
  scheme: 'intoss',
  plugins: [
    router(),
    hermes(),
    appsInToss({
      appType: 'general',
      navigationBar: {
        withBackButton: true,
        withHomeButton: false,
      },
      brand: {
        // ⚠️ 콘솔 '앱 정보 등록'에 제출된 이름과 정확히 일치해야 함
        displayName: '나만의고물상',
        primaryColor: '#C46A2B',
        // TODO: 실제 아이콘 PNG를 호스팅 후 URL 교체 (현재 placeholder)
        icon: 'https://raw.githubusercontent.com/kim-uijong/gomulsang-asset/main/icon.png',
      },
      permissions: [],
    }),
  ],
});
