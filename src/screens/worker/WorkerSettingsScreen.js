// «Личные данные» — screen 15. The phone is read-only, with a lock and the
// reason why. The photo is optional and its payoff is named without
// pressure. Skills carry their category pictogram once chosen.
import React, { useState } from 'react';
import { View, ScrollView, TextInput, KeyboardAvoidingView, Platform, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, CircleButton, Card, Group, Divider, Switch } from '../../design/ui';
import { PersonMono } from '../../design/Monogram';
import { Pictogram, categoryFromSkill } from '../../design/category';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { prettyPhone } from '../../design/PhoneField';
import { CITIES, WORKER_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

const SHOWN_SKILLS = 5;

// A line of the data group: fixed 88 pt label, value on the right.
function Field({ label, error, children, accessible, accessibilityLabel }) {
  return (
    <View
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 14, minHeight: 44 }}
    >
      <T v="body" c={error ? 'error' : 'ink2'} style={{ width: 88, fontSize: 15, lineHeight: 20 }}>{label}</T>
      {children}
    </View>
  );
}

function SkillChip({ label, selected, onPress }) {
  const { c } = useTheme();
  const kind = categoryFromSkill(label);
  const withIcon = selected && !!kind;
  return (
    <Press
      onPress={onPress}
      hitSlop={{ top: 5, bottom: 5 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34,
        paddingVertical: 8, paddingLeft: withIcon ? 9 : 12, paddingRight: 12, borderRadius: 11,
        backgroundColor: selected ? c.brandTint : c.surface, borderWidth: 1, borderColor: selected ? 'transparent' : c.line,
      }}
    >
      {withIcon ? <Pictogram kind={kind} size={16} color={c.brand} /> : null}
      <T v="bodyStrong" c={selected ? 'brand' : 'ink3'} style={{ fontSize: 13.5, lineHeight: 17, fontWeight: selected ? '600' : '500' }}>{label}</T>
    </Press>
  );
}

