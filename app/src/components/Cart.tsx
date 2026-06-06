import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';

interface CartProps {
  fillRatio?: number; // 0~1 손수레 적재율
  size?: number;
}

// 손수레에 고물이 차오르는 모습. 아래 슬롯부터 채워짐.
const LUMP_SLOTS: ReadonlyArray<readonly [number, number, number]> = [
  [72, 138, 13], [98, 140, 14], [124, 138, 13], [148, 137, 12], [166, 134, 11],
  [84, 122, 13], [110, 123, 14], [136, 122, 13], [158, 120, 11],
  [96, 107, 12], [122, 108, 13], [146, 106, 12],
];
const LUMP_COLORS = ['#7C6B5A', '#9E9E9E', '#A1887F', '#6D4C41', COLORS.seedYellow];

export function Cart({ fillRatio = 0, size = 220 }: CartProps) {
  const n = Math.max(0, Math.min(LUMP_SLOTS.length, Math.round(fillRatio * LUMP_SLOTS.length)));
  return (
    <Svg width={size} height={size * (200 / 240)} viewBox="0 0 240 200">
      {/* 손잡이 / 다리 */}
      <Line x1={186} y1={92} x2={230} y2={72} stroke={COLORS.stem} strokeWidth={7} strokeLinecap="round" />
      <Line x1={184} y1={132} x2={204} y2={166} stroke={COLORS.potShadow} strokeWidth={6} strokeLinecap="round" />
      {/* 통 */}
      <Path d="M 30 86 L 196 86 L 172 150 L 70 150 Z" fill={COLORS.pot} />
      <Path d="M 30 86 L 196 86 L 190 98 L 36 98 Z" fill={COLORS.potRim} />
      <Path d="M 196 86 L 172 150 L 152 150 L 178 86 Z" fill={COLORS.potShadow} opacity={0.22} />
      {/* 고물 더미 */}
      <G>
        {LUMP_SLOTS.slice(0, n).map(([cx, cy, r], i) => (
          <Ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.82} fill={LUMP_COLORS[i % LUMP_COLORS.length]} />
        ))}
      </G>
      {/* 바퀴 */}
      <Circle cx={92} cy={168} r={20} fill={COLORS.seedBrown} />
      <Circle cx={92} cy={168} r={9} fill={COLORS.potRim} />
    </Svg>
  );
}
