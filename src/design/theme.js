import React, { createContext, useContext, useMemo } from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { palettes, type, space, radius, motion } from './tokens';

// Liquid Glass exists from iOS 26. Below that the control layer uses an
// opaque «fallback» material with the same geometry rules adjusted: the tab
// bar floats as a capsule on iOS 26 and is pinned to the bottom otherwise.
const iosMajor = Platform.OS === 'ios' ? parseInt(String(Platform.Version), 10) : 0;
export const SUPPORTS_GLASS = iosMajor >= 26;

const ThemeContext = createContext(null);

function buildTheme(scheme) {
  const dark = scheme === 'dark';
  return {
    dark,
    c: dark ? palettes.dark : palettes.light,
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
 *
 *   const useStyles = makeStyles((t) => ({ row: { backgroundColor: t.c.ledger } }));
 *   const s = useStyles();
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
