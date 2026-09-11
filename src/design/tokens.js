// ───────────────────────────────────────────────────────────────
// СменаБел — design tokens, «Небо смены» (direction A).
// Source of truth: design/v2/handoff/tokens.json. Colour encodes the
// time of day a shift starts; categories carry no colour, only a
// pictogram. Components read roles from the active palette and never
// hard-code a colour.
// ───────────────────────────────────────────────────────────────

const light = {
  bg: '#FBF8F4',
  surface: '#FFFFFF',
  surface2: '#F0EAE1',
  surface3: '#E7DFD3',
  line: '#EAE3D8',
  lineStrong: '#D6CCBC',
  ink: '#1B1917',
  ink2: '#6E6559',
  ink3: '#5C544A',
  inkDisabled: '#A79C8E',
  brand: '#0F5673',
  brandPressed: '#0B4459',
  brandTint: '#E4F0F5',
  onBrand: '#FFFFFF',
  urgent: '#E07A1F',
  urgentInk: '#8A4408',
  urgentTint: '#FDEFE0',
  success: '#1C7A5A',
  successTint: '#E8F2E9',
  error: '#C0392B',
  errorTint: '#FAEAE7',
  warning: '#B5761A',
  star: '#E0A32B',
  // Glass plate on a sky (back button, chips over the header).
  onSky: 'rgba(255,253,249,0.85)',
  // Control layer only: tab bar, nav bar, sheets. Never on cards.
  material: 'rgba(251,248,244,0.86)',
  scrim: 'rgba(20,14,8,0.42)',
  shadow: 'rgb(40,30,18)',
  brandShadow: 'rgb(15,86,115)',
  map: '#E7EDE4',
  mapRoad: '#FAF8F3',
  mapBlock: '#DDE4D8',
};

const dark = {
  bg: '#11161C',
  surface: '#1A2129',
  surface2: '#222B35',
  surface3: '#2B3541',
  line: '#232C36',
  lineStrong: '#38434F',
  ink: '#F7F3EC',
  ink2: '#93A0AD',
  ink3: '#B6C1CB',
  inkDisabled: '#5E6A75',
  brand: '#6FB4D8',
  brandPressed: '#8AC5E4',
  brandTint: '#17303D',
  onBrand: '#08131A',
  urgent: '#F0A65A',
  urgentInk: '#F5C68F',
  urgentTint: '#33230F',
  success: '#4FBE95',
  successTint: '#0E2A22',
  error: '#FF7A68',
  errorTint: '#33140F',
  warning: '#E0A94F',
  star: '#E0A32B',
  onSky: 'rgba(8,14,20,0.5)',
  material: 'rgba(17,22,28,0.86)',
  scrim: 'rgba(0,0,0,0.55)',
  shadow: 'rgb(0,0,0)',
  brandShadow: 'rgb(0,0,0)',
  map: '#1B232B',
  mapRoad: '#27313B',
  mapBlock: '#212A33',
};

// Roles of the previous system, mapped onto the new palette so screens
// that have not been redrawn yet keep rendering sensibly.
function withLegacy(p) {
  return {
    ...p,
    label: p.ink,
    labelSecondary: p.ink2,
    labelTertiary: p.inkDisabled,
    accent: p.brand,
    onAccent: p.onBrand,
    destructive: p.error,
    onInk: p.bg,
    ledger: p.bg,
    elevated: p.surface,
    warmBg: p.bg,
    warmElevated: p.surface,
    separator: p.line,
    warmSeparator: p.line,
    fill: p.surface2,
    fillSecondary: p.surface3,
    glass: p.material,
    glassBorder: p.line,
    glassFallback: p.material,
    glassFallbackBorder: p.line,
    sheet: p.bg,
    passShadow: p.shadow,
    accentShadow: p.brandShadow,
  };
}

export const palettes = { light: withLegacy(light), dark: withLegacy(dark) };

