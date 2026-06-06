import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

interface IconProps {
  size?: number;
  color?: string;
}

export function Sun({ size = 28, color = COLORS.iconSun }: IconProps) {
  const rays: Array<readonly [number, number, number, number]> = [
    [16, 2, 16, 7],
    [16, 25, 16, 30],
    [2, 16, 7, 16],
    [25, 16, 30, 16],
    [6, 6, 9.5, 9.5],
    [22.5, 22.5, 26, 26],
    [6, 26, 9.5, 22.5],
    [22.5, 9.5, 26, 6],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Circle cx={16} cy={16} r={7} fill={color} />
      {rays.map(([x1, y1, x2, y2], i) => (
        <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      ))}
    </Svg>
  );
}
