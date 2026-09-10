// Core building blocks of the «Ведомость» system.
// Rules that shape everything here (handoff «Design System Rules»):
//  · a card is not a list unit — lists are hairlines;
//  · radius means «pressable», content is square;
//  · only three glyphs live in content: bolt, star, timer.
import React from 'react';
import { View, Pressable, ActivityIndicator, StyleSheet, Image, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from './Text';
import Icon from './Icon';
import { useTheme } from './theme';
import { motion } from './tokens';
import { initials } from './format';

const PRESS_EASE = Easing.bezier(...motion.press.bezier);

// Layout props must live on the Pressable itself, otherwise `flex: 1` or a
// margin lands on the inner animated layer and the button shrinks to its
// content inside a row.
const OUTER_KEYS = new Set([
  'flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight', 'marginHorizontal', 'marginVertical',
  'position', 'top', 'left', 'right', 'bottom', 'zIndex',
]);
function splitStyle(style) {
  const flat = StyleSheet.flatten(style) || {};
  const outer = {}; const inner = {};
  Object.keys(flat).forEach((k) => { (OUTER_KEYS.has(k) ? outer : inner)[k] = flat[k]; });
  return [outer, inner];
}

// ── Press feedback ─────────────────────────────────────────────
// Feedback on touch-down, commit on touch-up. Buttons scale to 0.97 and
// dim to 0.85 in 120 ms; rows get a `fill` wash instead.
export function Press({ onPress, onLongPress, disabled, feedback = 'scale', style, outerStyle, children, hitSlop, accessibilityLabel, accessibilityRole = 'button', accessibilityState }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const animated = useAnimatedStyle(() => {
    if (feedback !== 'scale') return {};
    return {
      opacity: 1 - p.value * 0.15,
      transform: reduced ? [] : [{ scale: 1 - p.value * 0.03 }],
    };
  });
  const wash = useAnimatedStyle(() => ({ opacity: p.value }));
  const [autoOuter, inner] = splitStyle(style);
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[autoOuter, outerStyle]}
      pressRetentionOffset={12}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { disabled: !!disabled }}
      onPressIn={() => { p.value = withTiming(1, { duration: motion.press.duration, easing: PRESS_EASE }); }}
      onPressOut={() => { p.value = withTiming(0, { duration: motion.press.duration, easing: PRESS_EASE }); }}
    >
      <Animated.View style={[inner, animated]}>
        {feedback === 'highlight' ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.c.fill }, wash]} />
        ) : null}
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Buttons ────────────────────────────────────────────────────
// Every action is a capsule (radius = height / 2).
const BUTTON_HEIGHT = { lg: 52, md: 46, sm: 36 };

export function Button({ title, icon, onPress, variant = 'primary', size = 'lg', loading, disabled, style, textStyle, accessibilityLabel }) {
  const theme = useTheme();
  const { c } = theme;
  const h = BUTTON_HEIGHT[size];
  const palette = {
    primary: { bg: c.accent, fg: c.onAccent, shadow: true },
    secondary: { bg: c.fill, fg: c.label },
    ink: { bg: c.ink, fg: c.onInk },
    plain: { bg: 'transparent', fg: c.accent },
    destructive: { bg: 'transparent', fg: c.destructive },
  }[variant];
  const off = disabled && !loading;
  const bg = off ? c.fill : palette.bg;
  const fg = off ? c.labelTertiary : palette.fg;
  const fontV = size === 'sm' ? 'bodyStrong' : size === 'md' ? 'bodyStrong' : 'button';
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      style={[
        {
          height: h, borderRadius: h / 2, backgroundColor: bg,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: size === 'sm' ? 16 : 20, gap: 6,
        },
        palette.shadow && !off && !theme.dark && {
          shadowColor: c.accentShadow, shadowOpacity: 0.26, shadowRadius: 9, shadowOffset: { width: 0, height: 5 },
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 13 : 15} c={fg} weight="semibold" /> : null}
      {!!title && <T v={fontV} c={fg} numberOfLines={1} style={textStyle}>{title}</T>}
    </Press>
  );
}

// ── Glass material (control layer only) ────────────────────────
export function Glass({ style, children, radius = 18, border = true }) {
  const { c, dark, glass } = useTheme();
  if (glass && Platform.OS === 'ios') {
    return (
      <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: border ? StyleSheet.hairlineWidth * 2 : 0, borderColor: c.glassBorder }, style]}>
        <BlurView intensity={60} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass, opacity: 0.55 }]} />
        {children}
      </View>
    );
  }
  return (
    <View style={[{ borderRadius: radius, backgroundColor: c.glassFallback, borderWidth: border ? StyleSheet.hairlineWidth * 2 : 0, borderColor: c.glassFallbackBorder }, style]}>
      {children}
    </View>
  );
}

