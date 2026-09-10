// Sign-in. For a guest this is the «Войти» tab; it is also pushed from
// anywhere that needs an account. Phone first (no passwords), then Apple and
// Google at equal size — Sign in with Apple is never less prominent than
// Google (Guideline 4.8).
import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import PhoneField, { toE164, isComplete } from '../../design/PhoneField';
import { Button, Press, NavBar, Separator, Note } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { LINKS, openLink } from '../../constants/links';
import { sendVerificationCode, signInWithApple, signInWithGoogle } from '../../services/auth';
import { useAuthFlow } from '../../services/authFlow';
import useStore from '../../store/useStore';

function SocialButton({ icon, title, onPress, apple }) {
  const { c, dark } = useTheme();
  // Apple's own button style: black on light, white on dark.
  const bg = apple ? (dark ? '#FFFFFF' : '#000000') : c.fill;
  const fg = apple ? (dark ? '#000000' : '#FFFFFF') : c.label;
  return (
    <Press onPress={onPress} accessibilityLabel={title} style={{ height: 52, borderRadius: 26, backgroundColor: bg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      {apple ? <Icon name="apple.logo" size={18} c={fg} /> : <Ionicons name="logo-google" size={17} color={fg} />}
      <T v="button" c={fg}>{title}</T>
    </Press>
  );
}

export default function SignInScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const tabSpace = useTabBarSpace();
  const inTab = !route?.params?.pushed;
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const start = useAuthFlow((s) => s.start);
  const setSocial = useAuthFlow((s) => s.setSocial);
  const loginBySocial = useStore((s) => s.loginBySocial);
  const login = useStore((s) => s.login);

  const submit = async () => {
    if (!isComplete(digits)) { setError('Нужно 9 цифр после +375'); haptic.error(); return; }
    setError('');
    setLoading(true);
    try {
      const phone = toE164(digits);
      const verification = await sendVerificationCode(phone);
      start(phone, verification, route?.params?.intent || { type: 'signin' });
      navigation.navigate('Code');
    } catch (e) {
      setError(e.message);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  const social = async (provider) => {
    setError('');
    try {
      const result = provider === 'apple' ? await signInWithApple() : await signInWithGoogle();
      if (result.cancelled) return;
      const user = loginBySocial({ uid: result.uid, email: result.email });
      if (user) {
        haptic.success();
        if (!inTab) navigation.goBack();
        return;
      }
      setSocial({ provider, uid: result.uid, email: result.email, displayName: result.displayName });
      start('', null, route?.params?.intent || { type: 'signin' });
      navigation.navigate('Name');
    } catch (e) {
      setError(e.message);
      haptic.error();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      {inTab ? <View style={{ height: insets.top + 12 }} /> : <NavBar onBack={() => navigation.goBack()} variant="fill" />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: inTab ? tabSpace : insets.bottom + 24 }} onScrollBeginDrag={Keyboard.dismiss}>
          <View style={{ paddingHorizontal: 22, paddingTop: inTab ? 16 : 22 }}>
            <T v="screenTitle" accessibilityRole="header">Вход</T>
            <T v="body" c="secondary" style={{ marginTop: 6 }}>
              Номер телефона — и всё, без паролей. Смены можно смотреть и без входа: он понадобится, когда откликнешься.
            </T>

            <View style={{ marginTop: 26 }}>
              <PhoneField value={digits} onChange={(v) => { setDigits(v); if (error) setError(''); }} onSubmit={submit} error={!!error} />
            </View>
            {error ? <T v="smallStrong" c="destructive" style={{ marginTop: 8, marginLeft: 20 }}>{error}</T> : null}
            <Button title="Получить код" onPress={submit} loading={loading} style={{ marginTop: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 }}>
              <Separator style={{ flex: 1 }} />
              <T v="caption" c="secondary">или</T>
              <Separator style={{ flex: 1 }} />
            </View>

            <View style={{ gap: 10 }}>
              {Platform.OS === 'ios' ? <SocialButton apple title="Войти с Apple" onPress={() => social('apple')} /> : null}
              <SocialButton title="Войти через Google" onPress={() => social('google')} />
            </View>
          </View>

          <Separator style={{ marginTop: 28 }} />
          <Press onPress={() => navigation.navigate('RegisterEmployer')} feedback="highlight" style={{ paddingHorizontal: 22, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="building.2" size={18} c="secondary" />
            <View style={{ flex: 1 }}>
              <T v="value" style={{ fontSize: 16, lineHeight: 21 }}>Ищу сотрудников</T>
              <T v="caption" c="secondary">Аккаунт заказчика: публикуй смены и подтверждай отклики</T>
            </View>
            <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" />
          </Press>
          <Separator />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 22, marginTop: 18, gap: 4 }}>
            <T v="small" c="secondary">Продолжая, ты соглашаешься с</T>
            <Press feedback="none" onPress={() => openLink(LINKS.terms)} accessibilityRole="link"><T v="small" c="accent">условиями</T></Press>
            <T v="small" c="secondary">и</T>
            <Press feedback="none" onPress={() => openLink(LINKS.privacy)} accessibilityRole="link"><T v="small" c="accent">политикой конфиденциальности</T></Press>
          </View>

          {__DEV__ ? (
            <View style={{ marginTop: 28 }}>
              <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingBottom: 8 }}>Демо-аккаунты · только dev-сборка</T>
              <Separator />
              {[
                ['Алексей Ковалёв · исполнитель', '+375291234567'],
                ['Дарья Новикова · исполнитель', '+375337654321'],
                ['Ozon ПВЗ Минск · заказчик', '+375291001010'],
                ['Кафе «Васильки» · заказчик', '+375293003030'],
              ].map(([label, phone]) => (
                <View key={phone}>
                  <Press feedback="highlight" onPress={() => { login(phone); if (!inTab) navigation.goBack(); }} style={{ paddingHorizontal: 22, paddingVertical: 13 }}>
                    <T v="value">{label}</T>
                    <T v="caption" c="secondary">{phone}</T>
                  </Press>
                  <Separator inset />
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
