// Company data — the lines workers see on every shift of this company.
import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import FormRow from '../../design/FormRow';
import { NavBar, Press, SectionHeader, LedgerRow, Chip, Monogram, Separator } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { prettyPhone } from '../../design/PhoneField';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function EmployerSettingsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);
  const [form, setForm] = useState({
    companyName: me?.companyName || '',
    unp: me?.unp || '',
    contactPerson: me?.contactPerson || '',
    description: me?.description || '',
    city: me?.city || 'Минск',
    businessCategory: me?.businessCategory || '',
    logo: me?.logo || null,
  });
  const [errors, setErrors] = useState({});
  if (!me) return null;
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const save = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Как компанию увидят исполнители';
    if (form.unp && form.unp.replace(/\D/g, '').length !== 9) e.unp = 'УНП — 9 цифр';
    setErrors(e);
    if (Object.keys(e).length) { haptic.error(); return; }
    updateProfile({ ...form, companyName: form.companyName.trim(), contactPerson: form.contactPerson.trim(), description: form.description.trim() });
    haptic.success();
    navigation.goBack();
  };

  const pickLogo = () => showActions({
    title: 'Логотип',
    options: [
      { label: 'Снять фото', onPress: () => pick('camera') },
      { label: 'Выбрать из галереи', onPress: () => pick('library') },
      form.logo ? { label: 'Убрать логотип', destructive: true, onPress: () => set('logo', null) } : null,
    ].filter(Boolean),
  });

  const pick = async (source) => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Нет доступа', 'Разреши доступ в Настройках, чтобы загрузить логотип.'); return; }
    const r = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (r.canceled || !r.assets?.[0]) return;
    const m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 400 } }], { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
    set('logo', m.uri);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar
        variant="fill"
        onBack={() => navigation.goBack()}
        center={<T v="rowTitle">Данные компании</T>}
        right={<Press feedback="none" onPress={save} hitSlop={10}><T v="bodyStrong" c="accent" style={{ fontSize: 17 }}>Готово</T></Press>}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
          <Press feedback="highlight" onPress={pickLogo} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 16 }} accessibilityLabel="Изменить логотип">
            <Monogram name={form.companyName} logo={form.logo} size={56} />
            <View style={{ flex: 1 }}>
              <T v="value">Логотип</T>
              <T v="caption" c="secondary">Без логотипа показываем буквы названия</T>
            </View>
            <T v="body" c="accent">{form.logo ? 'Изменить' : 'Добавить'}</T>
          </Press>
          <SectionHeader title="Компания" />
          <FormRow label="Название" value={form.companyName} onChangeText={(v) => set('companyName', v)} autoCapitalize="words" error={errors.companyName} />
          <FormRow label="УНП" value={form.unp} onChangeText={(v) => set('unp', v.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" error={errors.unp} />
          <FormRow label="Контакт" value={form.contactPerson} onChangeText={(v) => set('contactPerson', v)} autoCapitalize="words" hint="Кого спросить на входе — виден подтверждённым исполнителям" />
          <FormRow label="О компании" value={form.description} onChangeText={(v) => set('description', v)} multiline placeholder="Пара предложений для исполнителей" />
          <LedgerRow label="Телефон" value={me.phone ? prettyPhone(me.phone) : 'Не указан'} sub="Меняется через поддержку" last />

          <SectionHeader title="Город" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {CITIES.map((city) => <Chip key={city} label={city} selected={form.city === city} onPress={() => { haptic.selection(); set('city', city); }} />)}
          </View>
          <SectionHeader title="Чем занимается компания" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {BUSINESS_CATEGORIES.map((cat) => <Chip key={cat} label={cat} selected={form.businessCategory === cat} onPress={() => { haptic.selection(); set('businessCategory', cat); }} />)}
          </View>
          <Separator />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
