import React from 'react';
import Svg, { Circle, Rect } from 'react-native-svg';

interface CoinIconProps {
  size?: number;
  holeColor?: string; // 엽전 가운데 네모 구멍 색(뒤 배경색과 맞춤)
}

// 엽전 — 가운데 네모 구멍이 있는 전통 황동 동전
export function CoinIcon({ size = 32, holeColor = '#FFFFFF' }: CoinIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={14} fill="#E8B84B" stroke="#B8860B" strokeWidth={2} />
      <Circle cx={16} cy={16} r={10} fill="none" stroke="#C8961E" strokeWidth={1.4} />
      <Rect x={12} y={12} width={8} height={8} rx={1.2} fill={holeColor} stroke="#B8860B" strokeWidth={1.4} />
    </Svg>
  );
}
