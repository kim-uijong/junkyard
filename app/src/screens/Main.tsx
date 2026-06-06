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
import { InfoModal } from '../components/InfoModal';
import { IntroOverlay } from '../components/IntroOverlay';
import { MenuModal } from '../components/MenuModal';
import { AD_IDS } from '../constants/adIds';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import {
  ATTEND_DAILY_LIMIT,
  ATTEND_WON,
  BOOSTER_MULTIPLIER,
  CART_CAPACITY,
  STREAK_BONUS_DAYS,
  STREAK_BONUS_MULT,
  sellValue,
  totalCount,
} from '../constants/gomul';
import { useAds } from '../hooks/AdsContext';
import { useIdleGrowth } from '../hooks/useIdleGrowth';
import { useUserStateContext } from '../hooks/UserStateContext';
import { AdCooldownError } from '../utils/ads';
import { grantPromotion } from '../utils/promotion';
import { promotionErrorMessage } from '../utils/promotionErrors';
import { getServerTimeWithFallback } from '../utils/timeUtils';

const PROMO_ATTEND = 'GOMUL_DAILY';

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
    claimAttendance,
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

  const handleAttend = useCallback(async () => {
    if (state.todayAttendCount >= ATTEND_DAILY_LIMIT) return;
    try {
      await playInterstitial(AD_IDS.interstitial, 'small');
      const result = await grantPromotion({ promotionCode: PROMO_ATTEND, amount: ATTEND_WON });
      if ('key' in result) {
        claimAttendance();
      } else {
        const { message } = promotionErrorMessage(result.errorCode);
        Alert.alert(COPY.main.adErrorTitle, message);
      }
    } catch (e) {
      showAdError(e);
    }
  }, [state.todayAttendCount, playInterstitial, claimAttendance, showAdError]);

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
  const attendDone = state.todayAttendCount >= ATTEND_DAILY_LIMIT;
  const cartYeop = sellValue(state.cart); // 손수레에 쌓인 고물의 판매가(엽전) — 실시간 증가
  const speedPct = Math.round(
    100 *
      (state.visitStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1) *
      (isBoosterActive ? BOOSTER_MULTIPLIER : 1)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{COPY.main.headerTitle}</Text>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
          <Text style={styles.menuBtn}>{COPY.main.menuLabel}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 출석 — 광고 보고 1원 (하루 5회) */}
        <SecondaryButton
          label={COPY.main.btnAttend}
          disabled={attendDone}
          ad
          onPress={handleAttend}
          note={
            attendDone
              ? COPY.main.attendDone
              : COPY.main.attendLeftFormat(ATTEND_DAILY_LIMIT - state.todayAttendCount)
          }
        />

        {/* 손수레 */}
        <View style={styles.cartCard}>
          <View style={styles.cartStatRow}>
            <Text style={styles.cartStat}>
              {COPY.main.capacityLabel}  {COPY.main.capacityFormat(cartCount, CART_CAPACITY)}
            </Text>
            <Text style={styles.cartStat}>
              {COPY.main.speedLabel}  {COPY.main.speedFormat(speedPct)}
            </Text>
          </View>
          {state.visitStreak > 0 ? (
            <Text style={styles.streakText}>
              {COPY.main.streakFormat(state.visitStreak)}
              {state.visitStreak >= STREAK_BONUS_DAYS ? ` · ${COPY.main.streakBonusSuffix}` : ''}
            </Text>
          ) : null}
          <Cart fillRatio={fillRatio} size={220} />
          <Text style={styles.cartValue}>{COPY.main.cartValueFormat(cartYeop)}</Text>
          <PrimaryButton
            label={COPY.main.btnPickUp}
            disabled={isCartFull}
            ad
            onPress={handlePickUp}
            note={isCartFull ? COPY.main.cartFullNote : COPY.main.btnNoteAd}
          />
        </View>

        {/* 엽전 */}
        <View style={styles.yeopBox}>
          <Text style={styles.yeopLabel}>{COPY.main.yeopLabel}</Text>
          <Text style={styles.yeopValue}>
            {state.yeopjeon.toLocaleString()} {COPY.main.yeopUnit}
          </Text>
        </View>

        {/* 빠르게 모으기 / 창고로 옮기기 */}
        {isBoosterActive ? (
          <BoosterTimer endTimeMs={state.boosterEndTime} onEnd={handleBoosterEnd} />
        ) : (
          <SecondaryButton
            label={COPY.main.btnBooster}
            ad
            onPress={handleBoosterPress}
            note={COPY.main.btnNoteBoosterDuration}
          />
        )}

        <PrimaryButton
          label={COPY.main.btnSell}
          disabled={isCartEmpty}
          ad
          onPress={handleSell}
          note={isCartEmpty ? COPY.main.cartEmptyNote : COPY.main.btnNoteAd}
        />

        <Pressable
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          onPress={onGoExchange}
        >
          <Text style={styles.linkText}>{COPY.main.exchangeLink}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.link, pressed && styles.pressed]}
          onPress={() => setGuideOpen(true)}
        >
          <Text style={styles.linkText}>{COPY.main.guideLink}</Text>
        </Pressable>
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
  disabled?: boolean;
  ad?: boolean; // 광고 시청이 필요한 버튼이면 작은 AD 배지 표시
  onPress?: () => void;
}

// 광고 시청이 필요함을 알리는 작은 배지
function AdBadge() {
  return (
    <View style={styles.adBadge}>
      <Text style={styles.adBadgeText}>AD</Text>
    </View>
  );
}

function PrimaryButton({ label, note, disabled, ad, onPress }: ButtonProps) {
  return (
    <View style={styles.btnBlock}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryBtn,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Text style={styles.primaryBtnText}>{label}</Text>
        {ad ? <AdBadge /> : null}
      </Pressable>
      {note ? <Text style={styles.btnNote}>{note}</Text> : null}
    </View>
  );
}

function SecondaryButton({ label, note, disabled, ad, onPress }: ButtonProps) {
  return (
    <View style={styles.btnBlock}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.secondaryBtn,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDCB',
    backgroundColor: COLORS.bg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  menuBtn: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, alignItems: 'center', gap: 16 },
  cartCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  cartStatRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartStat: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  streakText: { fontSize: 13, color: COLORS.redBerryShade, fontWeight: '700' },
  cartValue: { fontSize: 22, fontWeight: '800', color: COLORS.redBerryShade },
  yeopBox: { width: '100%', alignItems: 'center', gap: 2 },
  yeopLabel: { fontSize: 13, color: COLORS.textMuted },
  yeopValue: { fontSize: 26, fontWeight: '800', color: COLORS.redBerryShade },
  btnBlock: { width: '100%', alignItems: 'center', gap: 6 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.redBerry,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.iconSun,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  secondaryBtnText: { color: COLORS.iconSun, fontSize: 16, fontWeight: '700' },
  adBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  btnNote: { fontSize: 12, color: COLORS.textMuted },
  btnDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  link: { paddingVertical: 10, paddingHorizontal: 16 },
  linkText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
});
