// «Регистрация заказчика» (screen 9). What the company card will show to
// workers — name, УНП, city, category, contact — then the phone for the SMS
// code. Category is chosen with pictogram chips, the language the platform
// speaks about places. Nothing is verified against a registry, so the hint
// only says who sees the УНП; publishing is open right away.
import React, { useRef, useState } from 'react';
import {
  View, TextInput, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import PhoneField, { toE164, isComplete } from '../../design/PhoneField';
import { Button, Press, CircleButton } from '../../design/ui';
import { Pictogram, categoryFromBusiness } from '../../design/category';
import { showActions } from '../../design/ActionSheet';
import { plural } from '../../design/format';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import { sendVerificationCode } from '../../services/auth';
import { useAuthFlow } from '../../services/authFlow';

// The four the mockup shows first; the rest sit behind «Ещё N».
const FIRST = ['ПВЗ', 'Склад/Логистика', 'HoReCa', 'Ритейл'];
const ORDERED = [
  ...FIRST.filter((x) => BUSINESS_CATEGORIES.includes(x)),
  ...BUSINESS_CATEGORIES.filter((x) => !FIRST.includes(x)),
];
const LABEL = { 'HoReCa': 'Общепит', 'Склад/Логистика': 'Склад' };
const labelOf = (cat) => LABEL[cat] || cat;

function Label({ children }) {
  return <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5, lineHeight: 16, marginBottom: 6 }}>{children}</T>;
}

function ErrorLine({ text }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 }} accessibilityLiveRegion="polite">
      <Icon name="exclamationmark.circle" size={13} c="error" />
      <T v="caption" c="error" style={{ flex: 1, fontSize: 12.5, lineHeight: 16 }}>{text}</T>
    </View>
  );
}

/** Field: 52 pt, radius 15, surface + 1 pt line; focus 2 pt brand, error 2 pt error. */
function Field({ label, error, inputRef, style, ...input }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const ring = !!error || focused;
  return (
    <View style={style}>
      <Label>{label}</Label>
      <TextInput
        ref={inputRef}
        {...input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={c.inkDisabled}
        accessibilityLabel={label}
        maxFontSizeMultiplier={1.6}
        style={{
          minHeight: 52, borderRadius: 15, backgroundColor: c.surface,
          borderWidth: ring ? 2 : 1, borderColor: error ? c.error : focused ? c.brand : c.line,
          paddingHorizontal: ring ? 14 : 15, paddingVertical: 0,
          fontSize: 16.5, fontWeight: '500', color: c.ink, fontVariant: ['tabular-nums'],
        }}
      />
      {error ? <ErrorLine text={error} /> : null}
    </View>
  );
}

/** Category chip: selected — brand tint with the pictogram in brand. */
function CategoryChip({ label, kind, selected, onPress, accessibilityLabel }) {
  const { c } = useTheme();
  const fg = selected ? c.brand : c.ink3;
  return (
    <Press
      onPress={onPress}
      hitSlop={{ top: 4, bottom: 4 }}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 35,
        paddingVertical: 7, paddingLeft: kind ? 9 : 12, paddingRight: 12, borderRadius: 11,
        backgroundColor: selected ? c.brandTint : c.surface,
        borderWidth: 1, borderColor: selected ? 'transparent' : c.line,
      }}
    >
      {kind ? <Pictogram kind={kind} size={17} color={fg} /> : null}
      <T v="bodyStrong" c={fg} style={{ fontSize: 13.5, lineHeight: 17, fontWeight: selected ? '600' : '500' }}>{label}</T>
    </Press>
  );
}

