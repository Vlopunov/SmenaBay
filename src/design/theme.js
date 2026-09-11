import React, { createContext, useContext, useMemo } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { palettes, type, space, radius, motion, shadow, SKY, PEOPLE_TONES } from './tokens';

// Liquid Glass exists from iOS 26; below that the control layer is an
// opaque material with the same geometry.
const iosMajor = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;
export const SUPPORTS_GLASS = iosMajor >= 26;

// SF Pro Rounded through the system font descriptor on iOS (Fabric
// resolves `ui-rounded`); Nunito on Android, one file per weight.
const NUNITO = { '600': 'Nunito_600SemiBold', '700': 'Nunito_700Bold', '800': 'Nunito_800ExtraBold', '900': 'Nunito_900Black' };
export function displayFont(weight = '800') {
  if (Platform.OS === 'ios') return { fontFamily: 'ui-rounded', fontWeight: weight };
  return { fontFamily: NUNITO[weight] || NUNITO['800'], fontWeight: 'normal' };
}

const ThemeContext = createContext(null);

function skyFor(dark) {
  const mode = dark ? 'dark' : 'light';
  const cache = {};
  return (key) => {
    const k = SKY[key] ? key : 'day';
    if (!cache[k]) {
      const s = SKY[k];
      cache[k] = { key: k, label: s.label, colors: s[mode], ink: s.ink[mode], ink2: s.ink2[mode] };
    }
    return cache[k];
  };
}

function buildTheme(scheme) {
  const dark = scheme === 'dark';
  return {
    dark,
    c: dark ? palettes.dark : palettes.light,
    sh: dark ? shadow.dark : shadow.light,
    sky: skyFor(dark),
    tones: dark ? PEOPLE_TONES.dark : PEOPLE_TONES.light,
    type,
    space,
    radius,
    motion,
    glass: SUPPORTS_GLASS,
  };
}

const LIGHT = buildTheme('light');
const DARK = buildTheme('dark');

export function ThemeProvider({ children }) {
  const scheme = useColorScheme();
  const value = scheme === 'dark' ? DARK : LIGHT;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext) || LIGHT;
}

/**
 * Style factory that re-evaluates only when the colour scheme flips.
 *   const useStyles = makeStyles((t) => ({ row: { backgroundColor: t.c.bg } }));
 */
export function makeStyles(factory) {
  const cache = new WeakMap();
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => {
      if (!cache.has(theme)) cache.set(theme, StyleSheet.create(factory(theme)));
      return cache.get(theme);
    }, [theme]);
  };
}
