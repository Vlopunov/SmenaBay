// One language of shift states (§9.2): one colour, one symbol, one text
// wherever it appears. The symbol is mandatory — in high contrast and for
// colour-blind people the state reads without colour.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSpring, Easing, useReducedMotion,
} from 'react-native-reanimated';
import T from './Text';
import Icon from './Icon';
import { useTheme } from './theme';
import { motion } from './tokens';

// tone → [background, symbol colour, text colour]
const TONES = {
  neutral: (c) => [c.surface2, c.ink2, c.ink3],
  pending: (c) => [c.urgentTint, c.urgent, c.urgentInk],
  success: (c) => [c.successTint, c.success, c.success],
  running: (c) => [c.brand, c.onBrand, c.onBrand],
  error: (c) => [c.errorTint, c.error, c.error],
  urgent: (c) => [c.urgentTint, c.urgent, c.urgentInk],
};

export const STATES = {
  full:      { label: 'Мест нет', symbol: 'nosign', tone: 'neutral' },
  pending:   { label: 'Ждёт ответа', symbol: 'clock', tone: 'pending' },
  confirmed: { label: 'Подтверждена', symbol: 'pulse', tone: 'success' },
  soon:      { label: 'Скоро', symbol: 'timer', tone: 'success' },
  running:   { label: 'Идёт', symbol: 'circle.fill', tone: 'running' },
  done:      { label: 'Выполнена', symbol: 'checkmark', tone: 'success' },
  rejected:  { label: 'Не подошло', symbol: 'xmark.circle', tone: 'neutral' },
  cancelled: { label: 'Отменена', symbol: 'xmark.circle', tone: 'error' },
  urgent:    { label: 'Срочно', symbol: 'bolt.fill', tone: 'urgent' },
};

/** The breathing dot of «Подтверждена»: the halo breathes, the dot stays. */
export function BreathingDot({ size = 9, color }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    // Phase 5: withRepeat(withTiming(scale 1→1.4 + opacity .55→0, 1000), −1)
    p.value = withRepeat(withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) }), -1, false);
  }, [reduced, p]);
  const halo = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ scale: 1 + p.value * 0.4 }],
  }));
  const col = color || c.success;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {!reduced ? <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: col }, halo]} /> : null}
      <View style={{ width: size - 2, height: size - 2, borderRadius: size / 2, backgroundColor: col }} />
    </View>
  );
}

/**
 * <StatusBadge state="pending" /> · <StatusBadge state="soon" label="Через 1 ч 45 мин" />
 * size: 'md' (details, lists) | 'sm' (inside a card's sky band)
 * `onSky` puts a neutral state on the surface instead of surface.2.
 */
export function StatusBadge({ state = 'pending', label, size = 'md', style, onSky }) {
  const { c } = useTheme();
  const def = STATES[state] || STATES.pending;
  let [bg, fg, ink] = TONES[def.tone](c);
  if (onSky && def.tone === 'neutral') bg = c.onSky;
  const sm = size === 'sm';
  const text = label || def.label;
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`Статус: ${text}`}
      style={[{
        flexDirection: 'row', alignItems: 'center', gap: sm ? 3 : 5, alignSelf: 'flex-start',
        paddingVertical: sm ? 4 : 5, paddingLeft: sm ? 6 : 8, paddingRight: sm ? 8 : 10,
        borderRadius: sm ? 8 : 9, backgroundColor: bg,
      }, style]}
    >
      {def.symbol === 'pulse'
        ? <BreathingDot size={sm ? 8 : 9} color={fg} />
        : <Icon name={def.symbol} size={sm ? 11 : 12} c={fg} weight="bold" />}
      <T v="badge" c={ink} style={sm ? null : { fontSize: 12, lineHeight: 14 }}>{text}</T>
    </View>
  );
}

/**
 * Seats as dots, not percentages: «2 из 2» reads instantly.
 * taken — occupied seats; mine — how many of them are the viewer's
 * (drawn in success); size 7 in cards, 9 in details, 16 on a sky.
 */
export function SeatDots({ taken = 0, total = 1, mine = 0, size = 7, color, freeColor, popLast }) {
  const { c } = useTheme();
  const n = Math.max(1, Math.min(total, 8));
  const filled = total <= 8 ? taken : Math.round((taken / total) * n);
  return (
    <View style={{ flexDirection: 'row', gap: size >= 12 ? 6 : size >= 9 ? 4 : 3 }} accessibilityLabel={`${taken} из ${total} мест занято`}>
      {Array.from({ length: n }).map((_, i) => {
        const isMine = i >= filled - mine && i < filled;
        const bg = i < filled ? (isMine ? c.success : color || c.brand) : freeColor || c.line;
        return popLast && i === filled - 1
          ? <PopDot key={i} size={size} bg={bg} />
          : <View key={i} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }} />;
      })}
    </View>
  );
}

// A seat that just closed: scale 0.72 → 1 on the fill spring.
function PopDot({ size, bg }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(reduced ? 1 : 0.72);
  useEffect(() => { if (!reduced) s.value = withSpring(1, motion.fill); }, [reduced, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, st]} />;
}
