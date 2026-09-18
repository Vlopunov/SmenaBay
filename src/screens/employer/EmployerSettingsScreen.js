// «Данные компании» — screen 29. The lines workers see on every shift of
// this company. Most companies have no logo, so the monogram is shown as a
// full variant, not a placeholder. The UNP is never labelled as verified:
// nothing checks it.
import React, { useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert, TextInput, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { toast } from '../../design/Toast';
import { uploadImage } from '../../services/backend';
import { isOffline } from '../../services/api';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Press, Divider } from '../../design/ui';
import { CompanyMono, companyLetters } from '../../design/Monogram';
import { Pictogram, categoryFromBusiness } from '../../design/category';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { prettyPhone } from '../../design/PhoneField';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

const ABOUT_MAX = 300;
const MONO = Platform.select({ ios: 'ui-monospace', default: 'monospace' });

/** «Label — value» line inside the fields card: label column 100 pt. */
function Field({ label, error, children, last, onPress, accessibilityLabel }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, minHeight: 48 }}>
      <T v="body" c={error ? 'error' : 'ink2'} style={{ width: 100, fontSize: 14.5, lineHeight: 19 }}>{label}</T>
      <View style={{ flex: 1, minWidth: 0 }}>
        {children}
        {error ? <T v="caption" c="error" style={{ marginTop: 3, fontSize: 12.5 }}>{error}</T> : null}
      </View>
    </View>
  );
  return (
    <View>
      {onPress ? <Press feedback="highlight" onPress={onPress} accessibilityLabel={accessibilityLabel}>{content}</Press> : content}
      {!last ? <Divider inset={14} /> : null}
    </View>
  );
}

