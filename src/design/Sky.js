// The sky of a shift: its colour is the time of day the shift starts.
// One sky per object. Gradients are drawn with react-native-svg (100°, as
// in the handoff) so no native module is needed.
import React, { useEffect, useId } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { useTheme } from './theme';
import { shiftStart, shiftEnd } from './format';

/** morning 06–11 · day 11–17 · evening 17–22 · night 22–06; closed = no seats or already over. */
export function skyByHour(hour) {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'day';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

export function skyKey(shift, { now = new Date(), ignoreClosed = false } = {}) {
  if (!shift) return 'day';
  if (!ignoreClosed) {
    const full = shift.status === 'filled' || (shift.spotsTotal && shift.spotsTaken >= shift.spotsTotal);
    const over = shift.status === 'cancelled' || shiftEnd(shift) < now;
    if (full || over) return 'closed';
  }
  return skyByHour(shiftStart(shift).getHours());
}

/** A view painted with a sky. `sky` is a key or a resolved sky object. */
export function SkyView({ sky = 'day', style, children, radius, pointerEvents }) {
  const t = useTheme();
  const s = typeof sky === 'string' ? t.sky(sky) : sky;
  const id = useId().replace(/:/g, '');
  const flat = t.c.bg === '#FFFFFF'; // high-contrast palette uses a flat tint
  return (
    <View pointerEvents={pointerEvents} style={[{ overflow: 'hidden', borderRadius: radius }, style]}>
      {/* A padding-free layer: percentage sizes resolve against the content
          box in Yoga, so the Svg must not sit directly inside a padded view. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id={`sky${id}`} x1="0" y1="0.42" x2="1" y2="0.58">
              <Stop offset="0" stopColor={s.colors[0]} />
              <Stop offset="1" stopColor={flat ? s.colors[0] : s.colors[1]} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#sky${id})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

/** One pass of light across a sky: 800 ms, once (pass confirmed, all seats closed). */
export function Sheen({ delay = 0, duration = 800, play = true }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  useEffect(() => {
    if (!play || reduced) return;
    x.value = 0;
    x.value = withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
  }, [play, delay, duration, reduced, x]);
  // Handoff: a 60 %-wide band from translateX(−130 %) to (240 %), once.
  const style = useAnimatedStyle(() => ({
    opacity: x.value <= 0 || x.value >= 1 ? 0 : 1,
    transform: [{ translateX: `${-130 + x.value * 370}%` }],
  }));
  if (reduced) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, left: '-30%', width: '60%' }, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.45" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#sheen)" />
      </Svg>
    </Animated.View>
  );
}
