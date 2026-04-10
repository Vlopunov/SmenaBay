import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { CITIES, WORKER_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function RegisterWorkerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const registerWorker = useStore(s => s.registerWorker);

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '+375', city: '', categories: [], avatar: null,
  });
  const [errors, setErrors] = useState({});
  const [showCities, setShowCities] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=sms

  const [smsCode, setSmsCode] = useState('');

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Введите имя';
    if (!form.lastName.trim()) e.lastName = 'Введите фамилию';
    if (form.phone.length < 13) e.phone = 'Введите номер телефона';
    if (!form.city) e.city = 'Выберите город';
    if (form.categories.length === 0) e.categories = 'Выберите минимум 1 категорию';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setStep(2);
  };

  const handleVerify = () => {
    if (smsCode.length < 4) return;
    // Any code accepted in prototype
    registerWorker(form);
  };

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  if (step === 2) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.smsContainer}>
          <Text style={styles.smsTitle}>Введите SMS-код</Text>
          <Text style={styles.smsSubtitle}>
            Код отправлен на {form.phone}
          </Text>
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
        <Text style={styles.subtitle}>Исполнитель</Text>

        {/* Name */}
        <Text style={styles.label}>Имя *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          value={form.firstName}
          onChangeText={v => setForm(f => ({ ...f, firstName: v }))}
          placeholder="Ваше имя"
          placeholderTextColor={COLORS.textTertiary}
        />
        {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

        <Text style={styles.label}>Фамилия *</Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          value={form.lastName}
          onChangeText={v => setForm(f => ({ ...f, lastName: v }))}
          placeholder="Ваша фамилия"
          placeholderTextColor={COLORS.textTertiary}
        />
        {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

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

        {/* City */}
        <Text style={styles.label}>Город *</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectInput, errors.city && styles.inputError]}
          onPress={() => setShowCities(!showCities)}
        >
          <Text style={form.city ? styles.selectText : styles.selectPlaceholder}>
            {form.city || 'Выберите город'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
        {errors.city && <Text style={styles.error}>{errors.city}</Text>}

        {showCities && (
          <View style={styles.dropdown}>
            {CITIES.map(city => (
              <TouchableOpacity
                key={city}
                style={[styles.dropdownItem, form.city === city && styles.dropdownItemActive]}
                onPress={() => { setForm(f => ({ ...f, city })); setShowCities(false); }}
              >
                <Text style={[styles.dropdownText, form.city === city && styles.dropdownTextActive]}>
                  {city}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Categories */}
        <Text style={styles.label}>Категории интересов * (мин. 1)</Text>
        {errors.categories && <Text style={styles.error}>{errors.categories}</Text>}
        <View style={styles.chips}>
          {WORKER_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, form.categories.includes(cat) && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.chipText, form.categories.includes(cat) && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
  backBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.sm,
  },
  title: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: {
    fontSize: SIZES.body, color: COLORS.accent, ...FONTS.medium, marginTop: SIZES.xs, marginBottom: SIZES.xl,
  },
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
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, marginTop: SIZES.xs,
    ...SHADOWS.md, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.md },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  dropdownTextActive: { color: COLORS.accent, ...FONTS.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  chip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.xl,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
  // SMS
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