export default function EmployerSettingsScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
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
    // Shown at once; the uploaded copy is what исполнители will see.
    set('logo', m.uri);
    try {
      const url = await uploadImage(m.uri, 'logo');
      if (url) set('logo', url);
      else toast.error('Логотип не загрузился');
    } catch (e) {
      set('logo', null);
      toast.error(isOffline(e) ? 'Нет связи. Логотип не загрузился.' : 'Логотип не загрузился');
    }
  };

  const pickCity = () => showActions({
    title: 'Город',
    options: CITIES.map((city) => ({ label: city, onPress: () => { haptic.selection(); set('city', city); } })),
  });

  const input = { flex: 1, fontSize: 15.5, lineHeight: 20, fontWeight: '500', color: c.ink, paddingVertical: 0, fontVariant: ['tabular-nums'] };
  const label = (text) => <T v="caption" c="ink2" weight="600" style={{ marginTop: 16, fontSize: 13, lineHeight: 16 }}>{text}</T>;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: g, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} iconSize={20} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontSize: 17, lineHeight: 21 }}>Данные компании</T>
        <Press onPress={save} hitSlop={8} accessibilityLabel="Готово, сохранить" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 }}>
          <T v="bodyStrong" c="brand" style={{ fontSize: 15 }}>Готово</T>
        </Press>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: g, paddingBottom: insets.bottom + 30 }}>
          <Press onPress={pickLogo} accessibilityLabel={form.logo ? 'Изменить логотип' : 'Загрузить логотип'} style={{ marginTop: 16, alignItems: 'center', alignSelf: 'center', paddingHorizontal: 12 }}>
            <View style={{ width: 88, height: 88 }}>
              {form.logo ? (
                <CompanyMono name={form.companyName} logo={form.logo} size={88} style={{ borderRadius: 28 }} />
              ) : (
                <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                  <T v="body" display weight="800" c="brand" maxFontSizeMultiplier={1.2} style={{ fontSize: 30, lineHeight: 36 }}>{companyLetters(form.companyName) || '—'}</T>
                </View>
              )}
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: c.brand, borderWidth: 3, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="camera" size={14} c="onBrand" weight="semibold" />
              </View>
            </View>
            <T v="bodyStrong" c="brand" style={{ marginTop: 10, fontSize: 14, lineHeight: 18 }}>{form.logo ? 'Изменить логотип' : 'Загрузить логотип'}</T>
            <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17, textAlign: 'center' }}>
              {form.logo ? 'Логотип заменит монограмму в сменах компании' : 'Пока логотипа нет, покажем монограмму'}
            </T>
          </Press>

          <View style={[{ marginTop: 20, backgroundColor: c.surface, borderRadius: 18 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: c.line }]}>
            <View style={{ borderRadius: 17, overflow: 'hidden' }}>
              <Field label="Название" error={errors.companyName}>
                <TextInput value={form.companyName} onChangeText={(v) => set('companyName', v)} autoCapitalize="words" placeholder="Как в вывеске" placeholderTextColor={c.inkDisabled} accessibilityLabel="Название" style={input} />
              </Field>
              <Field label="УНП" error={errors.unp}>
                <TextInput value={form.unp} onChangeText={(v) => set('unp', v.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" placeholder="9 цифр" placeholderTextColor={c.inkDisabled} accessibilityLabel="УНП" style={input} />
              </Field>
              <Field label="Контакт">
                <TextInput value={form.contactPerson} onChangeText={(v) => set('contactPerson', v)} autoCapitalize="words" placeholder="Имя и фамилия" placeholderTextColor={c.inkDisabled} accessibilityLabel="Контакт" style={input} />
              </Field>
              <Field label="Телефон">
                <T v="body" c="ink2" weight="500" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 20 }}>{me.phone ? prettyPhone(me.phone) : 'Не указан'}</T>
              </Field>
              <Field label="Город" onPress={pickCity} accessibilityLabel={`Город: ${form.city}`} last>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <T v="body" weight="500" numberOfLines={1} style={{ flex: 1, fontSize: 15.5, lineHeight: 20 }}>{form.city}</T>
                  <Icon name="chevron.down" size={14} c="ink2" weight="semibold" style={{ opacity: 0.65 }} />
                </View>
              </Field>
            </View>
          </View>
          <T v="caption" c="ink2" style={{ marginTop: 8, paddingHorizontal: 4, fontSize: 12.5, lineHeight: 17 }}>
            УНП увидят исполнители в профиле компании. Контакт — кого спросить на входе, его видят подтверждённые исполнители. Телефон меняется через поддержку.
          </T>

          {label('Чем занимается')}
          <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {BUSINESS_CATEGORIES.map((cat) => {
              const on = form.businessCategory === cat;
              const kind = categoryFromBusiness(cat);
              return (
                <Press
                  key={cat}
                  onPress={() => { haptic.selection(); set('businessCategory', cat); }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={cat}
                  hitSlop={{ top: 4, bottom: 4 }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, borderRadius: 11,
                    paddingVertical: 8, paddingLeft: on && kind ? 9 : 12, paddingRight: 12,
                    backgroundColor: on ? c.brandTint : c.surface, borderWidth: 1, borderColor: on ? c.brandTint : c.line,
                  }}
                >
                  {on && kind ? <Pictogram kind={kind} size={16} color={c.brand} /> : null}
                  <T v="bodyStrong" c={on ? 'brand' : 'ink3'} weight={on ? '600' : '500'} style={{ fontSize: 13.5, lineHeight: 17 }}>{cat}</T>
                </Press>
              );
            })}
          </View>

          {label('О компании')}
          <View style={{ marginTop: 8, minHeight: 78, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingTop: 13, paddingBottom: 10, paddingHorizontal: 15 }}>
            <TextInput
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              maxLength={ABOUT_MAX}
              placeholder="Пара предложений для исполнителей"
              placeholderTextColor={c.inkDisabled}
              accessibilityLabel="О компании"
              style={{ fontSize: 14.5, lineHeight: 21, color: c.ink, paddingVertical: 0, minHeight: 42, textAlignVertical: 'top' }}
            />
            <T v="caption" c="ink2" style={{ marginTop: 7, alignSelf: 'flex-end', fontSize: 11.5, lineHeight: 14, fontFamily: MONO }}>{`${form.description.length} / ${ABOUT_MAX}`}</T>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
