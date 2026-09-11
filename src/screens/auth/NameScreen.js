// «Имя» (screen 8). New worker: one step, two fields, between the SMS code
// and the application going out. The employer sees the name in the
// application, so it is the only thing we ask for; the plate removes the
// main fear of shift work — being asked for a passport.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, TextInput, ScrollView, KeyboardAvoidingView, Keyboard, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Button, CircleButton, Progress } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { useAuthFlow, finishWorkerRegistration } from '../../services/authFlow';

/** Labelled field: 54 pt, surface + 1 pt line; focus 2 pt brand, error 2 pt error. */
function Field({ label, error, inputRef, ...input }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const ring = !!error || focused;
  return (
    <View>
      <T v="caption" c="ink2" weight="600" style={{ marginBottom: 7 }}>{label}</T>
      <TextInput
        ref={inputRef}
        {...input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={c.inkDisabled}
        autoCapitalize="words"
        autoCorrect={false}
        accessibilityLabel={label}
        maxFontSizeMultiplier={1.6}
        style={{
          minHeight: 54, borderRadius: 16, backgroundColor: c.surface,
          borderWidth: ring ? 2 : 1, borderColor: error ? c.error : focused ? c.brand : c.line,
          // The text stays put when the border thickens.
          paddingHorizontal: ring ? 15 : 16, paddingVertical: 0,
          fontSize: 17, fontWeight: '500', color: c.ink,
        }}
      />
      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }} accessibilityLiveRegion="polite">
          <Icon name="exclamationmark.circle" size={13} c="error" />
          <T v="caption" c="error" style={{ flex: 1, fontSize: 12.5, lineHeight: 16 }}>{error}</T>
        </View>
      ) : null}
    </View>
  );
}

export default function NameScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 20 : 24;
  const social = useAuthFlow((s) => s.social);
  const intent = useAuthFlow((s) => s.intent);
  const phone = useAuthFlow((s) => s.phone);
  const [first, setFirst] = useState(social?.displayName?.split(' ')[0] || '');
  const [last, setLast] = useState(social?.displayName?.split(' ').slice(1).join(' ') || '');
  const [error, setError] = useState('');
  const lastRef = useRef(null);
  const applying = intent?.type === 'apply';
  // Steps behind the person: number and code, then this one. Apple / Google
  // skip the code, so there the name is the second of two.
  const [done, total] = phone ? [2, 3] : [1, 2];

  const [kb, setKb] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKb(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKb(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const submit = () => {
    if (!first.trim()) { setError('Без имени заказчик не поймёт, кто откликнулся'); haptic.error(); return; }
    finishWorkerRegistration({ firstName: first, lastName: last }, navigation);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: G, paddingBottom: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            <View
              style={{ flex: 1 }}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={done === 1 ? `Пройден 1 шаг из ${total}` : `Пройдено ${done} шага из ${total}`}
            >
              <Progress value={(done / total) * 100} track={c.surface2} height={5} />
            </View>
            <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }} importantForAccessibility="no" accessibilityElementsHidden>
              {done} из {total}
            </T>
          </View>

          <T v="titleScreen" style={{ marginTop: 24, lineHeight: 32 }} accessibilityRole="header">Как тебя зовут?</T>
          <T v="body" c="ink2" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            Заказчик увидит имя и фамилию, когда ты откликнешься на смену.
          </T>

          <View style={{ marginTop: 22, gap: 10 }}>
            <Field
              label="Имя"
              value={first}
              onChangeText={(v) => { setFirst(v); setError(''); }}
              placeholder="Алексей"
              autoFocus
              textContentType="givenName"
              autoComplete="name-given"
              returnKeyType="next"
              onSubmitEditing={() => lastRef.current?.focus()}
              error={error}
            />
            <Field
              inputRef={lastRef}
              label="Фамилия"
              value={last}
              onChangeText={setLast}
              placeholder="Ковалёв"
              textContentType="familyName"
              autoComplete="name-family"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          </View>

          <View style={{ marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.surface2 }}>
            <T v="caption" c="ink3" style={{ fontSize: 13, lineHeight: 19 }}>
              Только имя и фамилия. Паспорт, адрес и документы платформа не спрашивает.
            </T>
          </View>

        </ScrollView>
        {/* Pinned above the keyboard, so the next step is always in reach. */}
        <View style={{ paddingHorizontal: G, paddingTop: 8, paddingBottom: kb ? 10 : insets.bottom + 10 }}>
          <Button title={applying ? 'Отправить отклик' : 'Продолжить'} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