// ── Sky ────────────────────────────────────────────────────────
// One sky per object, chosen by the hour the shift starts — never by
// category or status. Inks are tuned per sky and switch with the theme.
export const SKY = {
  morning: {
    label: 'утренняя смена',
    light: ['#FFD9B8', '#CFE6F4'], dark: ['#5A4433', '#264257'],
    ink: { light: '#3D2410', dark: '#F2E3D3' }, ink2: { light: '#6A4425', dark: '#CDB6A0' },
  },
  day: {
    label: 'дневная смена',
    light: ['#C6E4F7', '#87C4EA'], dark: ['#2E6089', '#17415F'],
    ink: { light: '#0B3550', dark: '#DCEEF9' }, ink2: { light: '#16405A', dark: '#AFC9DA' },
  },
  evening: {
    label: 'вечерняя смена',
    light: ['#FFC68C', '#F0A2AC'], dark: ['#6A4433', '#5A2F45'],
    ink: { light: '#5A2430', dark: '#F7DCD9' }, ink2: { light: '#6B2B2F', dark: '#D8AFAB' },
  },
  night: {
    label: 'ночная смена',
    light: ['#33477F', '#151F3C'], dark: ['#243459', '#131C34'],
    ink: { light: '#DCEEF9', dark: '#DCEEF9' }, ink2: { light: '#AFC1DA', dark: '#AFC1DA' },
  },
  // No seats left, or the shift is in the past.
  closed: {
    label: 'мест нет',
    light: ['#F3E4D6', '#E8DCD8'], dark: ['#2A3138', '#22282E'],
    ink: { light: '#6A5B4E', dark: '#98A3AD' }, ink2: { light: '#6A5B4E', dark: '#98A3AD' },
  },
};

// ── Typography ─────────────────────────────────────────────────
// Two families: SF Pro Rounded (display: titles, money, countdown) and
// SF Pro Text (everything else). On Android the display face is Nunito.
// Every number is tabular. `ax3` caps how far a role may grow with
// Dynamic Type: money.hero and countdown grow slower (×1.17).
export const type = {
  titleLarge:   { display: true, fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -0.68, ax3: 44 / 34 },
  titleScreen:  { display: true, fontSize: 27, lineHeight: 31, fontWeight: '800', letterSpacing: -0.54, ax3: 36 / 27 },
  titleSection: { display: true, fontSize: 19, lineHeight: 23, fontWeight: '700', letterSpacing: 0, ax3: 26 / 19 },
  moneyHero:    { display: true, fontSize: 52, lineHeight: 54, fontWeight: '800', letterSpacing: -1.04, ax3: 60 / 52 },
  moneyCard:    { display: true, fontSize: 28, lineHeight: 30, fontWeight: '800', letterSpacing: -0.28, ax3: 34 / 28 },
  moneyInline:  { display: true, fontSize: 16, lineHeight: 19, fontWeight: '700', letterSpacing: 0, ax3: 21 / 16 },
  countdown:    { display: true, fontSize: 46, lineHeight: 48, fontWeight: '800', letterSpacing: -0.92, ax3: 54 / 46 },
  rowTitle:     { fontSize: 17, lineHeight: 21, fontWeight: '700', letterSpacing: 0, ax3: 26 / 17 },
  body:         { fontSize: 17, lineHeight: 24, fontWeight: '400', letterSpacing: 0, ax3: 30 / 17 },
  bodyStrong:   { fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: 0, ax3: 26 / 15 },
  caption:      { fontSize: 13, lineHeight: 17, fontWeight: '400', letterSpacing: 0, ax3: 22 / 13 },
  badge:        { fontSize: 11, lineHeight: 13, fontWeight: '700', letterSpacing: 0.22, ax3: 17 / 11 },
  button:       { fontSize: 17.5, lineHeight: 21, fontWeight: '700', letterSpacing: 0, ax3: 24 / 17.5 },
};

