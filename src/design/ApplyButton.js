// The apply button — the product's key interaction (handoff «Отклик на смену»).
// CTA and the «Ждёт ответа» pill are one shape (a capsule) at two sizes, so
// the morph is a squeeze, not a swap. Success haptic lands on the first
// frame of the morph; error haptic lands with the first shake.
import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing, interpolateColor, useReducedMotion,
} from 'react-native-reanimated';
import T from './Text';
import Icon from './Icon';
import { Press } from './ui';
import { useTheme } from './theme';
import { motion } from './tokens';
import { haptic } from './haptics';
import { money } from './format';

const MORPH = Easing.bezier(...motion.morph.bezier);
const APPEAR = Easing.bezier(...motion.appear.bezier);
const REJECT = Easing.bezier(...motion.reject.bezier);

/**
 * state: 'idle' | 'sending' | 'sent' | 'error' | 'full'
 */
export default function ApplyButton({ state = 'idle', amount, onPress, label = 'Откликнуться', errorText = 'Места только что закончились', sentLabel = 'Ждёт ответа' }) {
  const { c, dark } = useTheme();
  const reduced = useReducedMotion();
  const [boxW, setBoxW] = useState(0);
  const [pillW, setPillW] = useState(150);
  const sent = state === 'sent';

  const m = useSharedValue(sent ? 1 : 0);      // 0 = CTA, 1 = pill
  const shake = useSharedValue(0);
  const err = useSharedValue(0);
  const prev = useRef(state);

  useEffect(() => {
    const was = prev.current;
    prev.current = state;
    if (state === 'sent' && was !== 'sent') {
      haptic.success();
      m.value = withTiming(1, { duration: reduced ? motion.appear.duration : motion.morph.duration, easing: MORPH });
    } else if (state !== 'sent') {
      m.value = withTiming(0, { duration: motion.morph.duration, easing: MORPH });
    }
    if (state === 'error' && was !== 'error') {
      haptic.error();
      err.value = withTiming(1, { duration: motion.appear.duration, easing: APPEAR });
      if (!reduced) {
        const q = motion.reject.duration / 8;
        shake.value = withSequence(
          withTiming(-7, { duration: q, easing: REJECT }),
          withTiming(7, { duration: q * 2, easing: REJECT }),
          withTiming(-7, { duration: q * 2, easing: REJECT }),
          withTiming(7, { duration: q * 2, easing: REJECT }),
          withTiming(0, { duration: q, easing: REJECT }),
        );
      }
    } else if (state !== 'error') {
      err.value = withTiming(0, { duration: motion.appear.duration });
    }
  }, [state]);

  const H_CTA = 52, H_PILL = 40;

  const capsule = useAnimatedStyle(() => {
    const full = boxW || 300;
    const w = reduced ? (m.value > 0.5 ? pillW : full) : full + (pillW - full) * m.value;
    const h = reduced ? (m.value > 0.5 ? H_PILL : H_CTA) : H_CTA + (H_PILL - H_CTA) * m.value;
    return {
      width: w,
      height: h,
      borderRadius: h / 2,
      left: (full - w) / 2,
      top: (H_CTA - h) / 2,
      backgroundColor: interpolateColor(m.value, [0, 1], [c.accent, c.fill]),
      shadowOpacity: dark ? 0 : 0.26 * (1 - m.value),
      borderWidth: reduced && state === 'error' ? 2 : 0,
    };
  });
  const ctaLabel = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, m.value * 2) }));
  const pillLabel = useAnimatedStyle(() => ({ opacity: Math.max(0, m.value * 2 - 1) }));
  const shaker = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const errStyle = useAnimatedStyle(() => ({ opacity: err.value, transform: [{ translateY: (1 - err.value) * 4 }] }));

  if (state === 'full') {
    return (
      <View style={{ height: H_CTA, borderRadius: 26, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="text">
        <T v="button" c="tertiary">Мест нет</T>
      </View>
    );
  }

  const disabled = state === 'sending' || sent;

  return (
    <View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: -24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }, errStyle]} pointerEvents="none" accessibilityLiveRegion="assertive">
        {state === 'error' ? (
          <>
            <Icon name="exclamationmark.circle" size={13} c="destructive" />
            <T v="smallStrong" c="destructive">{errorText}</T>
          </>
        ) : null}
      </Animated.View>

      <Animated.View style={shaker}>
        <Press
          onPress={onPress}
          disabled={disabled}
          feedback={sent ? 'none' : 'scale'}
          accessibilityLabel={sent ? sentLabel : `${label}, ${amount} BYN`}
          accessibilityState={{ disabled, busy: state === 'sending' }}
        >
          <View style={{ height: H_CTA }} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
            <Animated.View style={[{ position: 'absolute', shadowColor: c.accentShadow, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, borderColor: c.destructive }, capsule]} />

            <Animated.View style={[StyleSheet.absoluteFill, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, ctaLabel]}>
              {state === 'sending' ? (
                <>
                  <ActivityIndicator size="small" color={c.onAccent} />
                  <T v="button" c="onAccent">Отправляем</T>
                </>
              ) : (
                <>
                  <T v="button" c="onAccent">{label}</T>
                  {amount != null ? (
                    <>
                      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.onAccent, opacity: 0.55 }} />
                      <T v="button" c="onAccent">{money(amount)} BYN</T>
                    </>
                  ) : null}
                </>
              )}
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, pillLabel]} pointerEvents="none">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 }} onLayout={(e) => setPillW(Math.ceil(e.nativeEvent.layout.width) + 2)}>
                <Icon name="clock" size={15} c="label" weight="semibold" />
                <T v="bodyStrong">{sentLabel}</T>
              </View>
            </Animated.View>
          </View>
        </Press>
      </Animated.View>
    </View>
  );
}
