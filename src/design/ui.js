// Component library, «Небо смены» (Phase 3 §8.8).
// Surfaces, not lines: groups are objects with depth; hairlines live only
// inside a group. Radii are continuous; inner = outer − 8.
import React, { useEffect } from 'react';
import {
  View, Pressable, ActivityIndicator, StyleSheet, Platform, TextInput, Switch as RNSwitch,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withDelay, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from './Text';
import Icon from './Icon';
import { useTheme } from './theme';
import { motion } from './tokens';
import { SkyView } from './Sky';

const PRESS_EASE = Easing.bezier(...motion.press.bezier);

// Layout props must sit on the Pressable itself, otherwise `flex: 1` or a
// margin lands on the inner animated layer and the control shrinks.
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

// ── Press ──────────────────────────────────────────────────────
// Feedback on touch-down, commit on touch-up: scale 0.97 in 120 ms
// (Reduce Motion: opacity 0.92). Rows get a surface.2 wash instead.
export function Press({
  onPress, onLongPress, disabled, feedback = 'scale', scaleTo = motion.press.scale, style, outerStyle, children,
  hitSlop, accessibilityLabel, accessibilityRole = 'button', accessibilityState, accessibilityHint,
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  const animated = useAnimatedStyle(() => {
    if (feedback !== 'scale') return {};
    if (reduced) return { opacity: 1 - p.value * 0.08 };
    return { transform: [{ scale: 1 - p.value * (1 - scaleTo) }] };
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
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState ?? { disabled: !!disabled }}
      onPressIn={() => { p.value = withTiming(1, { duration: motion.press.duration, easing: PRESS_EASE }); }}
      onPressOut={() => { p.value = withTiming(0, { duration: motion.press.duration, easing: PRESS_EASE }); }}
    >
      <Animated.View style={[inner, animated]}>
        {feedback === 'highlight' ? (
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.c.surface2, borderRadius: inner.borderRadius }, wash]} />
        ) : null}
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── Buttons ────────────────────────────────────────────────────
// L 54 · r 17 (primary action) · M 46 · r 14 · S 38 · r 12.
const SIZES = {
  lg: { h: 54, r: 17, px: 22, font: { fontSize: 17.5, lineHeight: 21, fontWeight: '700' }, icon: 20 },
  md: { h: 46, r: 14, px: 18, font: { fontSize: 16, lineHeight: 20, fontWeight: '600' }, icon: 17 },
  sm: { h: 38, r: 12, px: 14, font: { fontSize: 14, lineHeight: 18, fontWeight: '600' }, icon: 15 },
};

export function buttonColors(c, variant) {
  switch (variant) {
    case 'secondary': return { bg: c.brandTint, fg: c.brand };
    case 'plain': return { bg: 'transparent', fg: c.brand };
    case 'danger': return { bg: c.errorTint, fg: c.error, bold: true };
    case 'dangerFilled': return { bg: c.error, fg: '#FFFFFF', bold: true };
    case 'destructive': return { bg: 'transparent', fg: c.error };
    case 'ink': return { bg: c.ink, fg: c.bg };
    case 'outline': return { bg: c.surface, fg: c.ink, border: c.line };
    case 'success': return { bg: c.successTint, fg: c.success, bold: true };
    case 'onSky': return { bg: c.onSky, fg: null };
    default: return { bg: c.brand, fg: c.onBrand, shadow: true, bold: true };
  }
}

export function Button({
  title, icon, trailing, onPress, variant = 'primary', size = 'lg', loading, loadingTitle, disabled,
  style, textStyle, accessibilityLabel, color,
}) {
  const theme = useTheme();
  const { c } = theme;
  const s = SIZES[size] || SIZES.lg;
  const pal = buttonColors(c, variant);
  const off = disabled && !loading;
  const bg = off ? c.surface2 : pal.bg;
  const fg = off ? c.inkDisabled : color || pal.fg || c.ink;
  return (
    <Press
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      style={[
        {
          minHeight: s.h, borderRadius: s.r, backgroundColor: bg,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: variant === 'plain' || variant === 'destructive' ? 4 : s.px, gap: 9,
        },
        pal.border && !off && { borderWidth: 1, borderColor: pal.border },
        pal.shadow && !off && theme.sh.brand,
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={s.icon} c={fg} weight="semibold" /> : null}
      {!!(loading ? loadingTitle || title : title) && (
        <T v="button" c={fg} numberOfLines={2} style={[s.font, pal.bold && size !== 'lg' && { fontWeight: '700' }, { textAlign: 'center', flexShrink: 1 }, textStyle]}>
          {loading ? loadingTitle || title : title}
        </T>
      )}
      {trailing && !loading ? trailing : null}
    </Press>
  );
}

// ── Surfaces ───────────────────────────────────────────────────
/** Card: surface, radius 20, e1. `flat` — the lighter list-row shadow.
 *  `clip` rounds the content (a sky band at the top) on an inner layer, so
 *  the shadow on the outer one is never clipped away with it. */
export function Card({ children, style, flat, onPress, radius = 20, accessibilityLabel, onLongPress, border, clip }) {
  const t = useTheme();
  const lined = t.dark || border;
  const base = [
    { backgroundColor: t.c.surface, borderRadius: radius },
    flat ? t.sh.flat : t.sh.e1,
    lined && { borderWidth: StyleSheet.hairlineWidth * 2, borderColor: t.c.line },
    style,
  ];
  const body = clip
    ? <View style={{ borderRadius: lined ? radius - StyleSheet.hairlineWidth * 2 : radius, overflow: 'hidden' }}>{children}</View>
    : children;
  if (onPress || onLongPress) {
    return <Press onPress={onPress} onLongPress={onLongPress} scaleTo={0.975} style={base} accessibilityLabel={accessibilityLabel}>{body}</Press>;
  }
  return <View style={base}>{body}</View>;
}

/** Material: tab bar, nav bar, sheets, bottom action panel. Never on cards. */
export function Material({ style, children, edge = 'top' }) {
  const { c, dark } = useTheme();
  const border = { [edge === 'top' ? 'borderTopWidth' : 'borderBottomWidth']: StyleSheet.hairlineWidth * 2, borderColor: c.line };
  if (Platform.OS === 'ios') {
    return (
      <View style={[{ overflow: 'hidden' }, border, style]}>
        <BlurView intensity={40} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.material }]} />
        {children}
      </View>
    );
  }
  return <View style={[{ backgroundColor: c.bg }, border, style]}>{children}</View>;
}

