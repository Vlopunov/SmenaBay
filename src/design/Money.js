// Money: hero (shift details) · card (feed) · inline (chat, lists,
// notifications). «BYN» is always subordinate — half the size, on ink2.
// Thousands take a thin space; no kopecks. VoiceOver reads roubles.
import React from 'react';
import { Text as RNText } from 'react-native';
import T from './Text';
import { useTheme, displayFont } from './theme';
import { money as fmt } from './format';

const SIZES = {
  hero: { v: 'moneyHero', suffix: 26, suffixOpacity: 0.75 },
  card: { v: 'moneyCard', suffix: 17 },
  pass: { v: 'moneyCard', size: 30, suffix: 18 },
  inline: { v: 'moneyInline', suffix: null },
};

export function rublesLabel(n) {
  const v = Math.round(Number(n) || 0);
  const a = v % 100; const b = v % 10;
  const w = a > 10 && a < 20 ? 'белорусских рублей' : b === 1 ? 'белорусский рубль' : b > 1 && b < 5 ? 'белорусских рубля' : 'белорусских рублей';
  return `${v} ${w}`;
}

/**
 * <Money value={65} size="card" />
 * c — colour of the number; suffixC — colour of «BYN» (defaults to ink2).
 * `prefix` renders before the number («≈»); `compact` shrinks 4–5 digit sums.
 */
export default function Money({ value, size = 'card', c = 'ink', suffixC, fontSize, prefix = '', style, suffix = 'BYN' }) {
  const t = useTheme();
  const spec = SIZES[size] || SIZES.card;
  const text = `${prefix}${fmt(value)}`;
  const baseSize = fontSize || spec.size;
  if (!spec.suffix) {
    return (
      <T v={spec.v} c={c} style={[baseSize ? { fontSize: baseSize, lineHeight: Math.round(baseSize * 1.15) } : null, style]} accessibilityLabel={rublesLabel(value)}>
        {text}{suffix ? ` ${suffix}` : ''}
      </T>
    );
  }
  const suffixColor = suffixC ? (t.c[suffixC] || suffixC) : t.c.ink2;
  const suffixSize = baseSize ? Math.round(baseSize * (spec.suffix / (spec.size || t.type[spec.v].fontSize))) : spec.suffix;
  return (
    <T v={spec.v} c={c} style={[baseSize ? { fontSize: baseSize, lineHeight: Math.round(baseSize * 1.04) } : null, style]} accessibilityLabel={rublesLabel(value)}>
      {text}
      {suffix ? (
        <RNText style={[displayFont('700'), { fontSize: suffixSize, color: suffixColor, opacity: spec.suffixOpacity ?? 1, letterSpacing: 0 }]}>
          {` ${suffix}`}
        </RNText>
      ) : null}
    </T>
  );
}
