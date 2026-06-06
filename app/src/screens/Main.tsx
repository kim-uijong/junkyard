import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BannerAd } from '../components/BannerAd';
import { BoosterTimer } from '../components/BoosterTimer';
import { Cart } from '../components/Cart';
import { CoinIcon } from '../components/CoinIcon';
import { GomulIcon } from '../components/GomulIcon';
import { InfoModal } from '../components/InfoModal';
import { IntroOverlay } from '../components/IntroOverlay';
import { MenuModal } from '../components/MenuModal';
import { AD_IDS } from '../constants/adIds';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import {
  BOOSTER_MULTIPLIER,
  CART_CAPACITY,
  GOMUL_TYPES,
  STREAK_BONUS_DAYS,
  STREAK_BONUS_MULT,
  sellValue,
  totalCount,
} from '../constants/gomul';
import { useAds } from '../hooks/AdsContext';
import { useIdleGrowth } from '../hooks/useIdleGrowth';
import { useUserStateContext } from '../hooks/UserStateContext';
import { AdCooldownError } from '../utils/ads';
import { getServerTimeWithFallback } from '../utils/timeUtils';

interface MainProps {
  onGoExchange?: () => void;
}

export function Main({ onGoExchange }: MainProps) {
  const {
    state,
    loaded,
    pickUp,
    sellCart,
    applyIdle,
    activateBooster,
    markIntroSeen,
    resetForDev,
  } = useUserStateContext();
  const { playInterstitial } = useAds();

  useIdleGrowth(applyIdle, loaded);

  const [introOverride, setIntroOverride] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const showIntro = loaded && (state.isFirstLaunch || introOverride);

  const handleIntroDone = useCallback(() => {
    if (state.isFirstLaunch) markIntroSeen();
    setIntroOverride(false);
  }, [state.isFirstLaunch, markIntroSeen]);

  const handleReplayIntro = useCallback(() => setIntroOverride(true), []);

  const showAdError = useCallback((err: unknown) => {
    if (err instanceof AdCooldownError) return;
    Alert.alert(COPY.main.adErrorTitle, COPY.main.adErrorMessage);
  }, []);

  const handlePickUp = useCallback(async () => {
    try {
      await playInterstitial(AD_IDS.interstitial, 'small');
      pickUp();
    } catch (e) {
      showAdError(e);
    }
  }, [playInterstitial, pickUp, showAdError]);

  const handleSell = useCallback(async () => {
    try {
      await playInterstitial(AD_IDS.interstitial, 'full');
      sellCart();
    } catch (e) {
      showAdError(e);
    }
  }, [playInterstitial, sellCart, showAdError]);

  const handleBoosterPress = useCallback(async () => {
    try {
      await playInterstitial(AD_IDS.interstitial, 'full');
      const now = await getServerTimeWithFallback();
      activateBooster(now);
    } catch (e) {
      showAdError(e);
    }
  }, [playInterstitial, activateBooster, showAdError]);

  const handleBoosterEnd = useCallback(async () => {
    const now = await getServerTimeWithFallback();
    applyIdle(now);
  }, [applyIdle]);

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={COLORS.redBerry} />
      </SafeAreaView>
    );
  }

  const cartCount = totalCount(state.cart);
  const isCartFull = cartCount >= CART_CAPACITY;
  const isCartEmpty = cartCount <= 0;
  const isBoosterActive = state.boosterEndTime > Date.now();
  const fillRatio = cartCount / CART_CAPACITY;
  const cartYeop = sellValue(state.cart); // 손수레에 쌓인 고물의 판매가(엽전) — 실시간 증가
  const speedPct = Math.round(
    100 *
      (state.visitStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1) *
      (isBoosterActive ? BOOSTER_MULTIPLIER : 1)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 내 엽전 + 토스 포인트로 받기 (가장 보고 싶은 정보 = 맨 위) */}
        <View style={[styles.balanceCard, styles.cardShadow]}>
          <View style={styles.balanceLeft}>
            <CoinIcon size={38} />
            <View>
              <Text style={styles.balanceLabel}>{COPY.main.balanceLabel}</Text>
              <Text style={styles.balanceValue}>
                {state.yeopjeon.toLocaleString()}
                <Text style={styles.balanceUnit}> {COPY.main.yeopUnit}</Text>
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onGoExchange}
            style={({ pressed }) => [styles.cashOutBtn, pressed && styles.pressed]}
            hitSlop={6}
          >
            <Text style={styles.cashOutText}>{COPY.main.cashOutBtn}</Text>
            <Text style={styles.cashOutArrow}>›</Text>
          </Pressable>
        </View>

        {/* 손수레 카드 */}
        <View style={[styles.cartCard, styles.cardShadow]}>
          {state.visitStreak > 0 ? (
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>
                {COPY.main.streakFormat(state.visitStreak)}
                {state.visitStreak >= STREAK_BONUS_DAYS ? ` · ${COPY.main.streakBonusSuffix}` : ''}
              </Text>
            </View>
          ) : null}

          <Cart fillRatio={fillRatio} size={168} />

          {/* 적재량 진행 막대 (5060 직관) */}
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressFill, { width: `${Math.min(100, Math.round(fillRatio * 100))}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              {COPY.main.capacityLabel} {COPY.main.capacityFormat(cartCount, CART_CAPACITY)}
            </Text>
          </View>

          {/* 쌓인 고물 값 (강조) */}
          <Text style={styles.cartValue}>{COPY.main.cartValueFormat(cartYeop)}</Text>

          {/* 쌓인 고물 4종 */}
          <View style={styles.gomulRow}>
            {GOMUL_TYPES.map((t) => (
              <View key={t} style={styles.gomulItem}>
                <GomulIcon type={t} size={30} />
                <Text style={styles.gomulCount}>{state.cart[t]}</Text>
              </View>
            ))}
          </View>

          {/* 모으는 속도 / 부스터 진행 */}
          {isBoosterActive ? (
            <BoosterTimer endTimeMs={state.boosterEndTime} onEnd={handleBoosterEnd} />
          ) : (
            <View style={styles.speedChip}>
              <Text style={styles.speedChipText}>⚡ {COPY.main.speedChipFormat(speedPct)}</Text>
            </View>
          )}
        </View>

        {/* 액션 — 색으로 역할 구분 */}
        <PrimaryButton
          icon="📦"
          label={COPY.main.btnPickUp}
          disabled={isCartFull}
          ad
          onPress={handlePickUp}
          note={isCartFull ? COPY.main.cartFullNote : COPY.main.btnNoteAd}
        />
        <PrimaryButton
          icon="💰"
          tone="gold"
          label={COPY.main.btnSell}
          disabled={isCartEmpty}
          ad
          onPress={handleSell}
          note={isCartEmpty ? COPY.main.cartEmptyNote : COPY.main.btnNoteAd}
        />
        {!isBoosterActive ? (
          <SecondaryButton
            icon="⚡"
            label={COPY.main.btnBooster}
            ad
            onPress={handleBoosterPress}
            note={COPY.main.btnNoteBoosterDuration}
          />
        ) : null}

        {/* 안내 / 메뉴 (칩) */}
        <View style={styles.chipRow}>
          <Pressable
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            onPress={() => setGuideOpen(true)}
          >
            <Text style={styles.chipText}>ⓘ  {COPY.main.guideLink}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            onPress={() => setMenuOpen(true)}
          >
            <Text style={styles.chipText}>☰  {COPY.main.menuLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BannerAd adGroupId={AD_IDS.banner} />

      <IntroOverlay visible={showIntro} onDone={handleIntroDone} />
      <InfoModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
      <MenuModal
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onReplayIntro={handleReplayIntro}
        onReset={resetForDev}
      />
    </SafeAreaView>
  );
}

interface ButtonProps {
  label: string;
  note?: string;
  icon?: string; // 버튼 앞 이모지 아이콘 (인지·재미 ↑)
  tone?: 'brand' | 'gold'; // primary 버튼 색(역할 구분)
  disabled?: boolean;
  ad?: boolean; // 광고 시청이 필요한 버튼이면 작은 AD 배지 표시
  onPress?: () => void;
}

// 광고 시청이 필요함을 알리는 작은 배지 (모든 배경에서 가독)
function AdBadge() {
  return (
    <View style={styles.adBadge}>
      <Text style={styles.adBadgeText}>AD</Text>
    </View>
  );
}

function PrimaryButton({ label, note, icon, tone = 'brand', disabled, ad, onPress }: ButtonProps) {
  const gold = tone === 'gold';
  return (
    <View style={styles.btnBlock}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.bigBtn,
          gold ? styles.goldBtn : styles.brandBtn,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
        <Text style={gold ? styles.goldBtnText : styles.primaryBtnText}>{label}</Text>
        {ad ? <AdBadge /> : null}
      </Pressable>
      {note ? <Text style={styles.btnNote}>{note}</Text> : null}
    </View>
  );
}

function SecondaryButton({ label, note, icon, disabled, ad, onPress }: ButtonProps) {
  return (
    <View style={styles.btnBlock}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.bigBtn,
          styles.secondaryBtn,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        {icon ? <Text style={styles.btnIcon}>{icon}</Text> : null}
        <Text style={styles.secondaryBtnText}>{label}</Text>
        {ad ? <AdBadge /> : null}
      </Pressable>
      {note ? <Text style={styles.btnNote}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 32, alignItems: 'center', gap: 14 },

  cardShadow: {
    shadowColor: '#5A4A3A',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  // 내 엽전 바
  balanceCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  balanceValue: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  balanceUnit: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  cashOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.redBerry,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
  },
  cashOutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  cashOutArrow: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: -2 },

  // 손수레 카드
  cartCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  streakPill: {
    backgroundColor: '#FFEFE2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  streakPillText: { fontSize: 13, color: COLORS.redBerryShade, fontWeight: '700' },

  progressWrap: { width: '100%', alignItems: 'center', gap: 6 },
  progressTrack: {
    width: '100%',
    height: 16,
    borderRadius: 999,
    backgroundColor: '#EFE7DA',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.redBerry },
  progressText: { fontSize: 14, color: COLORS.text, fontWeight: '700' },

  cartValue: { fontSize: 23, fontWeight: '800', color: COLORS.redBerryShade },

  gomulRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 2 },
  gomulItem: { alignItems: 'center', gap: 4 },
  gomulCount: { fontSize: 17, fontWeight: '800', color: COLORS.text },

  speedChip: {
    backgroundColor: '#FFF6E0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  speedChipText: { fontSize: 14, color: '#B07A12', fontWeight: '800' },

  // 액션 버튼
  btnBlock: { width: '100%', alignItems: 'center', gap: 6 },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    width: '100%',
    maxWidth: 360,
    minHeight: 56,
  },
  brandBtn: { backgroundColor: COLORS.redBerry },
  goldBtn: { backgroundColor: COLORS.seedYellow },
  secondaryBtn: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: COLORS.redBerry },
  btnIcon: { fontSize: 19 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  goldBtnText: { color: COLORS.seedBrown, fontSize: 17, fontWeight: '800' },
  secondaryBtnText: { color: COLORS.redBerry, fontSize: 17, fontWeight: '800' },
  adBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  btnNote: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },

  // 안내 / 메뉴 칩
  chipRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4D9C8',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  chipText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