// ── Titles ─────────────────────────────────────────────────────
/** Large title 34 (tab roots) or screen title 27; subtitle 14 on ink2. */
export function LargeTitle({ title, subtitle, right, style, size = 'large', subtitleNode }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, style]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v={size === 'large' ? 'titleLarge' : 'titleScreen'} accessibilityRole="header">{title}</T>
        {subtitleNode || (subtitle ? <T v="body" c="ink2" style={{ fontSize: 14, lineHeight: 18, marginTop: 2 }}>{subtitle}</T> : null)}
      </View>
      {right ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: size === 'large' ? 2 : 0 }}>{right}</View> : null}
    </View>
  );
}

/** Section title 19 display + a caption or a brand link on the right. */
export function SectionTitle({ title, right, onRightPress, style, size = 19 }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }, style]}>
      <T v="titleSection" style={size !== 19 ? { fontSize: size, lineHeight: Math.round(size * 1.2) } : null} accessibilityRole="header">{title}</T>
      {right != null ? (
        onRightPress
          ? <Press onPress={onRightPress} hitSlop={10}><T v="caption" c="brand" weight="600">{right}</T></Press>
          : <T v="caption" c="ink2">{right}</T>
      ) : null}
    </View>
  );
}

// ── Navigation controls ────────────────────────────────────────
/** 40 pt round control: fill (surface.2), sky (glass plate on a sky), brand (primary). */
export function CircleButton({ icon, onPress, variant = 'fill', size = 40, iconSize, color, badge, accessibilityLabel, weight = 'semibold' }) {
  const t = useTheme();
  const { c } = t;
  const bg = variant === 'brand' ? c.brand : variant === 'sky' ? c.onSky : variant === 'surface' ? c.surface : c.surface2;
  const fg = color || (variant === 'brand' ? c.onBrand : variant === 'fill' ? c.ink3 : c.ink);
  return (
    <Press onPress={onPress} accessibilityLabel={accessibilityLabel} hitSlop={4}>
      <View style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        variant === 'brand' && t.sh.brand,
      ]}>
        <Icon name={icon} size={iconSize || (variant === 'brand' ? 22 : 19)} c={fg} weight={variant === 'brand' ? 'bold' : weight} />
      </View>
      {badge ? <Badge count={badge} style={{ position: 'absolute', top: -2, right: -2 }} /> : null}
    </Press>
  );
}

