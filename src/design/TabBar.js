// Tab bar: navigation only, never an action. Docked, on the material
// (alpha .86 + blur 20) with a line on top. Switching tabs is a change of
// room, not a journey: screens cross-fade 200 ms, the active icon hops to
// 1.08 and settles. A number badge — responses and confirmations; a dot —
// unread messages. The guest's «Мои смены» and «Чат» are muted but tappable.
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withSequence, withTiming, useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from './Text';
import Icon from './Icon';
import { Press, Material } from './ui';
import { useTheme } from './theme';
import { motion } from './tokens';
import { haptic } from './haptics';

const BAR_H = 49;

/** Bottom padding a scrolling screen needs so its last row clears the bar. */
export function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return BAR_H + insets.bottom + 18;
}

// Number appears 120 ms after the morph that caused it: spring 0 → 1.
function TabBadge({ count, dot }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const s = useSharedValue(count || dot ? 1 : 0);
  const prev = useRef(count);
  useEffect(() => {
    const grew = (count || 0) > (prev.current || 0);
    prev.current = count;
    if (!count && !dot) { s.value = 0; return; }
    if (grew && !reduced) {
      s.value = 0;
      s.value = withDelay(120, withSpring(1, motion.badge));
    } else {
      s.value = withTiming(1, { duration: 200 });
    }
  }, [count, dot, reduced, s]);
  const style = useAnimatedStyle(() => (reduced ? { opacity: s.value } : { opacity: Math.min(1, s.value * 1.5), transform: [{ scale: s.value }] }));
  if (!count && !dot) return null;
  if (dot) {
    return <Animated.View style={[{ position: 'absolute', top: 1, left: '60%', width: 9, height: 9, borderRadius: 5, backgroundColor: c.error }, style]} />;
  }
  return (
    <Animated.View style={[{
      position: 'absolute', top: -2, left: '54%', minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4,
      backgroundColor: c.error, alignItems: 'center', justifyContent: 'center',
    }, style]}>
      <T v="badge" c="#FFFFFF" style={{ fontSize: 10.5, lineHeight: 13 }}>{count > 99 ? '99+' : count}</T>
    </Animated.View>
  );
}

function TabItem({ def, focused, onPress }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  useEffect(() => {
    if (focused && !reduced) s.value = withSequence(withSpring(1.08, { damping: 14, stiffness: 400 }), withSpring(1, { damping: 14, stiffness: 300 }));
  }, [focused, reduced, s]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const color = focused ? c.brand : def.muted ? c.inkDisabled : c.ink2;
  return (
    <Press
      onPress={onPress}
      feedback="none"
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={def.badge ? `${def.label}, ${def.badge} новых` : def.label}
      outerStyle={{ flex: 1 }}
      style={{ alignItems: 'center', height: BAR_H, paddingTop: 9, gap: 3 }}
    >
      <View>
        <Animated.View style={iconStyle}>
          <Icon name={focused && def.iconActive ? def.iconActive : def.icon} size={24} c={color} weight={focused ? 'semibold' : 'regular'} />
        </Animated.View>
      </View>
      <T v="badge" c={color} style={{ fontSize: 10.5, lineHeight: 12, letterSpacing: 0, fontWeight: focused ? '600' : '500' }}>{def.label}</T>
      <TabBadge count={def.badge} dot={def.dot} />
    </Press>
  );
}

/** tabs: { [routeName]: { label, icon, iconActive, muted?, badge?, dot? } } */
export default function TabBar({ state, navigation, tabs }) {
  const insets = useSafeAreaInsets();
  return (
    <Material style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: insets.bottom, flexDirection: 'row' }}>
      {state.routes.map((route, index) => {
        const def = tabs[route.name] || { label: route.name, icon: 'circle' };
        const focused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) { haptic.selection(); navigation.navigate(route.name); }
        };
        return <TabItem key={route.key} def={def} focused={focused} onPress={onPress} />;
      })}
    </Material>
  );
}
