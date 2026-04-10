// ServiceHub Design System
// Style: Clean Minimalism (Airbnb/Apple-inspired)
// Platform: React Native (iOS + Android)

export const COLORS = {
  // Primary brand
  primary: '#1A1A2E',
  primaryLight: '#2D2D44',
  primarySoft: '#F0F0F5',

  // Accent
  accent: '#4F46E5',
  accentLight: '#818CF8',
  accentSoft: '#EEF2FF',

  // Success / Transaction
  success: '#059669',
  successLight: '#D1FAE5',

  // Warning
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Error
  error: '#EF4444',
  errorLight: '#FEE2E2',

  // Neutral
  white: '#FFFFFF',
  background: '#FAFAFA',
  card: '#FFFFFF',
  surface: '#F5F5F7',
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  divider: '#E5E5EA',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textAccent: '#4F46E5',

  // Specific
  online: '#22C55E',
  star: '#FBBF24',
  skeleton: '#E5E5EA',
};

export const FONTS = {
  // Using system fonts for best native feel
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semibold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
};

export const SIZES = {
  // Spacing (4pt grid)
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Typography
  caption: 12,
  small: 13,
  body: 15,
  bodyLarge: 17,
  subtitle: 16,
  title: 20,
  heading: 24,
  largeTitle: 34,
  display: 40,

  // Border radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
  radiusFull: 999,

  // Component sizes
  buttonHeight: 52,
  inputHeight: 48,
  avatarSm: 36,
  avatarMd: 48,
  avatarLg: 64,
  avatarXl: 80,
  iconSm: 20,
  iconMd: 24,
  iconLg: 28,
  tabBarHeight: 84,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
};
