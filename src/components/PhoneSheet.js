// «Нужен номер» (screen 5): asked at the moment of applying, not at launch.
// A guest signs in here — Apple and Google first, the SMS code below them:
// the free Firebase plan sends 10 SMS a day for everyone. Someone already
// signed in only leaves a contact number: no SMS, and the apply or publish
// that opened the sheet carries on.
import React, { useState } from 'react';
import { View } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import Icon from '../design/Icon';
import PhoneField, { toE164, isComplete } from '../design/PhoneField';
import { Button, Press } from '../design/ui';
import { haptic } from '../design/haptics';
import { LINKS, openLink } from '../constants/links';
import { sendVerificationCode } from '../services/auth';
import { useAuthFlow, runIntent } from '../services/authFlow';
import useStore from '../store/useStore';
import SocialButtons, { OrDivider } from './SocialButtons';

export default function PhoneSheet({ visible, onClose, navigation, intent, title = 'Нужен номер', text, social = true, onSaved }) {
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const start = useAuthFlow((s) => s.start);
  const signedIn = useStore((s) => !!s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);

  // Signed in: the number is a contact, saved as typed. Confirming it by SMS
  // would sign the phone in as a second Firebase account.
  const save = async () => {
    if (!isComplete(digits)) { setError('Номер неполный — нужно 9 цифр после +375'); haptic.error(); return; }
    setError('');
    updateProfile({ phone: toE164(digits) });
    haptic.success();
    onClose();
    if (onSaved) onSaved();
    else if (intent?.then) await runIntent(intent.then, navigation);
  };

  const submit = async () => {
    if (!isComplete(digits)) { setError('Номер неполный — нужно 9 цифр после +375'); haptic.error(); return; }
    setError('');
    setLoading(true);
    try {
      const phone = toE164(digits);
      const verification = await sendVerificationCode(phone);
      start(phone, verification, intent);
      onClose();
      navigation.navigate('Code');
    } catch (e) {
      setError(e.message);
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ paddingHorizontal: 20 }}>
        <T v="body" c="ink2" style={{ marginTop: 7, fontSize: 14.5, lineHeight: 21 }}>
          {text || (signedIn
            ? 'Номер для связи по смене. Заказчик увидит его только после подтверждения смены.'
            : 'Чтобы откликнуться на смену, войди. Заказчик увидит твой номер только после подтверждения смены.')}
        </T>
        {social && !signedIn ? (
          <>
            <View style={{ marginTop: 16 }}>
              <SocialButtons navigation={navigation} intent={intent} onSignedIn={onClose} onLeave={onClose} onError={setError} />
            </View>
            <OrDivider style={{ marginTop: 14 }} />
          </>
        ) : null}
        <View style={{ marginTop: 16 }}>
          <PhoneField value={digits} onChange={(v) => { setDigits(v); if (error) setError(''); }} autoFocus={signedIn || !social} onSubmit={signedIn ? save : submit} error={!!error} />
        </View>
        {error ? (
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="exclamationmark.circle" size={13} c="error" />
            <T v="caption" c="error" style={{ fontSize: 12.5 }}>{error}</T>
          </View>
        ) : null}
        {signedIn ? (
          <Button title="Сохранить номер" onPress={save} style={{ marginTop: 10 }} />
        ) : (
          <Button title="Получить код" loadingTitle="Отправляем код…" onPress={submit} loading={loading} variant={social ? 'secondary' : 'primary'} style={{ marginTop: 10 }} />
        )}
        <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
          <T v="caption" c="ink2" style={{ fontSize: 12 }}>Продолжая, ты принимаешь </T>
          <Press feedback="none" onPress={() => openLink(LINKS.terms)} accessibilityRole="link"><T v="caption" c="brand" style={{ fontSize: 12 }}>условия</T></Press>
          <T v="caption" c="ink2" style={{ fontSize: 12 }}> и </T>
          <Press feedback="none" onPress={() => openLink(LINKS.privacy)} accessibilityRole="link"><T v="caption" c="brand" style={{ fontSize: 12 }}>политику конфиденциальности</T></Press>
          <T v="caption" c="ink2" style={{ fontSize: 12 }}>.</T>
        </View>
      </View>
    </Sheet>
  );
}