/** Inline nav: back circle + title (22 display) and subtitle, or a centred title. */
export function NavBar({ onBack, title, subtitle, right, style, variant = 'fill', center, left }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ paddingTop: insets.top + 4, paddingHorizontal: 20, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }, style]}>
      {left ?? (onBack ? <CircleButton icon="chevron.left" onPress={onBack} variant={variant} color={variant === 'fill' ? undefined : undefined} accessibilityLabel="Назад" /> : null)}
      {center ? <View style={{ flex: 1, alignItems: 'center' }}>{center}</View> : (
        <View style={{ flex: 1, minWidth: 0 }}>
          {title ? <T v="titleScreen" style={{ fontSize: 22, lineHeight: 26 }} numberOfLines={2} accessibilityRole="header">{title}</T> : null}
          {subtitle ? <T v="caption" c="ink2" numberOfLines={2} style={{ marginTop: 2 }}>{subtitle}</T> : null}
        </View>
      )}
      {right ? <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>{right}</View> : null}
    </View>
  );
}

/** Count badge (error, 17 pt) or a 9 pt dot for unread messages. */
export function Badge({ count, dot, style }) {
  const { c } = useTheme();
  if (dot) return <View style={[{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.error }, style]} />;
  if (!count) return null;
  return (
    <View style={[{ minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.error, alignItems: 'center', justifyContent: 'center' }, style]}>
      <T v="badge" c="#FFFFFF" style={{ fontSize: 10.5, lineHeight: 13 }}>{count > 99 ? '99+' : count}</T>
    </View>
  );
}

// ── Choice ─────────────────────────────────────────────────────
/**
 * Quick tab / chip: selected = brand fill, normal = surface + line,
 * disabled = surface.2. `onRemove` makes an applied filter (brand tint + ×).
 * tone="soft" — selected as brand tint (choice chips inside forms).
 */
export function Chip({ label, selected, onPress, disabled, icon, onRemove, tone, style, size = 'md' }) {
  const { c } = useTheme();
  const sm = size === 'sm';
  const soft = tone === 'soft' || tone === 'sheet';
  let bg = c.surface; let fg = c.ink3; let border = c.line; let weight = '500';
  if (disabled) { bg = c.surface2; fg = c.inkDisabled; border = 'transparent'; }
  else if (onRemove || (selected && soft)) { bg = c.brandTint; fg = c.brand; border = 'transparent'; weight = '600'; }
  else if (selected) { bg = c.brand; fg = c.onBrand; border = 'transparent'; weight = '600'; }
  return (
    <Press
      onPress={onRemove || onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: sm ? 9 : 11, backgroundColor: bg,
        borderWidth: 1, borderColor: border, paddingVertical: sm ? 5 : 6, paddingLeft: sm ? 10 : 12, paddingRight: onRemove ? 9 : sm ? 10 : 12,
        minHeight: sm ? 30 : 34,
      }, style]}
    >
      {icon ? <Icon name={icon} size={13} c={fg} weight="semibold" /> : null}
      <T v="bodyStrong" c={fg} numberOfLines={1} style={{ fontSize: sm ? 12.5 : 13.5, lineHeight: sm ? 16 : 17, fontWeight: weight }}>{label}</T>
      {onRemove ? <Icon name="xmark" size={11} c={fg} weight="bold" style={{ opacity: 0.65 }} /> : null}
    </Press>
  );
}

