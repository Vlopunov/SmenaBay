// Slider: 5 pt track on surface.3, brand fill, 28 pt surface thumb with a
// line border. Tracks the finger 1:1 on the UI thread; a selection haptic
// ticks once per step so the value can be set without looking.
// fill="from" paints thumb → max (a one-handle «от 60 BYN» filter);
// `marker` puts the market reference on the track.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from './theme';
import { haptic } from './haptics';


export default function Slider({ min, max, step = 1, value, onChange, accessibilityLabel, formatValue = (v) => String(v), thumb: THUMB = 28, fill: fillMode = 'to', marker, track }) {
  const t = useTheme();
  const { c } = t;
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const lastStep = useSharedValue(value);

  const toX = (v, width) => ((v - min) / (max - min)) * Math.max(0, width - THUMB);

  useEffect(() => { if (w) x.value = toX(value, w); }, [value, w]);

  const emit = (v) => { haptic.selection(); onChange?.(v); };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      const span = Math.max(1, w - THUMB);
      const nx = Math.min(span, Math.max(0, e.x - THUMB / 2));
      start.value = nx;
      x.value = nx;
    })
    .onUpdate((e) => {
      const span = Math.max(1, w - THUMB);
      x.value = Math.min(span, Math.max(0, start.value + e.translationX));
    });

  useAnimatedReaction(
    () => {
      const span = Math.max(1, w - THUMB);
      const raw = min + (x.value / span) * (max - min);
      return Math.round(raw / step) * step;
    },
    (v) => {
      if (v !== lastStep.value) {
        lastStep.value = v;
        scheduleOnRN(emit, v);
      }
    },
    [w, min, max, step],
  );

  const fill = useAnimatedStyle(() => (fillMode === 'from'
    ? { left: x.value + THUMB / 2, right: 0 }
    : { left: 0, width: x.value + THUMB / 2 }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <View
        style={{ height: 36, justifyContent: 'center' }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ text: formatValue(value) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          const next = e.nativeEvent.actionName === 'increment' ? Math.min(max, value + step) : Math.max(min, value - step);
          onChange?.(next);
        }}
      >
        <View style={{ height: 5, borderRadius: 3, backgroundColor: track || c.surface3 }} />
        <Animated.View style={[{ position: 'absolute', height: 5, borderRadius: 3, backgroundColor: c.brand }, fill]} />
        {marker && w ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: toX(marker.value, w) + THUMB / 2 - 1, top: 6, width: 2, height: 24, borderRadius: 1, backgroundColor: c.ink2, opacity: 0.55 }} />
        ) : null}
        <Animated.View style={[{
          position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: c.surface,
          borderWidth: 1, borderColor: c.line,
          shadowColor: 'rgb(40,30,18)', shadowOpacity: t.dark ? 0.5 : 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3,
        }, thumb]} />
      </View>
    </GestureDetector>
  );
}
