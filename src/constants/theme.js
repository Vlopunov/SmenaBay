// ───────────────────────────────────────────────────────────────
// СменаБел design system — "Editorial Workforce"
// ───────────────────────────────────────────────────────────────
// Original aesthetic — NOT a clone of Wolt/Uber/Avito.
// Brutally large display type, signal-yellow as the "money/urgent"
// accent, deep graphite surfaces, ticker-style numerals,
// monospaced labels for IDs and meta. Custom 1.5px line iconography.

export const COLORS = {
  // Surfaces — warm graphite, not flat black
  ink:        '#0E0F0C',
  graphite:   '#15171A',
  charcoal:   '#1F2125',
  paper:      '#F4F1EA',
  paperSoft:  '#EAE6DC',
  paperDeep:  '#DDD7C8',
  white:      '#FFFCF5',
  line:       'rgba(14,15,12,0.10)',
  lineSoft:   'rgba(14,15,12,0.06)',

  // Type
  fg:         '#0E0F0C',
  fgMuted:    '#5C5A52',
  fgFaint:    '#8C887E',
  fgInv:      '#F4F1EA',
  fgInvMuted: 'rgba(244,241,234,0.62)',

  // Signal — canary yellow ("money", confirm, primary CTA)
  signal:     '#F2E94E',
  signalDark: '#D5CB1F',
  signalDeep: '#7A720E',
  // Live — coral ("urgent / live shift")
  live:       '#FF6B3D',
  liveSoft:   '#FFE4D9',
  // Info
  info:       '#3A6FE0',
  infoSoft:   '#DEE7FB',
  // Completed
  mint:       '#A9E3B5',
  mintDeep:   '#2D6E3D',

  // Legacy aliases — keep existing screens rendering until fully migrated
  primary:        '#0E0F0C',
  primaryLight:   '#1F2125',
  primarySoft:    '#F4F1EA',
  accent:         '#0E0F0C',
  accentLight:    '#5C5A52',
  accentSoft:     '#F4F1EA',
  success:        '#2D6E3D',
  successLight:   '#D1F0D6',
  warning:        '#F2E94E',
  warningLight:   '#FAF6C2',
  error:          '#FF6B3D',
  errorLight:     '#FFE4D9',
  background:     '#F4F1EA',
  card:           '#FFFCF5',
  surface:        '#EAE6DC',
  border:         'rgba(14,15,12,0.10)',
  borderLight:    'rgba(14,15,12,0.06)',
  divider:        'rgba(14,15,12,0.10)',
  textPrimary:    '#0E0F0C',
  textSecondary:  '#5C5A52',
  textTertiary:   '#8C887E',
  textInverse:    '#F4F1EA',
  textAccent:     '#0E0F0C',
  online:         '#FF6B3D',
  star:           '#0E0F0C',
  skeleton:       '#EAE6DC',
};

// Font family names — must match keys registered in App.js useFonts()
export const FAMILIES = {
  display:     'Unbounded_700Bold',
  displaySemi: 'Unbounded_600SemiBold',
  serifItalic: 'BonaNova_400Regular_Italic',
  text:        'Onest_400Regular',
  textMed:     'Onest_500Medium',
  textSemi:    'Onest_600SemiBold',
  textBold:    'Onest_700Bold',
  mono:        'SpaceMono_400Regular',
};

export const FONTS = {
  display:     { fontFamily: FAMILIES.display,     letterSpacing: -0.5 },
  displayBig:  { fontFamily: FAMILIES.display,     letterSpacing: -1 },
  regular:     { fontFamily: FAMILIES.text },
  medium:      { fontFamily: FAMILIES.textMed },
  semibold:    { fontFamily: FAMILIES.textSemi },
  bold:        { fontFamily: FAMILIES.textBold },
  serifItalic: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic' },
  mono:        { fontFamily: FAMILIES.mono, letterSpacing: 1 },
};

export const SIZES = {
  // Spacing (4pt grid)
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 22,
  xl: 28,
  '2xl': 36,
  '3xl': 48,
  '4xl': 64,

  // Type
  micro: 9.5,
  caption: 11,
  small: 12,
  body: 14,
  bodyLarge: 15,
  title: 18,
  h3: 22,
  h2: 28,
  h1: 42,
  hero: 56,

  // Legacy-screen aliases — keep older screens (Profile, MyShifts,
  // RegisterWorker etc.) rendering correctly. Without these, references
  // like SIZES.heading evaluate to `undefined`, which makes Text invisible.
  heading: 28,
  largeTitle: 32,
  '5xl': 80,
  radiusFull: 999,

  // Radii — varied, not one-size
  radiusTight: 8,
  radiusSm: 10,
  radiusMd: 14,
  radiusLg: 18,
  radiusXl: 24,
  radiusBlock: 28,
  radiusPill: 999,

  // Components
  buttonHeight: 52,
  inputHeight: 52,
  headerHeight: 64,
  tabBarHeight: 76,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
};
