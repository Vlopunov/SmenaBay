import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function RegisterEmployerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const registerEmployer = useStore(s => s.registerEmployer);

  const [form, setForm] = useState({
    companyName: '', unp: '', contactPerson: '', phone: '+375',
    city: '', businessCategory: '', logo: null,
  });
  const [errors, setErrors] = useState({});
  const [showCities, setShowCities] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [step, setStep] = useState(1);
  const [smsCode, setSmsCode] = useState('');

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Введите название';
    if (form.unp.length !== 9) e.unp = 'УНП — 9 цифр';
    if (!form.contactPerson.trim()) e.contactPerson = 'Введите ФИО';
    if (form.phone.length < 13) e.phone = 'Введите номер';
    if (!form.city) e.city = 'Выберите город';
    if (!form.businessCategory) e.businessCategory = 'Выберите категорию';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep(2);
  };

  const handleVerify = () => {
    if (smsCode.length < 4) return;
    registerEmployer(form);
  };

  const renderSelect = (label, value, placeholder, items, show, setShow, field, error) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.input, styles.selectInput, error && styles.inputError]}
        onPress={() => setShow(!show)}
      >
        <Text style={value ? styles.selectText : styles.selectPlaceholder}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
      {show && (
        <View style={styles.dropdown}>
          {items.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.dropdownItem, value === item && styles.dropdownItemActive]}
              onPress={() => { setForm(f => ({ ...f, [field]: item })); setShow(false); }}
            >
              <Text style={[styles.dropdownText, value === item && styles.dropdownTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );

  if (step === 2) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.smsContainer}>
          <Text style={styles.smsTitle}>Введите SMS-код</Text>
          <Text style={styles.smsSubtitle}>Код отправлен на {form.phone}</Text>
          <TextInput
            style={styles.smsInput}
            value={smsCode}
            onChangeText={setSmsCode}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="0000"
            placeholderTextColor={COLORS.textTertiary}
            autoFocus
          />
          <Text style={styles.smsHint}>В прототипе подойдёт любой код</Text>
          <TouchableOpacity
            style={[styles.submitBtn, smsCode.length < 4 && styles.submitBtnDisabled]}
            onPress={handleVerify}
            disabled={smsCode.length < 4}
            activeOpacity={0.7}
          >
            <Text style={styles.submitBtnText}>Подтвердить</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Заказчик</Text>

        <Text style={styles.label}>Название компании *</Text>
        <TextInput
          style={[styles.input, errors.companyName && styles.inputError]}
          value={form.companyName}
          onChangeText={v => setForm(f => ({ ...f, companyName: v }))}
          placeholder="ООО / ИП"
          placeholderTextColor={COLORS.textTertiary}
        />
        {errors.companyName && <Text style={styles.error}>{errors.companyName}</Text>}

        <Text style={styles.label}>УНП * (9 цифр)</Text>
        <TextInput
          style={[styles.input, errors.unp && styles.inputError]}
          value={form.unp}
          onChangeText={v => setForm(f => ({ ...f, unp: v.replace(/\D/g, '').slice(0, 9) }))}
          placeholder="123456789"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="number-pad"
          maxLength={9}
        />
        {errors.unp && <Text style={styles.error}>{errors.unp}</Text>}

        <Text style={styles.label}>Контактное лицо (ФИО) *</Text>
        <TextInput
          style={[styles.input, errors.contactPerson && styles.inputError]}
          value={form.contactPerson}
          onChangeText={v => setForm(f => ({ ...f, contactPerson: v }))}
          placeholder="Иванов Иван Иванович"
          placeholderTextColor={COLORS.textTertiary}
        />
        {errors.contactPerson && <Text style={styles.error}>{errors.contactPerson}</Text>}

        <Text style={styles.label}>Телефон *</Text>
        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          value={form.phone}
          onChangeText={v => setForm(f => ({ ...f, phone: v }))}
          placeholder="+375XXXXXXXXX"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="phone-pad"
        />
        {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}

        {renderSelect('Город *', form.city, 'Выберите город', CITIES, showCities, setShowCities, 'city', errors.city)}
        {renderSelect('Категория бизнеса *', form.businessCategory, 'Выберите категорию', BUSINESS_CATEGORIES, showCategories, setShowCategories, 'businessCategory', errors.businessCategory)}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.7}>
          <Text style={styles.submitBtnText}>Продолжить</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES['3xl'] },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.sm },
  title: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: SIZES.body, color: '#D97706', ...FONTS.medium, marginTop: SIZES.xs, marginBottom: SIZES.xl },
  label: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary, marginTop: SIZES.base, marginBottom: SIZES.sm },
  input: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.base,
    height: SIZES.inputHeight, fontSize: SIZES.body, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, ...FONTS.regular,
  },
  inputError: { borderColor: COLORS.error },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  selectPlaceholder: { fontSize: SIZES.body, color: COLORS.textTertiary },
  error: { fontSize: SIZES.caption, color: COLORS.error, marginTop: SIZES.xs },
  dropdown: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, marginTop: SIZES.xs, ...SHADOWS.md, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.md },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  dropdownTextActive: { color: COLORS.accent, ...FONTS.medium },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
  smsContainer: { flex: 1, paddingHorizontal: SIZES.lg, paddingTop: SIZES['3xl'], alignItems: 'center' },
  smsTitle: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary },
  smsSubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.sm },
  smsInput: {
    width: 160, height: 64, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    fontSize: 32, textAlign: 'center', ...FONTS.bold, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, marginTop: SIZES['2xl'], letterSpacing: 12,
  },
  smsHint: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: SIZES.md },
});