/** Search field: 44 pt, surface, 1 pt line, radius 14. */
export function SearchField({ value, onChangeText, placeholder = 'Поиск', style, onSubmitEditing, autoFocus }) {
  const { c } = useTheme();
  return (
    <View style={[{ height: 44, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 }, style]}>
      <Icon name="magnifyingglass" size={16} c="ink2" weight="semibold" style={{ opacity: 0.75 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.ink2}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        onSubmitEditing={onSubmitEditing}
        style={{ flex: 1, fontSize: 16, color: c.ink, paddingVertical: 0 }}
      />
    </View>
  );
}

/** Segmented icon switch (list ⇄ map): surface.2 track, surface thumb, brand icon. */
export function Segmented({ items, value, onChange, glass }) {
  const t = useTheme();
  const { c } = t;
  return (
    <View style={[{ flexDirection: 'row', padding: 3, gap: 2, borderRadius: 13, backgroundColor: glass ? c.material : c.surface2 }, glass && t.sh.e1]}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Press key={it.key} onPress={() => onChange(it.key)} accessibilityRole="button" accessibilityLabel={it.label} accessibilityState={{ selected: on }} hitSlop={4}>
            <View style={[
              { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 10, backgroundColor: on ? c.surface : 'transparent' },
              on && { shadowColor: c.shadow, shadowOpacity: t.dark ? 0 : 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
            ]}>
              <Icon name={it.icon} size={18} c={on ? 'brand' : 'ink2'} weight="semibold" />
            </View>
          </Press>
        );
      })}
    </View>
  );
}

/** Text segments («Впереди / Прошедшие»): a brand pill under the active one. */
export function TextTabs({ items, value, onChange, right, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', padding: 3, gap: 2, borderRadius: 13, backgroundColor: c.surface2, alignSelf: 'flex-start' }, style]}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Press key={it.key} onPress={() => onChange(it.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <View style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: on ? c.surface : 'transparent', flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              <T v="bodyStrong" c={on ? 'ink' : 'ink2'} style={{ fontSize: 14, fontWeight: on ? '700' : '500' }}>{it.label}</T>
              {it.count ? <T v="caption" c={on ? 'brand' : 'ink2'} weight="700">{it.count}</T> : null}
            </View>
          </Press>
        );
      })}
      {right}
    </View>
  );
}

// ── Settings ───────────────────────────────────────────────────
/** A group of rows on one surface card. */
export function Group({ children, style }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.c.surface, borderRadius: 16 }, t.sh.flat, t.dark && { borderWidth: 1, borderColor: t.c.line }, style]}>
      <View style={{ borderRadius: t.dark ? 15 : 16, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

/** Row inside a group: icon (brand) · title · value · chevron; destructive in error. */
export function Row({ icon, title, value, sub, right, onPress, destructive, last, chevron = true, iconC, titleNode, badge }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, paddingVertical: 12, minHeight: 50 }}>
      {icon ? <Icon name={icon} size={19} c={destructive ? 'error' : iconC || 'brand'} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {titleNode || <T v="body" c={destructive ? 'error' : 'ink'} style={{ fontSize: 16, lineHeight: 21 }}>{title}</T>}
        {sub ? <T v="caption" c="ink2" style={{ marginTop: 2 }}>{sub}</T> : null}
      </View>
      {badge ? <Badge count={badge} /> : null}
      {value != null ? <T v="body" c="ink2" style={{ fontSize: 14.5, lineHeight: 19 }} numberOfLines={1}>{value}</T> : null}
      {right}
      {onPress && chevron && !destructive && !right ? <Icon name="chevron.right" size={13} c="ink2" weight="semibold" style={{ opacity: 0.65 }} /> : null}
    </View>
  );
  return (
    <View>
      {onPress ? <Press onPress={onPress} feedback="highlight" accessibilityLabel={title}>{content}</Press> : content}
      {!last ? <Divider inset={icon ? 45 : 14} /> : null}
    </View>
  );
}

