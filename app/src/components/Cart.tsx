import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Circle, G, Ellipse, Path } from 'react-native-svg';

interface CartProps {
  fillRatio?: number; // 0~1 손수레 적재율 (위로 쌓이는 더미 높이로 표현)
  size?: number;
}

// 리어카 위로 쌓이는 고물 더미. 내부는 보이지 않고, 입구(rim) 위로만 쌓임.
const PILE_SLOTS: ReadonlyArray<readonly [number, number, number]> = [
  [78, 62, 10], [100, 63, 11], [124, 62, 11], [148, 63, 11], [168, 61, 10],
  [90, 52, 10], [114, 53, 11], [138, 52, 11], [158, 51, 10],
  [104, 43, 10], [126, 44, 11], [146, 42, 10],
];
const PILE_COLORS = ['#9C8B76', '#B0BEC5', '#A1887F', '#6D4C41', '#E8B84B'];

export function Cart({ fillRatio = 0, size = 220 }: CartProps) {
  const W = size;
  const H = size * (200 / 240);
  const n = Math.max(0, Math.min(PILE_SLOTS.length, Math.round(fillRatio * PILE_SLOTS.length)));

  // 밖에서 고물을 던져 넣는 모션 (입구로 떨어지며 사라짐 → 내부는 보이지 않음)
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, {
          toValue: 1,
          duration: 1300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const lump = W * 0.09;
  const tx = t.interpolate({ inputRange: [0, 1], outputRange: [W * 0.1, W * 0.44] });
  const ty = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-H * 0.04, H * 0.02, H * 0.3] });
  const rot = t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '210deg'] });
  const op = t.interpolate({ inputRange: [0, 0.12, 0.62, 0.85, 1], outputRange: [0, 1, 1, 0, 0] });

  return (
    <View style={{ width: W, height: H }}>
      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: lump,
          height: lump,
          borderRadius: lump / 2,
          backgroundColor: '#9C8B76',
          opacity: op,
          transform: [{ translateX: tx }, { translateY: ty }, { rotate: rot }],
        }}
      />
      <Svg width={W} height={H} viewBox="0 0 240 200">
        {/* 손잡이 (위로 뻗은 금속 바 + 그립) */}
        <Path
          d="M 180 80 L 206 58 Q 210 54 216 56 L 224 60"
          stroke="#8A837C"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={224} cy={60} r={5} fill="#6E6760" />

        {/* 바퀴 (통보다 먼저 그려 통이 위를 덮음) */}
        <G>
          <Circle cx={92} cy={156} r={21} fill="#2E2A26" />
          <Circle cx={92} cy={156} r={8} fill="#5A534C" />
          <Circle cx={160} cy={156} r={21} fill="#2E2A26" />
          <Circle cx={160} cy={156} r={8} fill="#5A534C" />
        </G>

        {/* 통 본체 (불투명 — 내부는 보이지 않음) */}
        <Path
          d="M 54 76 L 192 76 L 178 130 Q 174 144 158 144 L 90 144 Q 74 144 70 130 Z"
          fill="#5A4F45"
        />
        {/* 오른쪽 면 음영 (입체감) */}
        <Path d="M 192 76 L 178 130 Q 174 144 158 144 L 150 144 L 168 76 Z" fill="#473E36" />
        {/* 세로 골(주름) */}
        <G stroke="#473E36" strokeWidth={2.5} strokeLinecap="round">
          <Path d="M 88 86 L 92 138" />
          <Path d="M 116 86 L 117 142" />
          <Path d="M 144 86 L 142 142" />
        </G>
        {/* 입구 테두리 (둥근 립) */}
        <Path
          d="M 56 66 L 190 66 Q 200 66 200 75 Q 200 84 190 84 L 56 84 Q 46 84 46 75 Q 46 66 56 66 Z"
          fill="#6E6157"
        />
        <Ellipse cx={123} cy={75} rx={70} ry={6} fill="#4A4039" opacity={0.4} />

        {/* 입구 위로 쌓이는 고물 더미 */}
        <G>
          {PILE_SLOTS.slice(0, n).map(([cx, cy, r], i) => (
            <Ellipse
              key={i}
              cx={cx}
              cy={cy}
              rx={r}
              ry={r * 0.82}
              fill={PILE_COLORS[i % PILE_COLORS.length]}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}
