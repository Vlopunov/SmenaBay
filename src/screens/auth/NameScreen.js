// New worker: one step between the SMS code and the application going out.
// The employer sees the name in the application, so it is the only thing we
// ask for; city and skills can be added later in the profile.
import React, { useState } from 'react';
import { View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { NavBar, Button, Note } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { useAuthFlow, finishWorkerRegistration } from '../../services/authFlow';

function Field({ value, onChangeText, placeholder, autoFocus, textContentType, onSubmitEditing, returnKeyType, inputRef }) {
  const { c } = useTheme();
  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.labelTertiary}
      autoFocus={autoFocus}
      autoCapitalize="words"
      autoCorrect={false}
      textContentType={textContentType}
      onSubmitEditing={onSubmitEditing}
      returnKeyType={returnKeyType}
      style={{ height: 54, borderRadius: 27, backgroundColor: c.fill, paddingHorizontal: 20, fontSize: 19, fontWeight: '500', color: c.label }}
    />
  );
}

export default function NameScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const social = useAuthFlow((s) => s.social);
  const intent = useAuthFlow((s) => s.intent);
  const [first, setFirst] = useState(social?.displayName?.split(' ')[0] || '');
  const [last, setLast] = useState(social?.displayName?.split(' ').slice(1).join(' ') || '');
  const [error, setError] = useState('');
  const lastRef = React.useRef(null);
  const applying = intent?.type === 'apply';

  const submit = () => {
    if (!first.trim()) { setError('Без имени заказчик не поймёт, кто откликнулся'); haptic.error(); return; }
    finishWorkerRegistration({ firstName: first, lastName: last }, navigation);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar onBack={() => navigation.goBack()} variant="fill" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: 22, paddingTop: 30, gap: 10 }}>
          <T v="title" accessibilityRole="header">Как тебя зовут?</T>
          <T v="body" c="secondary" style={{ marginBottom: 14 }}>
            Имя и фамилию заказчик увидит в отклике. Остальное можно заполнить потом в профиле.
          </T>
          <Field value={first} onChangeText={(v) => { setFirst(v); setError(''); }} placeholder="Имя" autoFocus textContentType="givenName" returnKeyType="next" onSubmitEditing={() => lastRef.current?.focus()} />
          <Field inputRef={lastRef} value={last} onChangeText={setLast} placeholder="Фамилия" textContentType="familyName" returnKeyType="done" onSubmitEditing={submit} />
          {error ? <T v="smallStrong" c="destructive" style={{ marginLeft: 20 }}>{error}</T> : null}
        </View>
        <View style={{ marginTop: 'auto', paddingHorizontal: 22, paddingBottom: insets.bottom + 12 }}>
          <Button title={applying ? 'Отправить отклик' : 'Готово'} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
