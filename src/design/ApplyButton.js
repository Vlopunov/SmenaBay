// The apply button — the product's key moment (§9.1 · 1).
// Press: scale 0.97 in 120 ms. Release: the button morphs into «Отклик
// отправлен» — a success layer fades in on spring.snappy (damping 18 ·
// stiffness 250), the checkmark grows 0.6 → 1, text and sum follow 80 ms
// later; the success haptic lands on the first frame of the morph.
// Refusal: shake ×2 (±7 ±6 ±4 ±2, 450 ms) with the error haptic; under
// Reduce Motion no shake — a red outline for 200 ms instead.
// Colours never animate on the UI thread: states are stacked layers.
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, withRepeat, withDelay, useReducedMotion, Easing,
} from 'react-native-reanimated';
import T from './Text';
import Icon from './Icon';
import { Press } from './ui';
import { useTheme } from './theme';
import { motion } from './tokens';
import { haptic } from './haptics';
import { money } from './format';
import { rublesLabel } from './Money';

const H = 54;
const R = 17;

/** state: 'idle' | 'sending' | 'sent' | 'error' | 'full' */
export default function ApplyButton({ state = 'idle', amount, onPress, label = 'Откликнуться', title, note }) {
  const t = useTheme();
  const { c } = t;
  const reduced = useReducedMotion();
  const sent = state === 'sent';
  const m = useSharedValue(sent ? 1 : 0);
  const check = useSharedValue(sent ? 1 : 0.6);
  const text = useSharedValue(sent ? 1 : 0);
  const shake = useSharedValue(0);
  const outline = useSharedValue(0);
  const prev = useRef(state);

  useEffect(() => {
    const was = prev.current;
    prev.current = state;
    if (state === 'sent' && was !== 'sent') {
      haptic.success();
      if (reduced) {
        m.value = withTiming(1, { duration: 200 });
        check.value = 1;
        text.value = withTiming(1, { duration: 200 });
      } else {
        m.value = withSpring(1, motion.snappy);
        check.value = withSpring(1, motion.snappy);
        text.value = withDelay(80, withTiming(1, { duration: 180 }));
      }
    } else if (state !== 'sent' && was === 'sent') {
      m.value = withTiming(0, { duration: 200 });
      text.value = 0;
      check.value = 0.6;
    }
    if (state === 'error' && was !== 'error') {
      haptic.error();
      if (reduced) {
        outline.value = withSequence(withTiming(1, { duration: 0 }), withDelay(200, withTiming(0, { duration: 200 })));
      } else {
        const step = motion.shake.duration / 10;
        const ease = Easing.bezier(0.23, 1, 0.32, 1);
        shake.value = withRepeat(withSequence(
          withTiming(-7, { duration: step, easing: ease }),
          withTiming(6, { duration: step, easing: ease }),
          withTiming(-4, { duration: step, easing: ease }),
          withTiming(2, { duration: step, easing: ease }),
          withTiming(0, { duration: step, easing: ease }),
        ), 2, false);
      }
    }
  }, [state, reduced, m, check, text, shake, outline]);

  const successLayer = useAnimatedStyle(() => ({ opacity: m.value }));
  const idleLabel = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, m.value * 1.6) }));
  const sentLabel = useAnimatedStyle(() => ({ opacity: text.value }));
  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: check.value }], opacity: Math.min(1, m.value * 1.4) }));
  const shaker = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const outlineStyle = useAnimatedStyle(() => ({ opacity: outline.value }));

  const noteView = note ? (
    <T v="caption" c="ink2" style={{ textAlign: 'center', marginTop: 8, fontSize: 12.5, lineHeight: 17 }} accessibilityLiveRegion="polite">{note}</T>
  ) : null;

  if (state === 'full') {
    return (
      <Animated.View style={shaker}>
        <Press onPress={onPress} accessibilityLabel="Мест нет" style={{ height: H, borderRadius: R, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <T v="button" c="disabled">Мест нет</T>
        </Press>
        {noteView}
      </Animated.View>
    );
  }

  const busy = state === 'sending';
  return (
    <View>
      <Animated.View style={shaker}>
        <Press
          onPress={onPress}
          disabled={busy || sent}
          feedback={sent ? 'none' : 'scale'}
          accessibilityLabel={sent ? 'Отклик отправлен. Ждёт ответа заказчика' : `${label} на смену${title ? ` ${title}` : ''}, ${rublesLabel(amount)}`}
          accessibilityState={{ disabled: busy || sent, busy }}
          style={[{ height: H, borderRadius: R }, !sent && t.sh.brand]}
        >
          <View style={{ height: H, borderRadius: R, overflow: 'hidden', backgroundColor: c.brand }}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.successTint }, successLayer]} />
            <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, idleLabel]}>
              {busy ? (
                <>
                  <ActivityIndicator size="small" color={c.onBrand} />
                  <T v="button" c="onBrand">Отправляем…</T>
                </>
              ) : (
                <>
                  <T v="button" c="onBrand">{label}</T>
                  {amount != null ? (
                    <>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.onBrand, opacity: 0.5 }} />
                      <T v="button" display weight="700" c="onBrand">{`${money(amount)} BYN`}</T>
                    </>
                  ) : null}
                </>
              )}
            </Animated.View>
            <View style={[StyleSheet.absoluteFill, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }]} pointerEvents="none">
              <Animated.View style={checkStyle}><Icon name="checkmark" size={20} c="success" weight="heavy" /></Animated.View>
              <Animated.View style={sentLabel}><T v="button" c="success">Отклик отправлен</T></Animated.View>
            </View>
          </View>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: R, borderWidth: 2, borderColor: c.error }, outlineStyle]} />
        </Press>
      </Animated.View>
      {noteView}
    </View>
  );
}