export default function RegisterEmployerScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 20 : 24;
  const start = useAuthFlow((s) => s.start);
  const [form, setForm] = useState({ companyName: '', unp: '', contactPerson: '', city: 'Минск', businessCategory: '' });
  const [digits, setDigits] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState(false);
  const unpRef = useRef(null);
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

  const pickCity = () => showActions({
    title: 'Город',
    options: CITIES.map((city) => ({ label: city, onPress: () => { haptic.selection(); set('city')(city); } })),
  });

  const collapsed = !allCategories && ORDERED.length > FIRST.length + 1;
  const shown = collapsed ? ORDERED.slice(0, FIRST.length) : ORDERED;
  const more = ORDERED.length - shown.length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: G, paddingBottom: insets.bottom + 24 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            <T v="rowTitle" style={{ flex: 1, fontSize: 16.5, lineHeight: 21 }} numberOfLines={1}>Регистрация компании</T>
          </View>

          <T v="titleScreen" style={{ marginTop: 20, fontSize: 25, lineHeight: 30, letterSpacing: -0.5 }} accessibilityRole="header">Расскажи о компании</T>
          <T v="body" c="ink2" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 21 }}>
            Эти данные исполнители увидят в профиле компании.
          </T>

          <View style={{ marginTop: 18, gap: 11 }}>
            <Field
              label="Название"
              value={form.companyName}
              onChangeText={set('companyName')}
              placeholder="Например, Кафе «Васильки»"
              autoCapitalize="sentences"
              autoCorrect={false}
              textContentType="organizationName"
              returnKeyType="next"
              onSubmitEditing={() => unpRef.current?.focus()}
              error={errors.companyName}
            />

            <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
              <Field
                style={{ flex: 1 }}
                inputRef={unpRef}
                label="УНП"
                value={form.unp}
                onChangeText={(v) => set('unp')(v.replace(/\D/g, '').slice(0, 9))}
                placeholder="9 цифр"
                keyboardType="number-pad"
                maxLength={9}
                error={errors.unp}
              />
              <View style={{ flex: 1 }}>
                <Label>Город</Label>
                <Press
                  onPress={pickCity}
                  feedback="highlight"
                  accessibilityLabel={`Город, ${form.city}`}
                  accessibilityHint="Выбрать другой город"
                  style={{
                    minHeight: 52, borderRadius: 15, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingLeft: 15, paddingRight: 13,
                  }}
                >
                  <T v="body" style={{ flex: 1, fontSize: 16.5, lineHeight: 21, fontWeight: '500' }} numberOfLines={1}>{form.city}</T>
                  <Icon name="chevron.down" size={15} c="ink2" weight="semibold" />
                </Press>
              </View>
            </View>

            <View>
              <Label>Категория</Label>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {shown.map((cat) => (
                  <CategoryChip
                    key={cat}
                    label={labelOf(cat)}
                    kind={categoryFromBusiness(cat)}
                    selected={form.businessCategory === cat}
                    onPress={() => { haptic.selection(); set('businessCategory')(cat); }}
                  />
                ))}
                {more > 0 ? (
                  <CategoryChip
                    label={`Ещё ${more}`}
                    accessibilityLabel={`Ещё ${more} ${plural(more, ['категория', 'категории', 'категорий'])}`}
                    onPress={() => { haptic.selection(); setAllCategories(true); }}
                  />
                ) : null}
              </View>
              {errors.businessCategory ? <ErrorLine text={errors.businessCategory} /> : null}
            </View>

            <Field
              label="Контактное лицо"
              value={form.contactPerson}
              onChangeText={set('contactPerson')}
              placeholder="Имя и фамилия"
              autoCapitalize="words"
              autoCorrect={false}
              textContentType="name"
              returnKeyType="done"
              error={errors.contactPerson}
            />

            <View>
              <Label>Телефон для входа</Label>
              <PhoneField value={digits} onChange={(v) => { setDigits(v); setErrors((e) => ({ ...e, phone: undefined })); }} onSubmit={submit} error={!!errors.phone} />
              {errors.phone ? <ErrorLine text={errors.phone} /> : null}
            </View>
          </View>

          <View style={{ marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.surface2, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Icon name="info.circle" size={18} c="brand" style={{ marginTop: 1 }} />
            <T v="caption" c="ink3" style={{ flex: 1, fontSize: 13, lineHeight: 19 }}>
              УНП увидят исполнители в профиле компании. Публиковать смены можно сразу.
            </T>
          </View>

          <Button title="Получить код" loadingTitle="Отправляем код…" onPress={submit} loading={loading} style={{ marginTop: 14 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
