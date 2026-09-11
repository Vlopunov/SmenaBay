import React from 'react';
import { Text as RNText } from 'react-native';
import { useTheme, displayFont } from './theme';
import { type as TYPE } from './tokens';

const COLOR_ROLES = {
  ink: 'ink',
  ink2: 'ink2',
  ink3: 'ink3',
  disabled: 'inkDisabled',
  brand: 'brand',
  onBrand: 'onBrand',
  success: 'success',
  error: 'error',
  urgent: 'urgent',
  urgentInk: 'urgentInk',
  bg: 'bg',
  surface: 'surface',
  // Legacy roles.
  label: 'ink',
  secondary: 'ink2',
  tertiary: 'inkDisabled',
  accent: 'brand',
  onAccent: 'onBrand',
  destructive: 'error',
  onInk: 'bg',
};

// Roles of the previous scale, re-pointed at the new one so screens that
// have not been redrawn yet keep a coherent size ladder.
const LEGACY = {
  moneyRail: 'moneyCard',
  screenTitle: 'titleLarge',
  title: 'titleScreen',
  passTitle: 'titleScreen',
  sheetTitle: 'titleSection',
  value: 'bodyStrong',
  rowTime: 'bodyStrong',
  section: 'bodyStrong',
  small: 'caption',
  smallStrong: 'caption',
  label: 'badge',
  unit: 'badge',
  tab: 'badge',
};

const styleCache = {};
function roleStyle(v) {
  const key = TYPE[v] ? v : LEGACY[v] || 'body';
  if (!styleCache[key]) {
    const t = TYPE[key];
    styleCache[key] = {
      fontSize: t.fontSize,
      lineHeight: t.lineHeight,
      letterSpacing: t.letterSpacing,
      ...(t.display ? displayFont(t.fontWeight) : { fontWeight: t.fontWeight }),
      fontVariant: ['tabular-nums'],
      maxScale: t.ax3,
    };
  }
  return styleCache[key];
}

/**
 * <T v="rowTitle" c="ink2">…</T>
 * v — a role from tokens.type; c — a colour role or any colour string.
 * `display` forces the rounded display face on a custom size.
 * Tabular figures are always on: sums and timers never change width.
 */
export default function T({ v = 'body', c = 'ink', display, weight, style, children, maxFontSizeMultiplier, ...rest }) {
  const theme = useTheme();
  const color = COLOR_ROLES[c] ? theme.c[COLOR_ROLES[c]] : c;
  const { maxScale, ...base } = roleStyle(v);
  const face = display ? displayFont(weight || base.fontWeight || '800') : weight ? { fontWeight: weight } : null;
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? maxScale ?? 1.8}
      style={[base, face, { color }, style]}
    >
      {children}
    </RNText>
  );
}
