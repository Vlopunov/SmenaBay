// «Закрепим место за тобой» — the number is asked for at the moment of
// applying, and the sheet says why: the employer sees the application right
// away and the number is for calling on the day of the shift.
import React, { useState } from 'react';
import { View } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import PhoneField, { toE164, isComplete } from '../design/PhoneField';
import { Button, Note } from '../design/ui';
import { haptic } from '../design/haptics';
import { plural } from '../design/format';
import { sendVerificationCode } from '../services/auth';
import { useAuthFlow } from '../services/authFlow';

export default function PhoneSheet({ visible, onClose, navigation, intent, spotsLeft, title = 'Закрепим место за тобой', text, note }) {
  const [digits, setDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const start = useAuthFlow((s) => s.start);

  const lead = spotsLeft === 1
    ? 'Осталось одно место.'
    : spotsLeft > 1 ? `Осталось ${spotsLeft} ${plural(spotsLeft, ['место', 'места', 'мест'])}.` : '';

  const submit = async () => {
    if (!isComplete(digits)) { setError('Нужно 9 цифр после +375'); haptic.error(); return; }
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
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 22, paddingTop: 12 }}>
        <T v="sheetTitle">{title}</T>
        <T v="body" c="secondary" style={{ marginTop: 6 }}>
          {text || `${lead ? `${lead} ` : ''}Введи номер — заказчик увидит отклик сразу, а мы напишем, когда его подтвердят.`}
        </T>
        <View style={{ marginTop: 20 }}>
          <PhoneField value={digits} onChange={(v) => { setDigits(v); if (error) setError(''); }} autoFocus onSubmit={submit} error={!!error} />
        </View>
        {error ? <T v="smallStrong" c="destructive" style={{ marginTop: 8, marginLeft: 20 }}>{error}</T> : null}
        <Button title="Получить код" onPress={submit} loading={loading} style={{ marginTop: 12 }} />
      </View>
      <Note icon="lock.shield" style={{ marginTop: 14 }}>
        {note || 'Номер нужен заказчику, чтобы позвонить в день смены. Паспорт и документы — только если смена их требует.'}
      </Note>
    </Sheet>
  );
}
