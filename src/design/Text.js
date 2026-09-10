import React from 'react';
import { Text as RNText } from 'react-native';
import { useTheme } from './theme';

const COLOR_ROLES = {
  label: 'label',
  secondary: 'labelSecondary',
  tertiary: 'labelTertiary',
  accent: 'accent',
  destructive: 'destructive',
  onAccent: 'onAccent',
  onInk: 'onInk',
  ink: 'ink',
};

// Money columns are laid out on a fixed 72 pt rail; letting them scale
// without limit would push «110» out of the rail at accessibility sizes.
const SCALE_CAP = {
  moneyRail: 1.3,
  moneyHero: 1.3,
  screenTitle: 1.4,
  title: 1.4,
  passTitle: 1.4,
  countdown: 1.5,
  tab: 1.2,
  unit: 1.4,
};

/**
 * <T v="rowTitle" c="secondary">…</T>
 *
 * v — a role from tokens.type; c — a colour role or any colour string.
 * Tabular figures are always on: sums, times and counters must not change
 * width digit to digit.
 */
export default function T({ v = 'body', c = 'label', style, children, maxFontSizeMultiplier, ...rest }) {
  const theme = useTheme();
  const color = COLOR_ROLES[c] ? theme.c[COLOR_ROLES[c]] : c;
  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? SCALE_CAP[v] ?? 1.8}
      style={[theme.type[v], { color, fontVariant: ['tabular-nums'] }, style]}
    >
      {children}
    </RNText>
  );
}