// ── Grid ───────────────────────────────────────────────────────
export const space = {
  grid: 4,
  gutter: 20,
  gutterCompact: 16,
  cardPadding: 14,
  cardGap: 10,
  sectionGap: 18,
  heroGap: 26,
  hit: 44,
};

// Continuous corners; inner radius = outer − 8.
export const radius = {
  xs: 4, sm: 8, md: 12, lg: 14, card: 20, hero: 24, sheet: 26, pill: 999,
};

// ── Elevation ──────────────────────────────────────────────────
// React Native draws one shadow per view; the handoff's second, 1 pt
// contact layer is dropped — the tinted soft layer is what reads.
export const shadow = {
  light: {
    e1: { shadowColor: 'rgb(40,30,18)', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    e2: { shadowColor: 'rgb(40,30,18)', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 9 } },
    e3: { shadowColor: 'rgb(20,14,8)', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 14 } },
    flat: { shadowColor: 'rgb(40,30,18)', shadowOpacity: 0.07, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
    brand: { shadowColor: 'rgb(15,86,115)', shadowOpacity: 0.45, shadowRadius: 11, shadowOffset: { width: 0, height: 7 } },
  },
  dark: {
    e1: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
    e2: { shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
    e3: { shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 14 } },
    flat: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
    brand: { shadowColor: '#000', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 } },
  },
};

// ── Motion ─────────────────────────────────────────────────────
// Phase 5 table. Springs in damping / stiffness / mass for withSpring;
// timings with bezier(.23,1,.32,1). Only transform and opacity animate.
export const motion = {
  press: { duration: 120, bezier: [0.23, 1, 0.32, 1], scale: 0.97 },
  fade: { duration: 200 },
  number: { duration: 400 },
  snappy: { damping: 18, stiffness: 250, mass: 1 },
  badge: { damping: 14, stiffness: 260, mass: 1 },
  default: { damping: 20, stiffness: 400, mass: 1 },
  sheet: { damping: 26, stiffness: 300, mass: 0.8 },
  pin: { damping: 16, stiffness: 250, mass: 1 },
  fill: { damping: 12, stiffness: 200, mass: 1 },
  celebrate: { damping: 12, stiffness: 180, mass: 1 },
  shake: { duration: 450, amplitude: 7 },
  sheen: { duration: 800 },
  toastLife: 3200,
  // Legacy names still read by screens that have not moved yet.
  appear: { duration: 200, bezier: [0.23, 1, 0.32, 1] },
  morph: { duration: 250, bezier: [0.2, 0.92, 0.3, 1] },
  counter: { duration: 520, bezier: [0.16, 1, 0.3, 1] },
  panel: { duration: 300, bezier: [0.77, 0, 0.175, 1] },
  reject: { duration: 440, bezier: [0.36, 0.07, 0.19, 0.97] },
  springSheet: { duration: 300, dampingRatio: 0.8 },
  springSnappy: { duration: 250, dampingRatio: 1 },
};

// ── Monograms ──────────────────────────────────────────────────
// One person — one tone forever: index = (sum of name char codes) mod 6.
export const PEOPLE_TONES = {
  light: [
    { bg: '#D7E7F3', ink: '#0E4361' }, { bg: '#F3E0CE', ink: '#5C3A18' }, { bg: '#E6E8D6', ink: '#43491F' },
    { bg: '#F0DCDF', ink: '#6B2B33' }, { bg: '#DCE3ED', ink: '#2C3D5C' }, { bg: '#DEE9E2', ink: '#1E4E3B' },
  ],
  dark: [
    { bg: '#1D3441', ink: '#BFE0F2' }, { bg: '#3A2E22', ink: '#EBD6BE' }, { bg: '#2F3326', ink: '#D9DDBF' },
    { bg: '#3A2A2D', ink: '#F0CBD0' }, { bg: '#262E3C', ink: '#C6D2E6' }, { bg: '#22332B', ink: '#BFE0CE' },
  ],
};
