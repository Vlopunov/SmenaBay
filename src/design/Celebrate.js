// «Все места закрыты» — the one place in the app where a celebration is
// allowed (§9.1 · 5). The card springs up with a small overshoot
// (damping 12 · stiffness 180), one 800 ms sheen, a success haptic, and it
// leaves on its own after 2.8 s. Reduce Motion: a 200 ms fade, no travel.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay, useReducedMotion } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from './Text';
import Icon from './Icon';
import { useTheme } from './theme';
import { SkyView, Sheen } from './Sky';
import { motion } from './tokens';
import { haptic } from './haptics';

export default function Celebrate({ visible, sky = 'day', title = 'Все места закрыты', line, onDone }) {
  const t = useTheme();
  const s = t.sky(sky);
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const v = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    haptic.success();
    v.value = 0;
    v.value = reduced ? withTiming(1, { duration: 200 }) : withSpring(1, motion.celebrate);
    const id = setTimeout(() => {
      v.value = withTiming(0, { duration: 200 }, (d) => { if (d && onDone) scheduleOnRN(onDone); });
    }, 2800);
    return () => clearTimeout(id);
  }, [visible, reduced, v]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.4),
    transform: reduced ? [] : [{ translateY: (1 - v.value) * 16 }, { scale: 0.94 + v.value * 0.06 }],
  }));

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" accessibilityLiveRegion="polite" style={[{ position: 'absolute', left: 14, right: 14, bottom: insets.bottom + 62 }, style]}>
      <View style={[{ borderRadius: 22, overflow: 'hidden' }, t.sh.e3]}>
        <SkyView sky={s} style={{ paddingVertical: 16, paddingHorizontal: 18 }}>
          <Sheen duration={800} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.c.onSky, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="checkmark" size={22} c="success" weight="heavy" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="titleSection" c={s.ink} weight="800" display>{title}</T>
              {line ? <T v="caption" c={s.ink2} weight="500" style={{ marginTop: 3, fontSize: 13.5, lineHeight: 18 }}>{line}</T> : null}
            </View>
          </View>
        </SkyView>
      </View>
    </Animated.View>
  );
}
