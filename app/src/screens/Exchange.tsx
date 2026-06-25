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
import { AD_IDS, PROMO_CODES } from '../constants/adIds';
import { COLORS } from '../constants/colors';
import { COPY } from '../constants/copy';
import { DAILY_EXCHANGE_CAP_WON, WEEKLY_EXCHANGE_CAP_WON, YEOP_PER_WON } from '../constants/gomul';
import { useUserStateContext } from '../hooks/UserStateContext';
import { grantPromotion } from '../utils/promotion';
import { promotionErrorMessage } from '../utils/promotionErrors';

interface ExchangeProps {
  onBack?: () => void;
}

export function Exchange({ onBack }: ExchangeProps) {
  const { state, loaded, commitExchange } = useUserStateContext();
  const [pending, setPending] = useState(false);

  // 전환 가능 원 = min(엽전/환율, 일일 잔여, 이번 주 잔여)
  const dailyLeft = Math.max(0, DAILY_EXCHANGE_CAP_WON - state.todayExchangedWon);
  const weeklyLeft = Math.max(0, WEEKLY_EXCHANGE_CAP_WON - state.weekExchangedWon);
  const exchangeableWon = Math.min(Math.floor(state.yeopjeon / YEOP_PER_WON), dailyLeft, weeklyLeft);

  const handleExchange = useCallback(async () => {
    if (pending || exchangeableWon < 1) return;
    const yeopCost = exchangeableWon * YEOP_PER_WON;
    const confirmed = await confirmDialog(
      COPY.exchange.confirmMessageFormat(yeopCost, exchangeableWon)
    );
    if (!confirmed) return;

    setPending(true);
    try {
      // 엽전→토스 포인트 교환은 광고 없이 바로 지급(UX 우선). 고물→엽전(판매)에만 광고.
      const result = await grantPromotion({ promotionCode: PROMO_CODES.reward, amount: exchangeableWon });
      if ('key' in result) {
        commitExchange(exchangeableWon);
        Alert.alert(COPY.exchange.successTitle, COPY.exchange.successMessageFormat(exchangeableWon));
      } else {
        const { message } = promotionErrorMessage(result.errorCode);
        Alert.alert(COPY.exchange.failTitle, message);
      }
    } catch {
      Alert.alert(COPY.exchange.failTitle, COPY.exchange.failGenericMessage);
    } finally {
      setPending(false);
    }
  }, [pending, exchangeableWon, commitExchange]);

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={COLORS.redBerry} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.backBtn}>{COPY.exchange.back}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{COPY.exchange.headerTitle}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 엽전 잔액 */}
        <View style={styles.yeopRow}>
          <Text style={styles.yeopBalance}>{COPY.exchange.yeopBalanceFormat(state.yeopjeon)}</Text>
        </View>

        {/* 엽전 → 토스 포인트 */}
        <Text style={styles.sectionLabel}>{COPY.exchange.exchangeSection}</Text>
        <Pressable
          disabled={pending || exchangeableWon < 1}
          onPress={() => void handleExchange()}
          style={({ pressed }) => [
            styles.exchangeBtn,
            (pending || exchangeableWon < 1) && styles.btnDisabled,
            pressed && exchangeableWon >= 1 && styles.pressed,
          ]}
        >
          <Text style={styles.exchangeBtnText}>
            {exchangeableWon >= 1
              ? COPY.exchange.btnExchangeFormat(exchangeableWon)
              : weeklyLeft <= 0
                ? COPY.exchange.weeklyCapReached
                : dailyLeft <= 0
                  ? COPY.exchange.dailyCapReached
                  : COPY.exchange.noExchangeable}
          </Text>
        </Pressable>
        <Text style={styles.note}>{COPY.exchange.exchangeNote}</Text>

        {pending ? (
          <View style={styles.pendingRow}>
            <ActivityIndicator color={COLORS.redBerry} />
            <Text style={styles.pendingText}>{COPY.exchange.pendingText}</Text>
          </View>
        ) : null}

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>{COPY.exchange.summaryLabel}</Text>
          <Text style={styles.summaryValue}>{COPY.exchange.summaryFormat(state.weekExchangedWon)}</Text>
        </View>
      </ScrollView>

      <BannerAd adGroupId={AD_IDS.banner} />
    </SafeAreaView>
  );
}

function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(COPY.exchange.confirmTitle, message, [
      { text: COPY.exchange.confirmNo, onPress: () => resolve(false), style: 'cancel' },
      { text: COPY.exchange.confirmYes, onPress: () => resolve(true) },
    ]);
  });
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
  backBtn: { fontSize: 14, color: COLORS.text, minWidth: 50 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  headerRightPlaceholder: { minWidth: 50 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, gap: 12 },
  sectionLabel: { fontSize: 14, color: COLORS.textMuted, marginTop: 6 },
  yeopRow: { alignItems: 'center', paddingVertical: 8 },
  yeopBalance: { fontSize: 22, fontWeight: '800', color: COLORS.redBerryShade },
  exchangeBtn: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: COLORS.redBerry,
  },
  exchangeBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  note: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
  btnDisabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pendingText: { fontSize: 14, color: COLORS.textMuted },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
  },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted },
  summaryValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
});
