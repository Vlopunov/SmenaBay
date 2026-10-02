// «Вход» (screen 6). For a guest this is the «Войти» tab; it is also pushed
// from anywhere that needs an account. A morning sky with the emblem, then
// Apple and Google at equal size — Sign in with Apple is never less
// prominent than Google (Guideline 4.8) — and the phone below them: the free
// Firebase plan sends 10 SMS a day for everyone, so the providers are the way
// in and the code is the fallback. «Ищу сотрудников» is a separate entry for
// employers, not a twin button.
import React, { useState } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView, Platform, Keyboard, StyleSheet, Alert, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import PhoneField, { toE164, isComplete } from '../../design/PhoneField';
import { Button, Press, CircleButton, Group, Row } from '../../design/ui';
import { SkyView } from '../../design/Sky';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { LINKS, openLink } from '../../constants/links';
import { sendVerificationCode } from '../../services/auth';
import { useAuthFlow } from '../../services/authFlow';
import SocialButtons, { OrDivider } from '../../components/SocialButtons';
import useStore from '../../store/useStore';

const DEMO = [
  ['Алексей Ковалёв · исполнитель', '+375291234567'],
  ['Дарья Новикова · исполнитель', '+375337654321'],
  ['Ozon ПВЗ Минск · заказчик', '+375291001010'],
  ['Кафе «Васильки» · заказчик', '+375293003030'],
];

/** Message under a field: a sign and text, never a red frame alone. */
function ErrorLine({ text, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }, style]} accessibilityLiveRegion="polite">
      <Icon name="exclamationmark.circle" size={13} c="error" />
      <T v="caption" c="error" style={{ flex: 1, fontSize: 12.5, lineHeight: 16 }}>{text}</T>
    </View>
  );
}

/** The sun on the horizon: a disc in the page colour over a brand line.
 *  In dark the page colour would read as an eclipse, so the disc takes the
 *  morning sky's light ink. */
function Emblem({ height, inset }) {
  const { c, dark, sky } = useTheme();
  const sun = dark ? sky('morning').ink : c.bg;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
      <View style={{ position: 'absolute', top: height - 92, left: '50%', marginLeft: -28, width: 56, height: 56, borderRadius: 28, backgroundColor: sun }} />
      <View style={{ position: 'absolute', top: height - 42, left: inset, right: inset, height: 5, borderRadius: 3, backgroundColor: c.brand }} />
    </View>
  );
}

export default function SignInScreen({ navigation, route }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 20 : 24;
  const inTab = !route?.params?.pushed;
  const sky = t.sky('morning');
  // Mockup: a 170 pt sky of which the first 50 are the status bar.
  const skyH = insets.top + 124;

  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socialError, setSocialError] = useState('');
  // The demo row that is waiting for the SMS round-trip (dev builds only).
  const [demoBusy, setDemoBusy] = useState(null);
  const start = useAuthFlow((s) => s.start);
  const login = useStore((s) => s.login);

  // The demo login goes through the real Firebase flow now, so it takes a
  // second and can fail like any other sign-in.
  const demoLogin = async (phone) => {
    if (demoBusy) return;
    setDemoBusy(phone);
    try {
      const profile = await login(phone);
      if (!profile) {
        Alert.alert('Не удалось войти', 'Проверь, что номер добавлен в Firebase Console → Authentication → Phone, а код совпадает с EXPO_PUBLIC_DEV_SMS_CODE.');
        return;
      }
      if (!inTab) navigation.goBack();
    } catch (e) {
      Alert.alert('Не удалось войти', e?.message || 'Попробуй ещё раз.');
    } finally {
      setDemoBusy(null);
    }
  };

  const submit = async () => {
    if (!isComplete(digits)) { setError('Нужно 9 цифр после +375'); haptic.error(); return; }
    setError('');
    setSocialError('');
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

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ paddingBottom: inTab ? tabSpace : insets.bottom + 24 }}
        >
          <SkyView sky={sky} style={{ height: skyH }}>
            <Emblem height={skyH} inset={G + 2} />
            {!inTab ? (
              <View style={{ position: 'absolute', top: insets.top + 4, left: G }}>
                <CircleButton icon="chevron.left" variant="sky" color={sky.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
              </View>
            ) : null}
          </SkyView>

          <View style={{ paddingHorizontal: G, paddingTop: 26 }}>
            <T v="titleScreen" style={{ lineHeight: 32 }} accessibilityRole="header">
              {'Смены в твоём городе,\nоплата после смены'}
            </T>
            <T v="body" c="ink2" style={{ marginTop: 9, fontSize: 15, lineHeight: 22 }}>
              Войди, чтобы откликаться и видеть свои смены. Смотреть ленту можно и без входа.
            </T>

            <View style={{ marginTop: 22 }}>
              <SocialButtons
                navigation={navigation}
                intent={route?.params?.intent}
                onSignedIn={() => { if (!inTab) navigation.goBack(); }}
                onError={setSocialError}
              />
              {socialError ? <ErrorLine text={socialError} /> : null}
            </View>

            <OrDivider style={{ marginTop: 16 }} />
            <T v="caption" c="ink2" weight="600" style={{ marginTop: 14, marginBottom: 8 }}>Номер телефона</T>
            <PhoneField value={digits} onChange={(v) => { setDigits(v); if (error) setError(''); }} onSubmit={submit} error={!!error} />
            {error ? <ErrorLine text={error} /> : null}
            <Button title="Получить код" loadingTitle="Отправляем код…" onPress={submit} loading={loading} variant="secondary" style={{ marginTop: 10 }} />

            <Press
              onPress={() => navigation.navigate('RegisterEmployer')}
              accessibilityLabel="Ищу сотрудников"
              accessibilityHint="Регистрация компании-заказчика"
              style={{ marginTop: 18, minHeight: 50, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 15, backgroundColor: c.surface2, flexDirection: 'row', alignItems: 'center', gap: 11 }}
            >
              <Icon name="person.badge.plus" size={22} c="brand" />
              <T v="bodyStrong" c="ink3" style={{ flex: 1, fontSize: 14.5, lineHeight: 19.5 }}>Ищу сотрудников</T>
              <Icon name="chevron.right" size={14} c="ink2" weight="semibold" style={{ opacity: 0.7 }} />
            </Press>

            <T v="caption" c="ink2" style={{ marginTop: 16, fontSize: 12.5, lineHeight: 19, textAlign: 'center' }}>
              Продолжая, ты принимаешь{' '}
              <T v="caption" c="brand" style={{ fontSize: 12.5, lineHeight: 19 }} onPress={() => openLink(LINKS.terms)} accessibilityRole="link">условия использования</T>
              {' '}и{' '}
              <T v="caption" c="brand" style={{ fontSize: 12.5, lineHeight: 19 }} onPress={() => openLink(LINKS.privacy)} accessibilityRole="link">политику конфиденциальности</T>.
            </T>

            {__DEV__ ? (
              <View style={{ marginTop: 28 }}>
                <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5, marginBottom: 8, marginLeft: 4 }}>Демо-аккаунты · только dev-сборка</T>
                <Group>
                  {DEMO.map(([label, phone], i) => (
                    <Row
                      key={phone}
                      title={label}
                      sub={phone}
                      last={i === DEMO.length - 1}
                      right={demoBusy === phone ? <ActivityIndicator size="small" color={c.ink2} /> : undefined}
                      onPress={() => demoLogin(phone)}
                    />
                  ))}
                </Group>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
