// Tab bar: navigation only, never an action. On iOS 26 it floats as a glass
// capsule (54 pt, radius 27, 12 pt from the edges); below iOS 26 it is pinned
// to the bottom with a top hairline and the opaque fallback material.
import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import T from './Text';
import Icon from './Icon';
import { Press } from './ui';
import { useTheme, SUPPORTS_GLASS } from './theme';
import { motion } from './tokens';

const BAR_H = 54;

/** Bottom padding a scrolling screen needs so its last row clears the bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return SUPPORTS_GLASS ? BAR_H + Math.max(insets.bottom, 12) + 24 : BAR_H + insets.bottom + 16;
}

function TabBadge({ count }) {
  const { c } = useTheme();
  const s = useSharedValue(count ? 1 : 0);
  useEffect(() => {
    s.value = withTiming(count ? 1 : 0, { duration: motion.appear.duration, easing: Easing.bezier(...motion.appear.bezier) });
  }, [!!count]);
  const style = useAnimatedStyle(() => ({ opacity: s.value, transform: [{ scale: 0.9 + 0.1 * s.value }] }));
  if (!count) return null;
  return (
    <Animated.View style={[{
      position: 'absolute', top: -3, left: '56%', minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
      backgroundColor: c.destructive, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: SUPPORTS_GLASS ? 'transparent' : c.glassFallback,
    }, style]}>
      <T v="label" c="#FFFFFF" style={{ fontSize: 10.5, lineHeight: 13, fontWeight: '700' }}>{count > 99 ? '99+' : count}</T>
    </Animated.View>
  );
}

/**
 * tabs: { [routeName]: { label, icon, iconActive, muted?, badge? } }
 */
export default function TabBar({ state, navigation, tabs }) {
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();

  const items = state.routes.map((route, index) => {
    const def = tabs[route.name] || { label: route.name, icon: 'circle' };
    const focused = state.index === index;
    const color = focused ? 'accent' : def.muted ? 'tertiary' : 'secondary';
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
    };
    return (
      <Press
        key={route.key}
        onPress={onPress}
        feedback="none"
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={def.badge ? `${def.label}, ${def.badge} новых` : def.label}
        outerStyle={{ flex: 1 }}
        style={{ alignItems: 'center', justifyContent: 'center', height: BAR_H, gap: 2 }}
      >
        <Icon name={focused && def.iconActive ? def.iconActive : def.icon} size={24} c={color} weight={focused ? 'semibold' : 'regular'} />
        <T v="tab" c={color} style={{ fontWeight: focused ? '600' : '500' }}>{def.label}</T>
        <TabBadge count={def.badge} />
      </Press>
    );
  });

  if (SUPPORTS_GLASS && Platform.OS === 'ios') {
    return (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 12, right: 12, bottom: Math.max(insets.bottom - 8, 12) }}>
        <View style={{ borderRadius: 27, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
          <View style={{ height: BAR_H, borderRadius: 27, overflow: 'hidden', borderWidth: 1, borderColor: c.glassBorder, flexDirection: 'row' }}>
            <BlurView intensity={60} tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass, opacity: 0.55 }]} />
            {items}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      backgroundColor: c.glassFallback,
      borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.glassFallbackBorder,
      paddingBottom: insets.bottom, flexDirection: 'row',
    }}>
      {items}
    </View>
  );
}
