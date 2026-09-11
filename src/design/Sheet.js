// Bottom sheet (spring.sheet): scrim rgba(20,14,8,.42), 26 pt top corners,
// a 38×5 grabber on the line colour, background = screen bg. Opens on the
// sheet spring (damping 26 · stiffness 300 · mass .8) with a light haptic
// at the detent; dragging tracks the finger 1:1 and hands its velocity to
// the spring on release. Reduce Motion: a 200 ms cross-fade, no travel.
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from './haptics';
import T from './Text';
import { Press } from './ui';
import { useTheme } from './theme';
import { motion } from './tokens';

const PANEL = Easing.bezier(...motion.panel.bezier);

export default function Sheet({ visible, onClose, children, title, right, onRight, dismissable = true }) {
  const theme = useTheme();
  const { c } = theme;
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);

  const y = useSharedValue(winH);
  const scrim = useSharedValue(0);

  const finishClose = useCallback(() => {
    setMounted(false);
  }, []);

  useEffect(() => {
    if (visible) {
      setMounted(true);
    } else if (mounted) {
      if (reduced) {
        // Reduce Motion: a 200 ms cross-fade, no travel.
        scrim.value = withTiming(0, { duration: 200 }, (d) => { if (d) scheduleOnRN(finishClose); });
      } else {
        scrim.value = withTiming(0, { duration: motion.panel.duration, easing: PANEL });
        y.value = withTiming(winH, { duration: motion.panel.duration, easing: PANEL }, (done) => {
          if (done) scheduleOnRN(finishClose);
        });
      }
    }
  }, [visible]);

  const onShow = () => {
    y.value = reduced ? 0 : winH;
    scrim.value = withTiming(1, { duration: reduced ? 200 : 300 });
    y.value = reduced ? 0 : withSpring(0, motion.sheet, (done) => { if (done) scheduleOnRN(haptic.light); });
  };

  const requestClose = () => { if (dismissable) onClose?.(); };

  const pan = Gesture.Pan()
    .enabled(dismissable)
    .activeOffsetY([-10, 10])
    .onUpdate((e) => {
      // Down follows the finger; up rubber-bands.
      y.value = e.translationY > 0 ? e.translationY : -Math.sqrt(-e.translationY) * 3;
    })
    .onEnd((e) => {
      const shouldClose = e.velocityY > 800 || y.value > 140;
      if (shouldClose) {
        scheduleOnRN(requestClose);
      } else {
        y.value = withSpring(0, { ...motion.sheet, velocity: e.velocityY });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: reduced ? scrim.value : 1 }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrim.value }));

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onShow={onShow} onRequestClose={requestClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, scrimStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Закрыть" />
        </Animated.View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }} pointerEvents="box-none">
          <GestureDetector gesture={pan}>
            <Animated.View
              accessibilityViewIsModal
              style={[{
                borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden',
                backgroundColor: c.bg,
                paddingBottom: Math.max(insets.bottom, 12) + 4,
                shadowColor: 'rgb(20,14,8)', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: -10 },
              }, sheetStyle]}
            >
              <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
                <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: c.lineStrong }} />
              </View>
              {title ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4, gap: 12 }}>
                  <T v="titleScreen" style={{ flex: 1, fontSize: 23, lineHeight: 28 }} accessibilityRole="header">{title}</T>
                  {right ? (
                    <Press onPress={onRight} hitSlop={10}><T v="bodyStrong" c="brand" style={{ fontSize: 16 }}>{right}</T></Press>
                  ) : null}
                </View>
              ) : null}
              {children}
            </Animated.View>
          </GestureDetector>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