export default function WorkerSettingsScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
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
  const [allSkills, setAllSkills] = useState(false);
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

  const pickCity = () => showActions({
    title: 'Город',
    options: CITIES.map((city) => ({ label: city, onPress: () => { haptic.selection(); set('city', city); } })),
  });

  const skills = allSkills
    ? WORKER_CATEGORIES
    : WORKER_CATEGORIES.filter((cat, i) => i < SHOWN_SKILLS || form.categories.includes(cat));
  const hiddenSkills = WORKER_CATEGORIES.length - skills.length;
  const inputStyle = { flex: 1, fontSize: 16, fontWeight: '500', color: c.ink, paddingVertical: 0, minHeight: 22 };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" style={{ flex: 1 }} numberOfLines={1} accessibilityRole="header">Личные данные</T>
        <Press feedback="none" onPress={save} hitSlop={12} accessibilityLabel="Готово, сохранить">
          <T v="bodyStrong" c="brand" style={{ fontSize: 15, lineHeight: 20 }}>Готово</T>
        </Press>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: insets.bottom + 30 }}>
          <Press
            feedback="none"
            onPress={pickPhoto}
            style={{ marginTop: 14, alignSelf: 'center', alignItems: 'center', paddingHorizontal: 8 }}
            accessibilityLabel={form.avatar ? 'Изменить фото профиля' : 'Добавить фото профиля'}
          >
            <View style={{ width: 96, height: 96 }}>
              <PersonMono first={form.firstName} last={form.lastName} uri={form.avatar} size={96} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: c.brand, borderWidth: 3, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={16} c="onBrand" weight="semibold" />
              </View>
            </View>
            <T v="bodyStrong" c="brand" style={{ marginTop: 10, fontSize: 14, lineHeight: 18 }}>{form.avatar ? 'Изменить фото' : 'Добавить фото'}</T>
            <T v="caption" c="ink2" style={{ marginTop: 5, fontSize: 12.5, lineHeight: 17.5, textAlign: 'center' }}>Не обязательно. С фото откликам доверяют чаще</T>
          </Press>

          <Group style={[{ marginTop: 22, borderRadius: 18 }, t.sh.e1]}>
            <Field label="Имя" error={!!error}>
              <TextInput
                value={form.firstName}
                onChangeText={(v) => { set('firstName', v); setError(''); }}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="givenName"
                autoComplete="given-name"
                returnKeyType="next"
                placeholder="Имя"
                placeholderTextColor={c.inkDisabled}
                style={inputStyle}
                accessibilityLabel="Имя"
              />
            </Field>
            <Divider inset={14} />
            <Field label="Фамилия">
              <TextInput
                value={form.lastName}
                onChangeText={(v) => set('lastName', v)}
                autoCapitalize="words"
                autoCorrect={false}
                textContentType="familyName"
                autoComplete="family-name"
                placeholder="Фамилия"
                placeholderTextColor={c.inkDisabled}
                style={inputStyle}
                accessibilityLabel="Фамилия"
              />
            </Field>
            <Divider inset={14} />
            <Field
              label="Телефон"
              accessible
              accessibilityLabel={`Телефон ${me.phone ? prettyPhone(me.phone) : 'не указан'}. Менять нельзя`}
            >
              <T v="body" c="ink2" style={{ flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '500' }} numberOfLines={1}>
                {me.phone ? prettyPhone(me.phone) : 'Не указан'}
              </T>
              <Icon name="lock" size={15} c="ink2" style={{ opacity: 0.65 }} />
            </Field>
            <Divider inset={14} />
            <Press feedback="highlight" onPress={pickCity} accessibilityLabel={`Город: ${form.city}. Изменить`}>
              <Field label="Город">
                <T v="body" style={{ flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '500' }} numberOfLines={1}>{form.city}</T>
                <Icon name="chevron.down" size={15} c="ink2" weight="semibold" style={{ opacity: 0.6 }} />
              </Field>
            </Press>
          </Group>
          {error ? <T v="caption" c="error" weight="600" style={{ marginTop: 8, paddingHorizontal: 4 }}>{error}</T> : null}
          <T v="caption" c="ink2" style={{ marginTop: 7, paddingHorizontal: 4, fontSize: 12, lineHeight: 17.5 }}>
            Телефон менять нельзя — на него привязан вход. Напиши в поддержку, если номер сменился.
          </T>

          <Card radius={18} style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="body" style={{ fontSize: 16, lineHeight: 20 }}>Показывать номер</T>
              <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17 }}>Заказчику — только после подтверждения смены</T>
            </View>
            <Switch
              value={form.phoneVisible}
              onValueChange={(v) => { haptic.selection(); set('phoneVisible', v); }}
              accessibilityLabel="Показывать номер заказчикам"
            />
          </Card>

          <T v="titleSection" style={{ marginTop: 18, fontSize: 17, lineHeight: 20 }} accessibilityRole="header">Что умеешь</T>
          <T v="caption" c="ink2" style={{ marginTop: 5, fontSize: 12.5, lineHeight: 17.5 }}>Заказчики увидят это в твоём профиле</T>
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {skills.map((cat) => <SkillChip key={cat} label={cat} selected={form.categories.includes(cat)} onPress={() => toggleCat(cat)} />)}
            {hiddenSkills > 0 ? (
              <Press
                onPress={() => { haptic.selection(); setAllSkills(true); }}
                hitSlop={{ top: 5, bottom: 5 }}
                accessibilityLabel={`Показать ещё ${hiddenSkills}`}
                style={{ minHeight: 34, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 11, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, justifyContent: 'center' }}
              >
                <T v="bodyStrong" c="ink3" style={{ fontSize: 13.5, lineHeight: 17, fontWeight: '500' }}>{`Ещё ${hiddenSkills}`}</T>
              </Press>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
