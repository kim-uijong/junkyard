import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { BannerAd } from '../components/BannerAd';
import { BoosterTimer } from '../components/BoosterTimer';
import { Cart } from '../components/Cart';
import { CoinIcon } from '../components/CoinIcon';
import { GomulIcon } from '../components/GomulIcon';
import { InfoModal } from '../components/InfoModal';
import { IntroOverlay } from '../components/IntroOverlay';
import { AD_IDS, PROMO_CODES } from '../constants/adIds';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import {
  ATTEND_DAILY_LIMIT,
  ATTEND_WON,
  BOOSTER_MULTIPLIER,
  CART_CAPACITY,
  GOMUL_TYPES,
  IDLE_MS_PER_ITEM,
  ITEMS_PER_PICK,
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
  } = useUserStateContext();
  const { playInterstitial } = useAds();

  useIdleGrowth(applyIdle, loaded);

  const [guideOpen, setGuideOpen] = useState(false);
  // 1초 틱 — '다음 고물까지' 진행바 애니메이션용(표시 전용, 실제 적립은 서버시각 기준).
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const showIntro = loaded && state.isFirstLaunch;

  const handleIntroDone = useCallback(() => {
    if (state.isFirstLaunch) markIntroSeen();
  }, [state.isFirstLaunch, markIntroSeen]);

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
      const result = await grantPromotion({ promotionCode: PROMO_CODES.attend, amount: ATTEND_WON });
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
  // 줍기 한 번(5개)이 안 들어갈 만큼 빈자리가 적으면 줍기 차단 → 광고 보고 덜 받는 손해 방지
  const pickBlocked = CART_CAPACITY - cartCount < ITEMS_PER_PICK;
  const isCartEmpty = cartCount <= 0;
  const isBoosterActive = state.boosterEndTime > Date.now();
  const fillRatio = cartCount / CART_CAPACITY;
  const attendDone = state.todayAttendCount >= ATTEND_DAILY_LIMIT;
  // 다음 고물 1개까지 진행도(부스터 반영). 손수레 가득 시 멈춤 상태 표시.
  let nextItemPct = 0;
  if (state.lastUpdateTime > 0) {
    const elapsed = Math.max(0, nowTick - state.lastUpdateTime);
    const boosted = Math.max(0, Math.min(state.boosterEndTime, nowTick) - state.lastUpdateTime);
    const effElapsed = elapsed - boosted + boosted * BOOSTER_MULTIPLIER;
    nextItemPct = Math.min(100, Math.round((effElapsed / IDLE_MS_PER_ITEM) * 100));
  }
  const cartYeop = sellValue(state.cart); // 손수레에 쌓인 고물의 판매가(엽전) — 실시간 증가
  const speedPct = Math.round(
    100 *
      (state.visitStreak >= STREAK_BONUS_DAYS ? STREAK_BONUS_MULT : 1) *
      (isBoosterActive ? BOOSTER_MULTIPLIER : 1)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 손수레 카드 */}
        <View style={[styles.cartCard, styles.cardShadow]}>
          {/* 모으는 속도 (부스터 중이면 2,500%로 표시) */}
          <View style={styles.speedChip}>
            <Text style={styles.speedChipText}>⚡ {COPY.main.speedChipFormat(speedPct)}</Text>
          </View>

          <Cart fillRatio={fillRatio} size={108} />

          {/* 추가로 고물 모으기 — 수레 바로 밑(작게) */}
          <ActionButton
            icon="📦"
            label={COPY.main.btnPickUp}
            tone="brand"
            compact
            ad
            disabled={pickBlocked}
            onPress={handlePickUp}
            note={
              isCartFull
                ? COPY.main.cartFullNote
                : pickBlocked
                  ? COPY.main.cartNearFullNote
                  : undefined
            }
          />

          {/* 다음 고물 1개까지 — 얇은 황금 바(부스터 시 쭉쭉 참) */}
          <View style={styles.nextWrap}>
            <View style={styles.nextRow}>
              <Text style={styles.nextLabel}>
                {isCartFull ? COPY.main.nextItemFull : COPY.main.nextItemLabel}
              </Text>
              {!isCartFull ? (
                <Text style={styles.nextPct}>
                  {isBoosterActive ? '⚡ ' : ''}
                  {nextItemPct}%
                </Text>
              ) : null}
            </View>
            <View style={styles.nextTrack}>
              <View
                style={[
                  styles.nextFill,
                  { width: `${isCartFull ? 100 : nextItemPct}%` },
                  isCartFull && styles.nextFillMuted,
                ]}
              />
            </View>
          </View>

          {/* 손수레 적재량 — 두꺼운 주황 바(전체 용량 대비) */}
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

          {/* 지금 팔면 약 N냥 */}
          <Text style={styles.cartValue}>{COPY.main.cartValueFormat(cartYeop)}</Text>

          {/* 쌓인 고물 4종 */}
          <View style={styles.gomulRow}>
            {GOMUL_TYPES.map((t) => (
              <View key={t} style={styles.gomulItem}>
                <GomulIcon type={t} size={26} />
                <Text style={styles.gomulCount}>{state.cart[t]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 빠르게 모으기(활성 시 카운트다운) / 고물 판매하기 — 한 줄 */}
        <View style={styles.actionRow}>
          {isBoosterActive ? (
            <BoosterTimer
              endTimeMs={state.boosterEndTime}
              onEnd={handleBoosterEnd}
              style={styles.flex1}
            />
          ) : (
            <ActionButton
              icon="⚡"
              label={COPY.main.btnBooster}
              tone="outline"
              compact
              ad
              style={styles.flex1}
              note={COPY.main.boosterNoteFormat(BOOSTER_MULTIPLIER)}
              onPress={handleBoosterPress}
            />
          )}
          <ActionButton
            icon="💰"
            label={COPY.main.btnSell}
            tone="gold"
            compact
            ad
            disabled={isCartEmpty}
            style={styles.flex1}
            note={isCartEmpty ? COPY.main.cartEmptyNote : COPY.main.sellNote}
            onPress={handleSell}
          />
        </View>

        {/* 내 엽전 + 토스 포인트로 받기 */}
        <View style={[styles.balanceCard, styles.cardShadow]}>
          <View style={styles.balanceLeft}>
            <CoinIcon size={34} />
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

        {/* 출석 — 광고 보고 1원 (하루 5회) */}
        <ActionButton
          icon="🎁"
          label={COPY.main.btnAttend}
          tone="outline"
          compact
          ad
          disabled={attendDone}
          onPress={handleAttend}
          note={
            attendDone
              ? COPY.main.attendDone
              : COPY.main.attendLeftFormat(ATTEND_DAILY_LIMIT - state.todayAttendCount)
          }
        />

        {/* 안내 (작은 링크) */}
        <Pressable
          style={({ pressed }) => [styles.guideLink, pressed && styles.pressed]}
          onPress={() => setGuideOpen(true)}
          hitSlop={8}
        >
          <Text style={styles.guideLinkText}>ⓘ {COPY.main.guideLink}</Text>
        </Pressable>
      </ScrollView>

      <BannerAd adGroupId={AD_IDS.banner} />

      <IntroOverlay visible={showIntro} onDone={handleIntroDone} />
      <InfoModal visible={guideOpen} onClose={() => setGuideOpen(false)} />
    </SafeAreaView>
  );
}

interface ActionButtonProps {
  label: string;
  icon?: string; // 버튼 앞 이모지 아이콘 (인지·재미 ↑)
  tone?: 'brand' | 'gold' | 'outline'; // 역할별 색
  compact?: boolean; // 작은 버튼(수레 밑 등)
  note?: string;
  disabled?: boolean;
  ad?: boolean; // 광고 필요 → 작은 AD 배지
  style?: StyleProp<ViewStyle>; // 행 배치(flex) 등
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

function ActionButton({
  label,
  icon,
  tone = 'brand',
  compact,
  note,
  disabled,
  ad,
  style,
  onPress,
}: ActionButtonProps) {
  const toneBg =
    tone === 'gold' ? styles.goldBtn : tone === 'outline' ? styles.outlineBtn : styles.brandBtn;
  const toneText =
    tone === 'gold'
      ? styles.goldBtnText
      : tone === 'outline'
        ? styles.outlineBtnText
        : styles.brandBtnText;
  return (
    <View style={[styles.btnBlock, style]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.actionBtn,
          compact && styles.actionBtnCompact,
          toneBg,
          disabled && styles.btnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        {icon ? <Text style={compact ? styles.btnIconSm : styles.btnIcon}>{icon}</Text> : null}
        <Text style={[toneText, compact && styles.btnTextSm]}>{label}</Text>
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
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, alignItems: 'center', gap: 7 },

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
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
  balanceValue: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  balanceUnit: { fontSize: 14, fontWeight: '700', color: COLORS.textMuted },
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },

  // 다음 고물 1개까지 (얇은 황금 바)
  nextWrap: { width: '100%', gap: 4 },
  nextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  nextPct: { fontSize: 12, color: '#B07A12', fontWeight: '800' },
  nextTrack: { width: '100%', height: 7, borderRadius: 999, backgroundColor: '#EFE7DA', overflow: 'hidden' },
  nextFill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.iconSun },
  nextFillMuted: { backgroundColor: '#D9C9A8' },

  progressWrap: { width: '100%', alignItems: 'center', gap: 5 },
  progressTrack: {
    width: '100%',
    height: 14,
    borderRadius: 999,
    backgroundColor: '#EFE7DA',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: COLORS.redBerry },
  progressText: { fontSize: 14, color: COLORS.text, fontWeight: '700' },

  cartValue: { fontSize: 22, fontWeight: '800', color: COLORS.redBerryShade },

  gomulRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 2 },
  gomulItem: { alignItems: 'center', gap: 4 },
  gomulCount: { fontSize: 16, fontWeight: '800', color: COLORS.text },

  speedChip: {
    backgroundColor: '#FFF6E0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  speedChipText: { fontSize: 14, color: '#B07A12', fontWeight: '800' },

  // 액션 버튼
  actionRow: { width: '100%', flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  flex1: { flex: 1 },
  btnBlock: { width: '100%', alignItems: 'center', gap: 3 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 15,
    borderRadius: 14,
    width: '100%',
    minHeight: 54,
  },
  actionBtnCompact: { paddingVertical: 9, minHeight: 40, borderRadius: 12 },
  brandBtn: { backgroundColor: COLORS.redBerry },
  goldBtn: { backgroundColor: COLORS.seedYellow },
  outlineBtn: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: COLORS.redBerry },
  btnIcon: { fontSize: 18 },
  btnIconSm: { fontSize: 15 },
  brandBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  goldBtnText: { color: COLORS.seedBrown, fontSize: 16, fontWeight: '800' },
  outlineBtnText: { color: COLORS.redBerry, fontSize: 16, fontWeight: '800' },
  btnTextSm: { fontSize: 15 },
  adBadge: {
    position: 'absolute',
    top: 5,
    right: 7,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  btnNote: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  btnDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },

  // 안내 (작은 링크)
  guideLink: { paddingVertical: 4, paddingHorizontal: 12 },
  guideLinkText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600' },
});