export function Divider({ inset = 0, style }) {
  const { c } = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: c.line, marginLeft: inset }, style]} />;
}

/** iOS switch; «on» is success green, as in the handoff. */
export function Switch({ value, onValueChange, disabled, accessibilityLabel }) {
  const { c } = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: c.success, false: c.surface3 }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.surface3}
    />
  );
}

/** Seats stepper: surface.2 track, two raised buttons, value in display. */
export function Stepper({ value, min = 1, max = 20, onChange }) {
  const t = useTheme();
  const btn = (icon, next, off) => (
    <Press onPress={() => !off && onChange(next)} disabled={off} accessibilityLabel={icon === 'minus' ? 'Меньше' : 'Больше'}>
      <View style={[{ width: 38, height: 34, borderRadius: 9, backgroundColor: t.c.surface, alignItems: 'center', justifyContent: 'center' }, !off && t.sh.flat]}>
        <Icon name={icon} size={15} c={off ? 'disabled' : 'ink'} weight="bold" />
      </View>
    </Press>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, padding: 3, borderRadius: 12, backgroundColor: t.c.surface2 }}>
      {btn('minus', value - 1, value <= min)}
      <T v="titleSection" style={{ width: 40, textAlign: 'center', fontSize: 17, lineHeight: 21 }} accessibilityLabel={`${value}`}>{value}</T>
      {btn('plus', value + 1, value >= max)}
    </View>
  );
}

// ── States ─────────────────────────────────────────────────────
/**
 * Empty / error state: never blames, always offers an action.
 * tone: 'sky' (a sky tile) · 'error' · 'neutral'.
 */
