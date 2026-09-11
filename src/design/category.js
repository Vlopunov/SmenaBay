// Eight category pictograms (design/v2/handoff/icons): grid 24, live
// 1.7 pt stroke, round caps. Categories carry no colour in this
// direction — colour belongs to the time of day — so a pictogram always
// sits on a neutral surface.2 tile and is drawn in brand.
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useTheme } from './theme';

export const CATEGORY_LABEL = {
  pvz: 'ПВЗ',
  sklad: 'Склад',
  gruzchik: 'Грузчик',
  obshchepit: 'Общепит',
  riteyl: 'Ритейл',
  klining: 'Клининг',
  proizvodstvo: 'Производство',
  kuryer: 'Курьер',
};

const SHAPES = {
  pvz: [
    ['p', 'M3.5 7.8 12 4l8.5 3.8v8.4L12 20l-8.5-3.8z'],
    ['p', 'M3.5 7.8 12 11.6l8.5-3.8M12 11.6V20'],
  ],
  sklad: [
    ['r', { x: 3.5, y: 5, width: 17, height: 14.5, rx: 1.5 }],
    ['p', 'M3.5 10.2h17M3.5 15h17M8 5v5.2M14.8 15v4.5'],
  ],
  gruzchik: [
    ['r', { x: 8.5, y: 4.5, width: 10.5, height: 8, rx: 1 }],
    ['p', 'M4 4h2l3 13.5'],
    ['c', { cx: 10.5, cy: 19.5, r: 1.7 }],
    ['c', { cx: 17, cy: 19.5, r: 1.7 }],
    ['p', 'M9.6 17.5h8'],
  ],
  obshchepit: [
    ['p', 'M5 8h11v5a5.5 5.5 0 0 1-11 0z'],
    ['p', 'M16 9.6h1.6a2.2 2.2 0 0 1 0 4.4H16'],
    ['p', 'M4 20h13'],
  ],
  riteyl: [
    ['p', 'M5.5 8h13l-1.1 11.5H6.6z'],
    ['p', 'M9 8V6.6a3 3 0 0 1 6 0V8'],
  ],
  klining: [
    ['p', 'M12 3.5v9'],
    ['p', 'M7 12.5h10l-1.3 7H8.3z'],
    ['p', 'M10 15.5v4M14 15.5v4'],
  ],
  proizvodstvo: [
    ['p', 'M4 20V10.5l5 3v-3l5 3v-3l5 3V20z'],
    ['p', 'M17 7.5V4h2v3.5'],
  ],
  kuryer: [
    ['r', { x: 3.5, y: 7, width: 11, height: 9, rx: 1 }],
    ['p', 'M14.5 10.5h3l2.5 3.5v2h-5.5z'],
    ['c', { cx: 8, cy: 18, r: 1.7 }],
    ['c', { cx: 17.5, cy: 18, r: 1.7 }],
  ],
};

// CreateShift keys → pictogram.
const FROM_KEY = {
  pvz: 'pvz', warehouse: 'sklad', courier: 'kuryer', horeca: 'obshchepit',
  retail: 'riteyl', promo: 'riteyl', cleaning: 'klining', construction: 'proizvodstvo',
};

const FROM_BUSINESS = {
  'ПВЗ': 'pvz', 'HoReCa': 'obshchepit', 'Ритейл': 'riteyl', 'Склад/Логистика': 'sklad',
  'Клининг': 'klining', 'Производство': 'proizvodstvo', 'Ивенты': 'riteyl',
};

const FROM_SKILL = {
  'ПВЗ': 'pvz', 'Склад': 'sklad', 'Грузчик': 'gruzchik', 'Продавец': 'riteyl', 'Официант': 'obshchepit',
  'Повар': 'obshchepit', 'Курьер': 'kuryer', 'Клининг': 'klining', 'Промоутер': 'riteyl', 'Разнорабочий': 'proizvodstvo',
};

export function categoryFromTitle(title = '') {
  const t = title.toLowerCase();
  if (/пвз|выдач|сортировщик/.test(t)) return 'pvz';
  if (/грузчик|погрузчик/.test(t)) return 'gruzchik';
  if (/склад|комплект|сборщик/.test(t)) return 'sklad';
  if (/курьер|достав/.test(t)) return 'kuryer';
  if (/повар|официант|бармен|кухн/.test(t)) return 'obshchepit';
  if (/продав|кассир|консультант|промо/.test(t)) return 'riteyl';
  if (/уборщ|клининг|мойщик/.test(t)) return 'klining';
  if (/разнорабоч|производ|монтаж|строй/.test(t)) return 'proizvodstvo';
  return null;
}

/** Pictogram key for a shift: title first (it is what the worker reads), then the stored key, then the company. */
export function categoryOf(shift, company) {
  return categoryFromTitle(shift?.title)
    || FROM_KEY[shift?.category]
    || FROM_BUSINESS[company?.businessCategory]
    || 'pvz';
}

export const categoryFromSkill = (skill) => FROM_SKILL[skill] || null;
export const categoryFromBusiness = (b) => FROM_BUSINESS[b] || null;

export function Pictogram({ kind = 'pvz', size = 25, color }) {
  const { c } = useTheme();
  const stroke = color || c.brand;
  // The stroke stays 1.7 pt whatever the size: scale the path, not the line.
  const sw = 1.7 * (24 / size);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {(SHAPES[kind] || SHAPES.pvz).map(([t, d], i) => (
        t === 'p' ? <Path key={i} d={d} /> : t === 'r' ? <Rect key={i} {...d} /> : <Circle key={i} {...d} />
      ))}
    </Svg>
  );
}

/** Neutral tile with the pictogram in brand (44 pt in cards, 30/20 elsewhere). */
export function CategoryTile({ kind, size = 44, muted, style }) {
  const { c } = useTheme();
  const r = size >= 44 ? 14 : size >= 34 ? 11 : size >= 28 ? 9 : 6;
  return (
    <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center', opacity: muted ? 0.8 : 1 }, style]}>
      <Pictogram kind={kind} size={Math.round(size * 0.57)} color={muted ? c.ink2 : c.brand} />
    </View>
  );
}
