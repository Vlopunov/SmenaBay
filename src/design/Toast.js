// Toast: confirms an action without blocking. Lives 3.2 s above the tab
// bar and never covers the main action; with «Отменить» it stays 5 s,
// after that the action is final. Appears on spring.default
// (translateY 10 → 0 + opacity); Reduce Motion — opacity only.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from './Text';
import Icon from './Icon';
import { Press } from './ui';
import { useTheme } from './theme';
import { motion, palettes } from './tokens';

let listener = null;
let seq = 0;

export const toast = {
  /** toast.show({ text, kind: 'success' | 'error' | 'info', action, onAction }) */
  show(opts) {
    seq += 1;
    listener?.({ ...(typeof opts === 'string' ? { text: opts } : opts), id: seq });
  },
  success(text, extra) { this.show({ text, kind: 'success', ...extra }); },
  error(text, extra) { this.show({ text, kind: 'error', ...extra }); },
};

export function ToastHost() {
  const { c, dark } = useTheme();
  // The toast is an inverted surface, so its link takes the other theme's brand
  // (the handoff's brand.pressed is ~1.6:1 on ink).
  const link = (dark ? palettes.light : palettes.dark).brand;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [item, setItem] = useState(null);
  const v = useSharedValue(0);

  useEffect(() => {
    listener = (next) => setItem(next);
    return () => { listener = null; };
  }, []);

  useEffect(() => {
    if (!item) return undefined;
    v.value = 0;
    v.value = reduced ? withTiming(1, { duration: 200 }) : withSpring(1, motion.default);
    const life = item.action ? 5000 : motion.toastLife;
    const id = setTimeout(() => {
      v.value = withTiming(0, { duration: 200 });
      setTimeout(() => setItem((cur) => (cur && cur.id === item.id ? null : cur)), 210);
    }, life);
    return () => clearTimeout(id);
  }, [item, reduced, v]);

  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: reduced ? [] : [{ translateY: (1 - v.value) * 10 }],
  }));

  if (!item) return null;
  const icon = item.kind === 'error' ? 'exclamationmark.circle' : item.kind === 'info' ? 'info.circle' : 'checkmark.circle.fill';
  const iconC = item.kind === 'error' ? c.error : item.kind === 'info' ? c.bg : c.success;
  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 62 + (item.lift || 0) }, style]}
    >
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 13, paddingHorizontal: 16, borderRadius: 16,
        backgroundColor: c.ink, shadowColor: 'rgb(20,14,8)', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 10 },
      }}>
        <Icon name={icon} size={20} c={iconC} weight="semibold" />
        <T v="bodyStrong" c={c.bg} style={{ flex: 1, fontSize: 14, lineHeight: 19 }}>{item.text}</T>
        {item.action ? (
          <Press onPress={() => { item.onAction?.(); setItem(null); }} hitSlop={10}>
            <T v="bodyStrong" c={link} style={{ fontSize: 14, fontWeight: '700' }}>{item.action}</T>
          </Press>
        ) : null}
      </View>
    </Animated.View>
  );
}