/** Round 36 pt navbar button: glass by default, accent for the primary action. */
export function RoundButton({ icon, onPress, variant = 'glass', size = 36, iconSize = 17, accessibilityLabel, badge }) {
  const { c } = useTheme();
  const inner = (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={iconSize} c={variant === 'accent' ? c.onAccent : c.accent} weight="semibold" />
    </View>
  );
  return (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel} hitSlop={4}>
      {variant === 'glass' ? (
        <Glass radius={size / 2}>{inner}</Glass>
      ) : (
        <View style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: variant === 'accent' ? c.accent : c.fill },
          variant === 'accent' && { shadowColor: c.accentShadow, shadowOpacity: 0.28, shadowRadius: 6, shadowOffset: { width: 0, height: 4 } },
        ]}>{inner}</View>
      )}
      {badge ? <Badge count={badge} style={{ position: 'absolute', top: -4, right: -6 }} /> : null}
    </Press>
  );
}

export function Badge({ count, style }) {
  const { c } = useTheme();
  if (!count) return null;
  return (
    <View style={[{
      minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
      backgroundColor: c.destructive, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: c.ledger,
    }, style]}>
      <T v="label" c="#FFFFFF" style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '700' }}>{count > 99 ? '99+' : count}</T>
    </View>
  );
}

// ── Screen scaffolding ─────────────────────────────────────────
export function NavBar({ onBack, left, right, center, style, variant = 'glass' }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top + 4, paddingHorizontal: 16, height: insets.top + 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      <View style={{ minWidth: 36, alignItems: 'flex-start' }}>
        {left ?? (onBack ? <RoundButton icon="chevron.left" iconSize={18} onPress={onBack} variant={variant} accessibilityLabel="Назад" /> : null)}
      </View>
      {center ? <View style={{ flex: 1, alignItems: 'center' }}>{center}</View> : null}
      <View style={{ minWidth: 36, flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function LargeTitle({ title, subtitle, right, style, titleV = 'screenTitle' }) {
  return (
    <View style={[{ paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, style]}>
      <View style={{ flex: 1 }}>
        <T v={titleV} accessibilityRole="header">{title}</T>
        {subtitle ? <T v="caption" c="secondary" style={{ marginTop: 2 }}>{subtitle}</T> : null}
      </View>
      {right ? <View style={{ paddingTop: 4, flexDirection: 'row', gap: 8, alignItems: 'center' }}>{right}</View> : null}
    </View>
  );
}

// ── Hairlines ──────────────────────────────────────────────────
// Row separators stop 22 pt short of both edges — a ledger entry, not a
// table cell. Section separators run full width.
export function Separator({ inset = false, warm = false, style }) {
  const { c } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: warm ? c.warmSeparator : c.separator, marginHorizontal: inset ? 22 : 0 }, style]} />;
}

export function SectionHeader({ title, right, onRightPress, rightAccent, warm, top = true }) {
  return (
    <View>
      {top ? <Separator warm={warm} /> : null}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 11, paddingBottom: 10 }}>
        <T v="section" c={warm ? 'secondary' : 'label'} accessibilityRole="header">{title}</T>
        {right ? (
          onRightPress ? (
            <Press onPress={onRightPress} feedback="scale" hitSlop={10}><T v="caption" c="accent">{right}</T></Press>
          ) : <T v="caption" c={rightAccent ? 'accent' : 'secondary'}>{right}</T>
        ) : null}
      </View>
      <Separator warm={warm} />
    </View>
  );
}

/** Ledger row: 84 pt label column, then value. */
export function LedgerRow({ label, value, sub, right, onPress, chevron, last, warm, valueV = 'value', valueC = 'label', alignTop = true, children }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: alignTop ? 'flex-start' : 'center', gap: 14, paddingHorizontal: 22, paddingTop: 13, paddingBottom: 14 }}>
      {label != null ? <T v="caption" c="secondary" style={{ width: 84, lineHeight: 19, paddingTop: alignTop ? 1 : 0 }}>{label}</T> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {value != null ? <T v={valueV} c={valueC}>{value}</T> : null}
        {sub ? <T v="caption" c="secondary" style={{ marginTop: 1 }}>{sub}</T> : null}
        {children}
      </View>
      {right}
      {chevron ? <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" style={{ alignSelf: 'center' }} /> : null}
    </View>
  );
  return (
    <View>
      {onPress ? <Press onPress={onPress} feedback="highlight" accessibilityLabel={typeof label === 'string' ? `${label}: ${value ?? ''}` : undefined}>{content}</Press> : content}
      {!last ? <Separator inset warm={warm} /> : null}
    </View>
  );
}