export function EmptyState({ icon = 'calendar', tone = 'sky', sky = 'day', title, text, action, onAction, secondary, onSecondary, actionVariant = 'primary', style, children }) {
  const t = useTheme();
  const s = t.sky(sky);
  const tile = tone === 'error'
    ? <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: t.c.errorTint, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={26} c="error" /></View>
    : tone === 'neutral'
      ? <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={26} c="ink2" /></View>
      : <SkyView sky={s} radius={18} style={{ width: 56, height: 56, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={26} c={s.ink} /></SkyView>;
  return (
    <View style={[{ alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28 }, style]}>
      {tile}
      <T v="titleSection" style={{ marginTop: 13, fontSize: 17, lineHeight: 22, textAlign: 'center' }}>{title}</T>
      {text ? <T v="body" c="ink2" style={{ marginTop: 5, fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 }}>{text}</T> : null}
      {children}
      {action ? <Button title={action} onPress={onAction} size="md" variant={tone === 'error' ? 'secondary' : actionVariant} style={{ marginTop: 14, alignSelf: 'stretch' }} /> : null}
      {secondary ? <Button title={secondary} onPress={onSecondary} size="md" variant="plain" style={{ marginTop: 4, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

/** Skeleton block: pulses opacity .55 → 1 in 700 ms; static under Reduce Motion. */
export function Skeleton({ w = '100%', h = 12, r = 6, delay = 0, style }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const o = useSharedValue(0.55);
  useEffect(() => {
    if (reduced) return;
    o.value = withDelay(delay, withRepeat(withTiming(1, { duration: 700 }), -1, true));
  }, [reduced, delay, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: c.surface2 }, st, style]} />;
}

/** Skeleton in the shape of a feed card — not grey bars «in general». */
export function SkeletonCard({ index = 0 }) {
  const t = useTheme();
  const d = index * 100;
  return (
    <View style={[{ backgroundColor: t.c.surface, borderRadius: 20 }, t.sh.e1, index > 0 && { opacity: 0.6 }]}>
      <View style={{ borderRadius: 20, overflow: 'hidden' }}>
        <Skeleton w="100%" h={38} r={0} delay={d} />
        <View style={{ padding: 14, gap: 11 }}>
          <View style={{ flexDirection: 'row', gap: 11 }}>
            <Skeleton w={44} h={44} r={14} delay={d} />
            <View style={{ flex: 1, gap: 7, paddingTop: 4 }}>
              <Skeleton w="70%" h={13} delay={d + 100} />
              <Skeleton w="45%" h={10} delay={d + 200} />
            </View>
          </View>
          <Skeleton w="40%" h={24} delay={d + 300} />
        </View>
      </View>
    </View>
  );
}

/** «Нет сети» — cache with an honest timestamp, not emptiness. */
export function OfflineBanner({ text, action, onAction, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: c.surface2 }, style]}>
      <Icon name="wifi.slash" size={16} c="ink3" weight="semibold" />
      <T v="caption" c="ink3" weight="600" style={{ flex: 1, fontSize: 12.5 }}>{text}</T>
      {action ? <Press onPress={onAction} hitSlop={8}><T v="caption" c="brand" weight="700">{action}</T></Press> : null}
    </View>
  );
}

/** Plate with a tinted tile icon: «Оплата — 95 BYN после смены…». */
export function InfoPlate({ icon = 'info.circle', tone = 'neutral', children, style, flat = true }) {
  const t = useTheme();
  const { c } = t;
  const [bg, fg] = tone === 'success' ? [c.successTint, c.success] : tone === 'brand' ? [c.brandTint, c.brand] : tone === 'urgent' ? [c.urgentTint, c.urgent] : [c.surface2, c.ink2];
  return (
    <View style={[{ backgroundColor: c.surface, borderRadius: 20, padding: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, flat ? t.sh.flat : t.sh.e1, t.dark && { borderWidth: 1, borderColor: c.line }, style]}>
      <View style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={19} c={fg} weight="semibold" />
      </View>
      <T v="caption" c="ink3" weight="500" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>{children}</T>
    </View>
  );
}

/** Small label: «Без отмен» (success) · «50+ смен» (brand) · «Новичок» (neutral) · «Подходит лучше всех». */
export function Tag({ label, tone = 'neutral', style }) {
  const { c } = useTheme();
  const [bg, fg] = {
    success: [c.successTint, c.success], brand: [c.brandTint, c.brand], urgent: [c.urgentTint, c.urgentInk],
    error: [c.errorTint, c.error], neutral: [c.surface2, c.ink3],
  }[tone] || [c.surface2, c.ink3];
  return (
    <View style={[{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, backgroundColor: bg, alignSelf: 'flex-start' }, style]}>
      <T v="badge" c={fg} style={{ fontSize: 11, lineHeight: 13 }}>{label}</T>
    </View>
  );
}

/** Number tile for summaries: value (display 24) and a two-line label. */
export function StatTile({ value, label, flex = 1, children, style, valueC = 'ink' }) {
  const t = useTheme();
  return (
    <View style={[{ flex, backgroundColor: t.c.surface, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 12 }, t.sh.flat, t.dark && { borderWidth: 1, borderColor: t.c.line }, style]}>
      <T v="moneyCard" c={valueC} style={{ fontSize: 24, lineHeight: 26 }} numberOfLines={1}>{value}</T>
      <T v="caption" c="ink2" style={{ marginTop: 4, fontSize: 12, lineHeight: 15 }}>{label}</T>
      {children}
    </View>
  );
}

export function Progress({ value = 0, color, track, height = 5, style }) {
  const { c } = useTheme();
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: track || c.line, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height, borderRadius: height / 2, backgroundColor: color || c.brand }} />
    </View>
  );
}

