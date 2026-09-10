// Bottom sheet: scrim rgba(0,0,0,.42), 26 pt top corners, grabber.
// Opens on the «panel» curve (300 ms, .77/0/.175/1). Dragging tracks the
// finger 1:1; on release it either dismisses (velocity or distance) or
// springs home carrying the finger's velocity, so there is no seam.
import React, { useEffect, useState, useCallback } from 'react';
import { Modal, View, StyleSheet, KeyboardAvoidingView, Platform, Pressable, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing, useReducedMotion,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import T from './Text';
import { Press } from './ui';
import { useTheme } from './theme';
import { motion } from './tokens';

const PANEL = Easing.bezier(...motion.panel.bezier);

export default function Sheet({ visible, onClose, children, title, right, onRight, dismissable = true }) {
  const theme = useTheme();
  const { c, dark, glass } = theme;
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
    scrim.value = withTiming(1, { duration: motion.panel.duration, easing: PANEL });
    y.value = reduced ? 0 : withTiming(0, { duration: motion.panel.duration, easing: PANEL });
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
        y.value = withSpring(0, { duration: motion.springSheet.duration, dampingRatio: motion.springSheet.dampingRatio, velocity: e.velocityY });
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
                backgroundColor: glass ? 'transparent' : c.sheet,
                paddingBottom: Math.max(insets.bottom, 12) + 4,
                shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: -10 },
              }, sheetStyle]}
            >
              {glass && Platform.OS === 'ios' ? (
                <>
                  <BlurView intensity={80} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: c.sheet, opacity: 0.6 }]} />
                </>
              ) : null}
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
                <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: c.fillSecondary }} />
              </View>
              {title ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 4, gap: 12 }}>
                  <T v="sheetTitle" style={{ flex: 1 }} accessibilityRole="header">{title}</T>
                  {right ? (
                    <Press onPress={onRight} hitSlop={10}><T v="body" c="accent">{right}</T></Press>
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