// ── Identity ───────────────────────────────────────────────────
/** One monogram: the logo if present, otherwise an ink square with two letters. */
export function Monogram({ name, logo, size = 34 }) {
  const { c } = useTheme();
  const r = size <= 28 ? 7 : size <= 34 ? 9 : 10;
  if (logo && /^(https?:|file:)/.test(logo) && !logo.includes('pravatar.cc')) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size, borderRadius: r, backgroundColor: c.fill }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
      <T v="section" c="onInk" style={{ fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.46) }}>{initials(name)}</T>
    </View>
  );
}

/** People are round; companies are square. */
export function PersonAvatar({ first, last, uri, size = 44 }) {
  const { c } = useTheme();
  if (uri && /^(https?:|file:)/.test(uri) && !uri.includes('pravatar.cc')) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.fill }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.ink, alignItems: 'center', justifyContent: 'center' }}>
      <T v="section" c="onInk" style={{ fontSize: Math.round(size * 0.34), lineHeight: Math.round(size * 0.42) }}>{initials(first, last)}</T>
    </View>
  );
}

// ── Status ─────────────────────────────────────────────────────
// Only «Подтверждена» is filled with colour; the rest differ by symbol,
// because a five-colour code survives neither colour-blindness nor sunlight.
export const STATUS = {
  pending:   { label: 'Ждёт ответа', symbol: 'clock' },
  confirmed: { label: 'Подтверждена', symbol: 'checkmark.circle' },
  done:      { label: 'Выполнена', symbol: 'checkmark.seal' },
  cancelled: { label: 'Отменена', symbol: 'slash.circle' },
  rejected:  { label: 'Не подошло', symbol: 'xmark.circle' },
  full:      { label: 'Мест нет', symbol: 'person.slash' },
  running:   { label: 'Идёт сейчас', symbol: 'timer' },
};

