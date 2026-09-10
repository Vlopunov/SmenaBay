// Rolling number for counters that change in front of the user
// (applications 4 → 5 on the employer dashboard). 520 ms on the «counter»
// curve; with Reduce Motion the new value simply replaces the old one.
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import T from './Text';
import { useTheme } from './theme';
import { motion } from './tokens';

const EASE = Easing.bezier(...motion.counter.bezier);
const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Digit({ d, v, c, lineHeight }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(-d * lineHeight);
  useEffect(() => {
    y.value = reduced ? -d * lineHeight : withTiming(-d * lineHeight, { duration: motion.counter.duration, easing: EASE });
  }, [d, lineHeight]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ height: lineHeight, overflow: 'hidden' }}>
      <Animated.View style={style}>
        {DIGITS.map((n) => <T key={n} v={v} c={c} style={{ height: lineHeight }}>{n}</T>)}
      </Animated.View>
    </View>
  );
}

export default function Odometer({ value, v = 'title', c = 'label', suffix, style }) {
  const theme = useTheme();
  const lineHeight = theme.type[v].lineHeight;
  const chars = String(value).split('');
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'flex-end' }, style]} accessible accessibilityLabel={`${value}${suffix || ''}`}>
      {chars.map((ch, i) => {
        const key = chars.length - i; // stable from the right, so 9 → 10 keeps the units column
        return /\d/.test(ch)
          ? <Digit key={key} d={Number(ch)} v={v} c={c} lineHeight={lineHeight} />
          : <T key={key} v={v} c={c}>{ch}</T>;
      })}
      {suffix ? <T v={v} c={c}>{suffix}</T> : null}
    </View>
  );
}
