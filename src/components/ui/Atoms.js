/**
 * Editorial Workforce design atoms.
 * Custom 1.5px line icons, monospaced ID tags, big display money,
 * pills, chips, avatars, stars, logo blocks. Matches the prototype.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { COLORS, FONTS, SIZES, FAMILIES } from '../../constants/theme';

// ─────────────────────────────────────────────────────────────
// Icon — custom 1.5px vector-cut line set
// ─────────────────────────────────────────────────────────────
const PATHS = {
  flame: (
    <>
      <Path d="M12 3c.5 3 3 4.5 4 6.5 1.4 2.7-.4 7-4 7s-5.4-3.6-4-6.5c.7-1.5 1.5-2 2-3" />
      <Path d="M11 13c.3 1 1.2 1.8 2.2 1.8" />
    </>
  ),
  bolt: <Path d="M13 3 5 14h6l-1 7 8-11h-6l1-7z" />,
  arrow: (
    <>
      <Path d="M5 12h14" />
      <Path d="M13 5l7 7-7 7" />
    </>
  ),
  arrowL: (
    <>
      <Path d="M19 12H5" />
      <Path d="M11 5l-7 7 7 7" />
    </>
  ),
  arrowUp: (
    <>
      <Path d="M12 19V5" />
      <Path d="M5 11l7-7 7 7" />
    </>
  ),
  arrowDown: (
    <>
      <Path d="M12 5v14" />
      <Path d="M19 13l-7 7-7-7" />
    </>
  ),
  pin: (
    <>
      <Path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <Circle cx="12" cy="9" r="2.5" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  cal: (
    <>
      <Rect x="3.5" y="5" width="17" height="16" rx="2" />
      <Path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  coin: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M14 9.5c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2 0 2.7 5.5 1.4 5.5 4 0 1.2-1.1 2-2.7 2-1.3 0-2.3-.5-2.8-1.4M11.7 6v1.5M11.7 17v1.5" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </>
  ),
  map: (
    <>
      <Path d="M9 4 3 6.5v14L9 18l6 2.5L21 18V4l-6 2.5L9 4z" />
      <Path d="M9 4v14M15 6.5v14" />
    </>
  ),
  bell: (
    <>
      <Path d="M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <Path d="M10 21a2 2 0 0 0 4 0" />
    </>
  ),
  chat: <Path d="M4 5h16v11H10l-5 4v-4H4V5z" />,
  star: <Path d="m12 3 2.6 5.5 6 .9-4.3 4.3 1 6L12 16.8 6.7 19.7l1-6L3.4 9.4l6-.9L12 3z" />,
  check: <Path d="m4 12 5 5L20 6" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  x: <Path d="m6 6 12 12M18 6 6 18" />,
  filter: <Path d="M3 5h18M6 12h12M10 19h4" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  shield: (
    <>
      <Path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z" />
      <Path d="m9 12 2 2 4-4" />
    </>
  ),
  box: (
    <>
      <Path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9z" />
      <Path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </>
  ),
  tag: (
    <>
      <Path d="M3 12V4h8l10 10-8 8L3 12z" />
      <Circle cx="8" cy="8" r="1.4" />
    </>
  ),
  eye: (
    <>
      <Path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <Circle cx="12" cy="12" r="3" />
    </>
  ),
  home: (
    <>
      <Path d="M3 11 12 3l9 8" />
      <Path d="M5 9.5V21h14V9.5" />
    </>
  ),
  list: <Path d="M3 6h18M3 12h18M3 18h18" />,
  heart: <Path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  truck: (
    <>
      <Rect x="2" y="7" width="11" height="10" rx="1.2" />
      <Path d="M13 10h5l3 3v4h-8z" />
      <Circle cx="6.5" cy="18.5" r="1.8" />
      <Circle cx="17.5" cy="18.5" r="1.8" />
    </>
  ),
  fork: (
    <>
      <Path d="M7 3v8a3 3 0 0 0 6 0V3" />
      <Path d="M10 11v10M17 3v18M17 14h3c0-3-1-7-3-11" />
    </>
  ),
  broom: (
    <>
      <Path d="m14 4 6 6-9 9-6-6 9-9z" />
      <Path d="M3 21l4-4M9 9l5 5" />
    </>
  ),
  cart: (
    <>
      <Path d="M3 4h2l2.5 12h11l2-8H6" />
      <Circle cx="9" cy="20" r="1.5" />
      <Circle cx="17" cy="20" r="1.5" />
    </>
  ),
  mic: (
    <>
      <Rect x="9" y="3" width="6" height="12" rx="3" />
      <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  briefcase: (
    <>
      <Rect x="3" y="7" width="18" height="13" rx="2" />
      <Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
    </>
  ),
  business: (
    <>
      <Path d="M4 22V8l8-4 8 4v14M9 22V12h6v10M2 22h20" />
    </>
  ),
  google: (
    <>
      <Path d="M21 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5c-.2 1.2-.9 2.2-1.9 2.9v2.4h3.1C20 17.8 21 15.2 21 12.2z" />
      <Path d="M12 21c2.7 0 5-.9 6.6-2.4l-3.1-2.4c-.9.6-2 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H3.1v2.5C4.7 18.7 8.1 21 12 21z" />
      <Path d="M6.3 13c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V6.5H3.1A8.96 8.96 0 0 0 3 12c0 1.4.3 2.8 1 4l2.3-3z" />
      <Path d="M12 5.4c1.5 0 2.9.5 3.9 1.5l2.7-2.7C16.9 2.7 14.6 2 12 2 8.1 2 4.7 4.3 3.1 7.5l3.2 2.5c.8-2.4 3-4.6 5.7-4.6z" />
    </>
  ),
  apple: <Path d="M16.5 0c.4 1.4-.2 2.8-1.1 3.7-.9.9-2.3 1.6-3.7 1.5-.4-1.4.3-2.8 1.2-3.7C13.8.7 15.2 0 16.5 0zm4.6 17.5c-.5 1.1-1.1 2.2-1.9 3.2-1.1 1.4-2.6 3.1-4.5 3.1-1.7 0-2.1-1.1-4.4-1.1-2.3 0-2.7 1.1-4.4 1.1-1.9 0-3.4-1.5-4.5-2.9C-.5 17.6-1 12.5.7 9.7c1.2-2 3.1-3.2 4.9-3.2 1.7 0 2.7 1 4.4 1 1.6 0 2.7-1 4.6-1 1.6 0 3.3.9 4.5 2.4-3.9 2.1-3.3 7.7 2 8.6z" />,
  call: (
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  ),
};

export function Icon({ name, size = 20, color = COLORS.fg, strokeWidth = 1.6 }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {path}
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────
// MonoTag — tiny uppercase monospaced label
// ─────────────────────────────────────────────────────────────
export function MonoTag({ children, color = COLORS.fgMuted, bg, style }) {
  return (
    <Text
      style={[
        {
          fontFamily: FAMILIES.mono,
          fontSize: 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color,
          backgroundColor: bg,
          paddingHorizontal: bg ? 6 : 0,
          paddingVertical: bg ? 3 : 0,
          borderRadius: 4,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Money — large display numerals + small mono BYN tail
// ─────────────────────────────────────────────────────────────
export function Money({ amount, size = 36, color = COLORS.fg, currency = 'BYN', style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end' }, style]}>
      <Text
        style={{
          fontFamily: FAMILIES.display,
          fontSize: size,
          letterSpacing: -size * 0.03,
          color,
          lineHeight: size,
        }}
      >
        {amount}
      </Text>
      <Text
        style={{
          fontFamily: FAMILIES.mono,
          fontSize: size * 0.32,
          color: COLORS.fgMuted,
          letterSpacing: 0.5,
          marginLeft: size * 0.16,
          marginBottom: size * 0.08,
        }}
      >
        {currency}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Pill — small rounded label
// ─────────────────────────────────────────────────────────────
export function Pill({ children, bg = 'transparent', color = COLORS.fg, border, icon, style }) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: bg,
          borderWidth: border ? 1 : 0,
          borderColor: border,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={11} color={color} strokeWidth={1.7} />}
      <Text style={{ fontFamily: FAMILIES.textSemi, fontSize: 11, color }}>{children}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip — toggleable category chip
// ─────────────────────────────────────────────────────────────
export function Chip({ active, onPress, children, icon, count }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? COLORS.ink : 'transparent',
        borderWidth: 1,
        borderColor: active ? COLORS.ink : COLORS.line,
      }}
    >
      {icon && <Icon name={icon} size={14} color={active ? COLORS.signal : COLORS.fg} strokeWidth={1.7} />}
      <Text style={{ fontFamily: FAMILIES.textSemi, fontSize: 13, color: active ? COLORS.signal : COLORS.fg }}>
        {children}
      </Text>
      {count != null && (
        <Text style={{ fontFamily: FAMILIES.textMed, fontSize: 12, color: active ? 'rgba(242,233,78,0.6)' : COLORS.fgFaint }}>
          {count}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// LogoBlock — typographic category square
// ─────────────────────────────────────────────────────────────
export function LogoBlock({ letters, size = 44, bg = COLORS.ink, color = COLORS.signal, radius = 12 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: FAMILIES.display, fontSize: size * 0.4, color, letterSpacing: -0.5 }}>
        {letters}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar — initials in circle
// ─────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 40, bg = COLORS.ink, color = COLORS.paper }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: FAMILIES.display, fontSize: size * 0.38, color, letterSpacing: -0.5 }}>
        {initials}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Stars — rating row
// ─────────────────────────────────────────────────────────────
export function Stars({ value = 0, size = 12, color = COLORS.fg }) {
  const full = Math.floor(value);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Icon key={i} name="star" size={size} color={i < full ? color : 'rgba(14,15,12,0.18)'} strokeWidth={1.4} />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MetaRail — divided columns of mono-label / display-value
// ─────────────────────────────────────────────────────────────
export function MetaRail({ items, color = COLORS.fg, mutedColor = COLORS.fgMuted }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((it, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            paddingVertical: 10,
            paddingLeft: i === 0 ? 0 : 12,
            borderLeftWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
            borderLeftColor: COLORS.line,
          }}
        >
          <Text style={{ fontFamily: FAMILIES.mono, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase', color: mutedColor, marginBottom: 4 }}>
            {it.label}
          </Text>
          <Text style={{ fontFamily: FAMILIES.display, fontSize: 15, letterSpacing: -0.3, color, lineHeight: 17 }}>
            {it.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Icon button — round 40×40, used in headers
// ─────────────────────────────────────────────────────────────
export function IconButton({ icon, onPress, badge, size = 40, color = COLORS.fg, bg = COLORS.white, border = COLORS.line }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={18} color={color} strokeWidth={1.6} />
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 7,
            height: 7,
            borderRadius: 99,
            backgroundColor: COLORS.live,
            borderWidth: 1.5,
            borderColor: bg,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// PrimaryButton — canary signal CTA
// ─────────────────────────────────────────────────────────────
export function PrimaryButton({ title, onPress, disabled, icon, style }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: SIZES.buttonHeight,
          backgroundColor: disabled ? COLORS.paperDeep : COLORS.signal,
          borderRadius: SIZES.radiusPill,
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: FAMILIES.textBold, fontSize: 15, color: disabled ? COLORS.fgFaint : COLORS.ink, letterSpacing: -0.2 }}>
        {title}
      </Text>
      {icon && <Icon name={icon} size={18} color={disabled ? COLORS.fgFaint : COLORS.ink} strokeWidth={2} />}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
// GhostButton — outlined alternative
// ─────────────────────────────────────────────────────────────
export function GhostButton({ title, onPress, icon, style, dark }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: SIZES.buttonHeight,
          backgroundColor: 'transparent',
          borderRadius: SIZES.radiusPill,
          paddingHorizontal: 24,
          borderWidth: 1,
          borderColor: dark ? 'rgba(244,241,234,0.3)' : COLORS.line,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={dark ? COLORS.fgInv : COLORS.fg} strokeWidth={1.7} />}
      <Text style={{ fontFamily: FAMILIES.textSemi, fontSize: 14, color: dark ? COLORS.fgInv : COLORS.fg }}>{title}</Text>
    </TouchableOpacity>
  );
}