export function StatusPill({ status, label, size = 'md', style }) {
  const { c } = useTheme();
  const def = STATUS[status] || STATUS.pending;
  const filled = status === 'confirmed';
  const h = size === 'lg' ? 40 : size === 'sm' ? 22 : 24;
  const fg = filled ? c.onAccent : c.label;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Статус: ${label || def.label}`}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: size === 'lg' ? 6 : 4,
        height: h, borderRadius: h / 2, paddingHorizontal: size === 'lg' ? 16 : 9,
        backgroundColor: filled ? c.accent : c.fill, alignSelf: 'flex-start',
      }, style]}
    >
      <Icon name={def.symbol} size={size === 'lg' ? 16 : 12} c={fg} weight="semibold" />
      <T v={size === 'lg' ? 'bodyStrong' : 'label'} c={fg} style={size === 'lg' ? null : { fontSize: 11.5, fontWeight: '600' }}>{label || def.label}</T>
    </View>
  );
}

/** Quiet status: symbol + words, no fill (right side of a ledger line). */
export function StatusText({ status, label }) {
  const def = STATUS[status] || STATUS.pending;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={def.symbol} size={12} c="secondary" />
      <T v="small" c="secondary">{label || def.label}</T>
    </View>
  );
}

// ── Choice ─────────────────────────────────────────────────────
/** Chip: 34 pt capsule on fill; selected chips are ink, never accent.
 *  tone="sheet" — on a sheet the unselected fill is fillSecondary and text is 14 pt. */
export function Chip({ label, selected, onPress, icon, tone }) {
  const sheet = tone === 'sheet';
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={{ height: 34, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 5 }}
    >
      <ChipFill selected={selected} sheet={sheet} />
      {icon ? <Icon name={icon} size={13} c={selected ? 'onInk' : 'label'} /> : null}
      <T v="body" c={selected ? 'onInk' : 'label'} style={[{ fontWeight: selected ? '600' : sheet ? '500' : '400' }, sheet && { fontSize: 14, lineHeight: 19 }]}>{label}</T>
    </Press>
  );
}

function ChipFill({ selected, sheet }) {
  const { c } = useTheme();
  return <View style={[StyleSheet.absoluteFill, { borderRadius: 17, backgroundColor: selected ? c.ink : sheet ? c.fillSecondary : c.fill }]} />;
}

/** Text tabs with a 2 pt accent underline under the active one. */
export function TextTabs({ items, value, onChange, right, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end', gap: 19, paddingHorizontal: 22 }, style]}>
      {items.map((it) => {
        const active = it.key === value;
        return (
          <Press key={it.key} feedback="none" onPress={() => onChange(it.key)} accessibilityRole="tab" accessibilityState={{ selected: active }} hitSlop={8}>
            <View style={{ paddingBottom: 7 }}>
              <T v="body" c={active ? 'label' : 'secondary'} style={{ fontWeight: active ? '600' : '400' }}>{it.label}</T>
              {active ? <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, borderRadius: 1, backgroundColor: c.accent }} /> : null}
            </View>
          </Press>
        );
      })}
      {right ? <View style={{ marginLeft: 'auto', paddingBottom: 7 }}>{right}</View> : null}
    </View>
  );
}

// ── Numbers ────────────────────────────────────────────────────
/** Four numbers in one line with 44 pt vertical rules. */
export function StatRow({ items, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', paddingHorizontal: 22 }, style]}>
      {items.map((it, i) => (
        <View key={it.label} style={{ flex: 1, flexDirection: 'row' }}>
          {i > 0 ? <View style={{ width: StyleSheet.hairlineWidth * 2, height: 44, backgroundColor: c.separator, marginRight: 14, marginTop: 4 }} /> : null}
          <View style={{ flex: 1 }}>
            {it.node ?? <T v="title" c={it.accent ? 'accent' : 'label'} numberOfLines={1} maxFontSizeMultiplier={1.15} style={String(it.value).length > 4 ? { fontSize: 22, letterSpacing: -0.6 } : null}>{it.value}</T>}
            <T v="small" c="secondary" numberOfLines={2}>{it.label}</T>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Seats indicator: taken segments in ink, free ones in fillSecondary. */
export function SeatsBar({ taken, total, width = 46 }) {
  const { c } = useTheme();
  const n = Math.max(1, Math.min(total, 6));
  const gap = 3;
  const seg = (width - gap * (n - 1)) / n;
  const filledSegs = total <= 6 ? taken : Math.round((taken / total) * n);
  return (
    <View style={{ flexDirection: 'row', gap }} accessibilityLabel={`${taken} из ${total} мест занято`}>
      {Array.from({ length: n }).map((_, i) => (
        <View key={i} style={{ width: seg, height: 3, borderRadius: 1.5, backgroundColor: i < filledSegs ? c.ink : c.fillSecondary }} />
      ))}
    </View>
  );
}

// ── Messages ───────────────────────────────────────────────────
/** Footnote with an icon — the calm «here is what happens next» line. */
export function Note({ icon = 'info.circle', children, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 22 }, style]}>
      <Icon name={icon} size={15} c="secondary" style={{ marginTop: 1 }} />
      <T v="small" c="secondary" style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

/** A line on `fill` that names one thing needing attention. */
export function FillBanner({ icon, title, text, action, onAction, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ backgroundColor: c.fill, paddingHorizontal: 22, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      {icon ? <Icon name={icon} size={17} c="label" /> : null}
      <View style={{ flex: 1 }}>
        <T v={action ? 'rowTitle' : 'bodyStrong'} style={action ? { fontSize: 16, lineHeight: 21 } : null}>{title}</T>
        {text ? <T v="small" c="secondary" style={{ marginTop: 2 }}>{text}</T> : null}
      </View>
      {action ? <Button title={action} size="sm" onPress={onAction} /> : null}
    </View>
  );
}

/** Empty state: names a number and a next step instead of reporting absence. */
export function EmptyState({ title, text, action, onAction, icon, style }) {
  return (
    <View style={[{ paddingHorizontal: 22, paddingVertical: 28, alignItems: 'flex-start', gap: 6 }, style]}>
      {icon ? <Icon name={icon} size={22} c="secondary" style={{ marginBottom: 4 }} /> : null}
      <T v="rowTitle">{title}</T>
      {text ? <T v="body" c="secondary">{text}</T> : null}
      {action ? <Button title={action} size="sm" onPress={onAction} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

/** Settings-style row with a switch or a chevron. */
export function SettingRow({ title, sub, right, onPress, destructive, last, icon }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 14, minHeight: 52 }}>
      {icon ? <Icon name={icon} size={17} c={destructive ? 'destructive' : 'secondary'} /> : null}
      <View style={{ flex: 1 }}>
        <T v="value" c={destructive ? 'destructive' : 'label'} style={{ fontSize: 16, lineHeight: 21 }}>{title}</T>
        {sub ? <T v="caption" c="secondary" style={{ marginTop: 1 }}>{sub}</T> : null}
      </View>
      {right ?? (onPress && !destructive ? <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" /> : null)}
    </View>
  );
  return (
    <View>
      {onPress ? <Press onPress={onPress} feedback="highlight">{content}</Press> : content}
      {!last ? <Separator inset /> : null}
    </View>
  );
}
