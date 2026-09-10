// ───────────────────────────────────────────────────────────────
// СменаБел — design tokens, «Ведомость» (ledger) direction.
// Source of truth: design_handoff_smenabel_redesign/README.md.
// Every colour role has a light and a dark value; components never
// hard-code colours, they read them from the active palette.
// ───────────────────────────────────────────────────────────────

const light = {
  // Four roles, nothing decorative.
  accent: '#12539E',          // 7.5:1 — CTA, active filter, link, selected pin, «Подтверждена»
  onAccent: '#FFFFFF',
  ink: '#1C1C1E',             // «Срочно», company monogram, occupied-seats bar, active chips
  onInk: '#FFFFFF',
  destructive: '#D70015',     // failures and destructive actions only

  // Text ladder
  label: '#000000',
  labelSecondary: 'rgba(60,60,67,0.72)',   // raised from iOS 0.6 to pass 4.5:1 in sunlight
  labelTertiary: 'rgba(60,60,67,0.34)',    // never text — placeholders, chevrons, strokes

  // Surfaces
  ledger: '#FFFFFF',          // screen background
  bg: '#F2F2F7',              // under notification tiles
  elevated: '#FFFFFF',        // tiles on bg
  warmBg: '#FBFAF7',          // under the shift pass
  warmElevated: '#FFFFFF',    // the pass itself
  warmSeparator: 'rgba(50,46,38,0.13)',
  separator: 'rgba(60,60,67,0.16)',
  fill: 'rgba(118,118,128,0.12)',
  fillSecondary: 'rgba(118,118,128,0.20)',
  scrim: 'rgba(0,0,0,0.42)',

  // Glass (control layer only: tab bar, bottom panel, round nav buttons, sheets)
  glass: 'rgba(255,255,255,0.66)',
  glassBorder: 'rgba(0,0,0,0.07)',
  // The handoff intends an opaque material below iOS 26; at 0.94 black text
  // ghosts through under the tab labels, so it is nearly opaque here.
  glassFallback: 'rgba(249,249,251,0.985)',
  glassFallbackBorder: 'rgba(0,0,0,0.10)',
  sheet: 'rgba(249,249,251,0.97)',

  // Shadows are tinted with warm ink / accent, as in the handoff.
  passShadow: 'rgb(40,35,25)',
  accentShadow: 'rgb(18,83,158)',
};

const dark = {
  accent: '#7FB2FF',          // 9.7:1 on black
  // The mockups keep white text on the accent in dark mode too, which is
  // ~2:1 on #7FB2FF. Black keeps the 9.7:1 the accent was chosen for.
  onAccent: '#000000',
  ink: '#FFFFFF',
  onInk: '#000000',
  destructive: '#FF453A',

  label: '#FFFFFF',
  labelSecondary: 'rgba(235,235,245,0.72)',
  labelTertiary: 'rgba(235,235,245,0.38)',

  ledger: '#000000',
  bg: '#000000',
  elevated: '#1C1C1E',
  warmBg: '#0C0C0B',
  warmElevated: '#1A1A18',
  warmSeparator: 'rgba(235,233,225,0.16)',
  separator: 'rgba(84,84,88,0.85)',
  fill: 'rgba(118,118,128,0.36)',
  fillSecondary: 'rgba(118,118,128,0.44)',
  scrim: 'rgba(0,0,0,0.6)',

  glass: 'rgba(28,28,30,0.62)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassFallback: 'rgba(30,30,32,0.985)',
  glassFallbackBorder: 'rgba(255,255,255,0.12)',
  sheet: 'rgba(28,28,30,0.97)',

  passShadow: 'rgb(0,0,0)',
  accentShadow: 'rgb(0,0,0)',
};

export const palettes = { light, dark };

// ── Typography ─────────────────────────────────────────────────
// SF Pro only. Sizes are Dynamic Type `.large`; tracking in points.
// Every numeric string uses tabular figures so the money rail never
// jitters while scrolling («110» and «65» must be the same width per digit).
export const type = {
  moneyHero:    { fontSize: 44,   lineHeight: 46, fontWeight: '700', letterSpacing: -2.4 },
  screenTitle:  { fontSize: 34,   lineHeight: 40, fontWeight: '700', letterSpacing: -1.2 },
  moneyRail:    { fontSize: 30,   lineHeight: 32, fontWeight: '700', letterSpacing: -1.5 },
  title:        { fontSize: 30,   lineHeight: 35, fontWeight: '700', letterSpacing: -1.1 },
  passTitle:    { fontSize: 27,   lineHeight: 32, fontWeight: '700', letterSpacing: -0.9 },
  sheetTitle:   { fontSize: 24,   lineHeight: 29, fontWeight: '700', letterSpacing: -0.7 },
  countdown:    { fontSize: 21,   lineHeight: 26, fontWeight: '700', letterSpacing: -0.5 },
  rowTitle:     { fontSize: 17,   lineHeight: 22, fontWeight: '600', letterSpacing: -0.4 },
  button:       { fontSize: 17,   lineHeight: 22, fontWeight: '600', letterSpacing: -0.3 },
  value:        { fontSize: 15,   lineHeight: 20, fontWeight: '500', letterSpacing: 0 },
  body:         { fontSize: 15,   lineHeight: 21, fontWeight: '400', letterSpacing: 0 },
  bodyStrong:   { fontSize: 15,   lineHeight: 21, fontWeight: '600', letterSpacing: 0 },
  rowTime:      { fontSize: 14,   lineHeight: 19, fontWeight: '500', letterSpacing: 0 },
  caption:      { fontSize: 13,   lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  section:      { fontSize: 13,   lineHeight: 18, fontWeight: '600', letterSpacing: 0 },
  small:        { fontSize: 12.5, lineHeight: 17, fontWeight: '400', letterSpacing: 0 },
  smallStrong:  { fontSize: 12.5, lineHeight: 17, fontWeight: '500', letterSpacing: 0 },
  label:        { fontSize: 11,   lineHeight: 15, fontWeight: '500', letterSpacing: 0 },
  unit:         { fontSize: 10.5, lineHeight: 13, fontWeight: '600', letterSpacing: 0.5 },
  tab:          { fontSize: 10,   lineHeight: 12, fontWeight: '500', letterSpacing: 0 },
};

// ── Grid ───────────────────────────────────────────────────────
export const space = {
  screen: 22,      // left/right screen margin
  rail: 72,        // money rail column
  railGap: 14,     // rail → content
  labelCol: 84,    // ledger «label — value» label column
  block: 26,       // between blocks
  hit: 44,         // minimum hit target
};

// Radius means «this is pressable». Content is square.
export const radius = {
  tabBar: 27,
  sheet: 26,
  pass: 22,
  field: 14,
  monogram: 8,
};

// ── Motion ─────────────────────────────────────────────────────
// Six curves for the whole product (handoff «Движение»).
export const motion = {
  press:   { duration: 120, bezier: [0.23, 1, 0.32, 1] },
  appear:  { duration: 200, bezier: [0.23, 1, 0.32, 1] },
  morph:   { duration: 250, bezier: [0.2, 0.92, 0.3, 1] },
  counter: { duration: 520, bezier: [0.16, 1, 0.3, 1] },
  panel:   { duration: 300, bezier: [0.77, 0, 0.175, 1] },
  reject:  { duration: 440, bezier: [0.36, 0.07, 0.19, 0.97] },
  // Spring used when a finger was involved (sheet drag release).
  springSheet: { duration: 300, dampingRatio: 0.8 },
  springSnappy: { duration: 250, dampingRatio: 1 },
};
