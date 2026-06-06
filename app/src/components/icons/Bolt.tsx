import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

interface IconProps {
  size?: number;
  color?: string;
}

// 번개 — '빠르게 모으는 중' 표시용
export function Bolt({ size = 28, color = COLORS.iconSun }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path
        d="M 18 2 L 7 18 L 14 18 L 12 30 L 25 12 L 17 12 Z"
        fill={color}
        stroke={color}
        strokeWidth={1}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
