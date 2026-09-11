// Apple and Google, one component for the sign-in screen and the «Нужен
// номер» sheet. Apple sits above Google at the same size and weight
// (Guideline 4.8) in Apple's own black / white style.
import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import T from '../design/Text';
import Icon from '../design/Icon';
import { Press } from '../design/ui';
import { useTheme } from '../design/theme';
import { haptic } from '../design/haptics';
import { signInWithApple, signInWithGoogle } from '../services/auth';
import { useAuthFlow } from '../services/authFlow';
import useStore from '../store/useStore';

function Social({ apple, title, onPress }) {
  const { c, dark } = useTheme();
  const bg = apple ? (dark ? '#FFFFFF' : '#000000') : c.surface;
  const fg = apple ? (dark ? '#000000' : '#FFFFFF') : c.ink;
  return (
    <Press onPress={onPress} accessibilityLabel={title} style={[{ height: 50, borderRadius: 15, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, !apple && { borderWidth: 1, borderColor: c.line }]}>
      {apple ? <Icon name="apple.logo" size={18} c={fg} /> : <Ionicons name="logo-google" size={17} color={fg} />}
      <T v="bodyStrong" c={fg} style={{ fontSize: 16 }}>{title}</T>
    </Press>
  );
}

/**
 * onSignedIn — an existing account signed in; onError(message).
 * A new person is sent to the name step with the intent kept.
 */
export default function SocialButtons({ navigation, intent, onSignedIn, onError, onLeave }) {
  const start = useAuthFlow((s) => s.start);
  const setSocial = useAuthFlow((s) => s.setSocial);
  const loginBySocial = useStore((s) => s.loginBySocial);

  const go = async (provider) => {
    try {
      const result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
      if (result.cancelled) return;
      const user = loginBySocial({ uid: result.uid, email: result.email });
      if (user) { haptic.success(); onSignedIn?.(user); return; }
      setSocial({ provider, uid: result.uid, email: result.email, displayName: result.displayName });
      start('', null, intent || { type: 'signin' });
      onLeave?.();
      navigation.navigate('Name');
    } catch (e) {
      haptic.error();
      onError?.(e.message);
    }
  };

  return (
    <View style={{ gap: 9 }}>
      {Platform.OS === 'ios' ? <Social apple title="Войти с Apple" onPress={() => go('apple')} /> : null}
      <Social title="Войти с Google" onPress={() => go('google')} />
    </View>
  );
}

/** «или» divider between the phone and the providers. */
export function OrDivider({ style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
      <T v="caption" c="ink2" style={{ fontSize: 12.5 }}>или</T>
      <View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
    </View>
  );
}
