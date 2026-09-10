// Personal data — the same ledger lines employers see in an application.
import React, { useState } from 'react';
import { View, ScrollView, Switch, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import FormRow from '../../design/FormRow';
import { NavBar, Press, SectionHeader, LedgerRow, Chip, PersonAvatar, Separator } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { prettyPhone } from '../../design/PhoneField';
import { CITIES, WORKER_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function WorkerSettingsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const updateProfile = useStore((s) => s.updateProfile);
  const [form, setForm] = useState({
    firstName: me?.firstName || '',
    lastName: me?.lastName || '',
    city: me?.city || 'Минск',
    categories: me?.categories || [],
    phoneVisible: me?.phoneVisible !== false,
    avatar: me?.avatar || null,
  });
  const [error, setError] = useState('');
  if (!me) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleCat = (cat) => {
    haptic.selection();
    set('categories', form.categories.includes(cat) ? form.categories.filter((x) => x !== cat) : [...form.categories, cat]);
  };

  const save = () => {
    if (!form.firstName.trim()) { setError('Без имени заказчик не поймёт, кто откликнулся'); haptic.error(); return; }
    updateProfile({ ...form, firstName: form.firstName.trim(), lastName: form.lastName.trim() });
    haptic.success();
    navigation.goBack();
  };

  const pickPhoto = () => showActions({
    title: 'Фото профиля',
    options: [
      { label: 'Снять фото', onPress: () => pick('camera') },
      { label: 'Выбрать из галереи', onPress: () => pick('library') },
      form.avatar ? { label: 'Убрать фото', destructive: true, onPress: () => set('avatar', null) } : null,
    ].filter(Boolean),
  });

  const pick = async (source) => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Нет доступа', 'Разреши доступ в Настройках, чтобы поставить фото.'); return; }
    const r = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (r.canceled || !r.assets?.[0]) return;
    const m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 400 } }], { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG });
    set('avatar', m.uri);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar
        variant="fill"
        onBack={() => navigation.goBack()}
        center={<T v="rowTitle">Личные данные</T>}
        right={<Press feedback="none" onPress={save} hitSlop={10}><T v="bodyStrong" c="accent" style={{ fontSize: 17 }}>Готово</T></Press>}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
          <Press feedback="highlight" onPress={pickPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 16 }} accessibilityLabel="Изменить фото профиля">
            <PersonAvatar first={form.firstName} last={form.lastName} uri={form.avatar} size={56} />
            <View style={{ flex: 1 }}>
              <T v="value">Фото профиля</T>
              <T v="caption" c="secondary">Фото увидят заказчики в твоём отклике</T>
            </View>
            <T v="body" c="accent">{form.avatar ? 'Изменить' : 'Добавить'}</T>
          </Press>

          <SectionHeader title="Как тебя видят заказчики" />
          <FormRow label="Имя" value={form.firstName} onChangeText={(v) => { set('firstName', v); setError(''); }} autoCapitalize="words" textContentType="givenName" error={error} />
          <FormRow label="Фамилия" value={form.lastName} onChangeText={(v) => set('lastName', v)} autoCapitalize="words" textContentType="familyName" />
          <LedgerRow label="Телефон" value={me.phone ? prettyPhone(me.phone) : 'Не указан'} sub="Меняется только через поддержку" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <T v="value" style={{ fontSize: 16, lineHeight: 21 }}>Показывать номер</T>
              <T v="caption" c="secondary">Заказчики смогут позвонить из твоего профиля</T>
            </View>
            <Switch
              value={form.phoneVisible}
              onValueChange={(v) => { haptic.selection(); set('phoneVisible', v); }}
              trackColor={{ true: c.accent, false: c.fillSecondary }}
              ios_backgroundColor={c.fillSecondary}
              accessibilityLabel="Показывать номер заказчикам"
            />
          </View>

          <SectionHeader title="Город" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {CITIES.map((city) => <Chip key={city} label={city} selected={form.city === city} onPress={() => { haptic.selection(); set('city', city); }} />)}
          </View>

          <SectionHeader title="Что умеешь" right={form.categories.length ? `выбрано ${form.categories.length}` : undefined} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {WORKER_CATEGORIES.map((cat) => <Chip key={cat} label={cat} selected={form.categories.includes(cat)} onPress={() => toggleCat(cat)} />)}
          </View>
          <Separator />
          <T v="small" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 12 }}>
            Категории видят заказчики в каталоге исполнителей — по ним тебя зовут на смены.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
