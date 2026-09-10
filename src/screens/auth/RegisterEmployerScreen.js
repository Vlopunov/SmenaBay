// Employer account. The form is a ledger — the same lines the company card
// will show to workers — followed by the phone and an SMS code.
import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import FormRow from '../../design/FormRow';
import PhoneField, { toE164, isComplete } from '../../design/PhoneField';
import { NavBar, Button, Chip, SectionHeader, Note } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import { sendVerificationCode } from '../../services/auth';
import { useAuthFlow } from '../../services/authFlow';

export default function RegisterEmployerScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const start = useAuthFlow((s) => s.start);
  const [form, setForm] = useState({ companyName: '', unp: '', contactPerson: '', city: 'Минск', businessCategory: '' });
  const [digits, setDigits] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const submit = async () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Как компанию увидят исполнители';
    if (form.unp.replace(/\D/g, '').length !== 9) e.unp = 'УНП — 9 цифр';
    if (!form.contactPerson.trim()) e.contactPerson = 'Кому звонить по сменам';
    if (!form.businessCategory) e.businessCategory = 'Выбери категорию';
    if (!isComplete(digits)) e.phone = 'Нужно 9 цифр после +375';
    setErrors(e);
    if (Object.keys(e).length) { haptic.error(); return; }
    setLoading(true);
    try {
      const phone = toE164(digits);
      const verification = await sendVerificationCode(phone);
      start(phone, verification, { type: 'employer', form: { ...form, unp: form.unp.replace(/\D/g, '') } });
      navigation.navigate('Code');
    } catch (err) {
      setErrors({ phone: err.message });
      haptic.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar onBack={() => navigation.goBack()} variant="fill" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 22 }}>
            <T v="title" accessibilityRole="header">Аккаунт заказчика</T>
            <T v="body" c="secondary" style={{ marginTop: 7 }}>
              Эти данные исполнители увидят в каждой твоей смене — рядом с оплатой и адресом.
            </T>
          </View>

          <SectionHeader title="Компания" />
          <FormRow label="Название" value={form.companyName} onChangeText={set('companyName')} placeholder="Ozon ПВЗ Минск" error={errors.companyName} autoCapitalize="words" />
          <FormRow label="УНП" value={form.unp} onChangeText={(v) => set('unp')(v.replace(/\D/g, '').slice(0, 9))} placeholder="9 цифр" keyboardType="number-pad" error={errors.unp} />
          <FormRow label="Контакт" value={form.contactPerson} onChangeText={set('contactPerson')} placeholder="Имя и фамилия" autoCapitalize="words" textContentType="name" error={errors.contactPerson} last />

          <SectionHeader title="Город" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {CITIES.map((city) => <Chip key={city} label={city} selected={form.city === city} onPress={() => { haptic.selection(); set('city')(city); }} />)}
          </View>

          <SectionHeader title="Чем занимается компания" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {BUSINESS_CATEGORIES.map((cat) => <Chip key={cat} label={cat} selected={form.businessCategory === cat} onPress={() => { haptic.selection(); set('businessCategory')(cat); }} />)}
          </View>
          {errors.businessCategory ? <T v="small" c="destructive" style={{ paddingHorizontal: 22, marginTop: -6 }}>{errors.businessCategory}</T> : null}

          <SectionHeader title="Телефон для входа" />
          <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
            <PhoneField value={digits} onChange={(v) => { setDigits(v); setErrors((e) => ({ ...e, phone: undefined })); }} error={!!errors.phone} />
            {errors.phone ? <T v="smallStrong" c="destructive" style={{ marginTop: 8, marginLeft: 20 }}>{errors.phone}</T> : null}
            <Button title="Получить код" onPress={submit} loading={loading} style={{ marginTop: 14 }} />
          </View>
          <Note icon="lock.shield" style={{ marginTop: 14 }}>
            УНП нужен, чтобы исполнители видели, что за сменой стоит реальная компания.
          </Note>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
