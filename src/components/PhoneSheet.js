// «Нужен номер» (screen 5): asked at the moment of applying, not at launch.
// The sheet says why and who sees the number; Apple and Google are offered
// at equal weight below.
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
import { useAuthFlow } from '../services/authFlow';
import SocialButtons, { OrDivider } from './SocialButtons';

export default function PhoneSheet({ visible, onClose, navigation, intent, title = 'Нужен номер', text, social = true }) {
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const start = useAuthFlow((s) => s.start);

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
          {text || 'Чтобы откликнуться на смену, подтверди номер. Заказчик увидит его только после подтверждения смены.'}
        </T>
        <View style={{ marginTop: 16 }}>
          <PhoneField value={digits} onChange={(v) => { setDigits(v); if (error) setError(''); }} autoFocus onSubmit={submit} error={!!error} />
        </View>
        {error ? (
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="exclamationmark.circle" size={13} c="error" />
            <T v="caption" c="error" style={{ fontSize: 12.5 }}>{error}</T>
          </View>
        ) : null}
        <Button title="Получить код" loadingTitle="Отправляем код…" onPress={submit} loading={loading} style={{ marginTop: 10 }} />
        {social ? (
          <>
            <OrDivider style={{ marginTop: 14 }} />
            <View style={{ marginTop: 14 }}>
              <SocialButtons navigation={navigation} intent={intent} onSignedIn={onClose} onLeave={onClose} onError={setError} />
            </View>
          </>
        ) : null}
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
