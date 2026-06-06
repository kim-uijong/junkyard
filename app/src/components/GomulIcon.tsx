import React from 'react';
import Svg, { Circle, G, Line, Polygon, Rect } from 'react-native-svg';
import type { GomulType } from '../constants/gomul';

interface GomulIconProps {
  type: GomulType;
  size?: number;
}

// 고물 4종 인라인 SVG 아이콘 (이모지 대신 — 톤 통일)
export function GomulIcon({ type, size = 28 }: GomulIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {type === 'paper' ? <Newspaper /> : null}
      {type === 'bottle' ? <BeerBottle /> : null}
      {type === 'scrap' ? <Gear /> : null}
      {type === 'special' ? <GoldOre /> : null}
    </Svg>
  );
}

// 폐지 — 신문지
function Newspaper() {
  return (
    <G>
      <Rect x={6} y={6} width={20} height={21} rx={2} fill="#F4F1EA" stroke="#A89F90" strokeWidth={1.5} />
      <Rect x={9} y={9} width={14} height={3.2} rx={0.6} fill="#8A7F6E" />
      <Rect x={9} y={15} width={6.5} height={5.5} rx={0.6} fill="#CBC2B2" />
      <G stroke="#B3AA9B" strokeWidth={1.3} strokeLinecap="round">
        <Line x1={17.5} y1={15.5} x2={23} y2={15.5} />
        <Line x1={17.5} y1={18} x2={23} y2={18} />
        <Line x1={17.5} y1={20.5} x2={23} y2={20.5} />
        <Line x1={9} y1={23} x2={23} y2={23} />
      </G>
    </G>
  );
}

// 공병 — 맥주병
function BeerBottle() {
  return (
    <G>
      <Rect x={14} y={3} width={4} height={2.6} rx={0.8} fill="#C8A23A" />
      <Rect x={14.2} y={5} width={3.6} height={5} fill="#6E4A1C" />
      {/* 어깨 + 몸통 */}
      <Polygon
        points="13.8,10 12,14 12,26 13,28 19,28 20,26 20,14 18.2,10"
        fill="#7B4B14"
      />
      {/* 라벨 */}
      <Rect x={12} y={17} width={8} height={6} rx={0.8} fill="#F0E6CF" />
      {/* 하이라이트 */}
      <Rect x={13.4} y={11.5} width={1.6} height={13} rx={0.8} fill="#A56F2E" opacity={0.6} />
    </G>
  );
}

// 고철 — 톱니바퀴
function Gear() {
  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <G>
      {teeth.map((a) => (
        <Rect
          key={a}
          x={14.4}
          y={3.5}
          width={3.2}
          height={6}
          rx={1}
          fill="#8A8A8A"
          transform={`rotate(${a} 16 16)`}
        />
      ))}
      <Circle cx={16} cy={16} r={8} fill="#9E9E9E" />
      <Circle cx={16} cy={16} r={3.4} fill="#6E6E6E" />
    </G>
  );
}

// 금덩이 — 금 원석
function GoldOre() {
  return (
    <G>
      <Polygon
        points="10,19 8,13 13,8 20,7 25,13 24,21 17,26 11,24"
        fill="#E8B84B"
        stroke="#B8860B"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <Polygon points="13,8 20,7 18.5,15 12.5,14" fill="#F4D27A" />
      <Polygon points="18.5,15 24,21 17,26 14.5,19" fill="#C8961E" />
    </G>
  );
}
