import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { CITIES, BUSINESS_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function EmployerSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const updateProfile = useStore(s => s.updateProfile);

  const [form, setForm] = useState({
    companyName: currentUser?.companyName || '',
    unp: currentUser?.unp || '',
    contactPerson: currentUser?.contactPerson || '',
    city: currentUser?.city || '',
    businessCategory: currentUser?.businessCategory || '',
  });

  const [showCities, setShowCities] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleUnpChange = (v) => {
    const digits = v.replace(/[^0-9]/g, '').slice(0, 9);
    setForm(f => ({ ...f, unp: digits }));
  };

  const handleSave = () => {
    if (!form.companyName.trim()) {
      Alert.alert('Ошибка', 'Название компании обязательно');
      return;
    }
    if (!form.unp || form.unp.length !== 9) {
      Alert.alert('Ошибка', 'УНП должен содержать 9 цифр');
      return;
    }
    if (!form.contactPerson.trim()) {
      Alert.alert('Ошибка', 'Контактное лицо обязательно');
      return;
    }
    if (!form.city) {
      Alert.alert('Ошибка', 'Выберите город');
      return;
    }
    updateProfile(form);
    Alert.alert('Готово', 'Данные успешно сохранены');
  };

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Данные компании</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Company name */}
        <Text style={styles.label}>Название компании</Text>
        <TextInput
          style={styles.input}
          value={form.companyName}
          onChangeText={v => setForm(f => ({ ...f, companyName: v }))}
          placeholder="ООО «Компания»"
          placeholderTextColor={COLORS.textTertiary}
        />

        {/* UNP */}
        <Text style={styles.label}>УНП</Text>
        <TextInput
          style={styles.input}
          value={form.unp}
          onChangeText={handleUnpChange}
          placeholder="123456789"
          placeholderTextColor={COLORS.textTertiary}
          keyboardType="number-pad"
          maxLength={9}
        />

        {/* Contact person */}
        <Text style={styles.label}>Контактное лицо</Text>
        <TextInput
          style={styles.input}
          value={form.contactPerson}
          onChangeText={v => setForm(f => ({ ...f, contactPerson: v }))}
          placeholder="Имя и фамилия"
          placeholderTextColor={COLORS.textTertiary}
        />

        {/* Phone (read-only) */}
        <Text style={styles.label}>Телефон</Text>
        <View style={[styles.input, styles.inputDisabled]}>
          <Text style={styles.inputDisabledText}>{currentUser.phone}</Text>
        </View>

        {/* City */}
        <Text style={styles.label}>Город</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectInput]}
          onPress={() => { setShowCities(!showCities); setShowCategories(false); }}
        >
          <Text style={form.city ? styles.selectText : styles.selectPlaceholder}>
            {form.city || 'Выберите город'}
          </Text>
          <Ionicons
            name={showCities ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textTertiary}
          />
        </TouchableOpacity>

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

        {/* Business category */}
        <Text style={styles.label}>Категория бизнеса</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectInput]}
          onPress={() => { setShowCategories(!showCategories); setShowCities(false); }}
        >
          <Text style={form.businessCategory ? styles.selectText : styles.selectPlaceholder}>
            {form.businessCategory || 'Выберите категорию'}
          </Text>
          <Ionicons
            name={showCategories ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={COLORS.textTertiary}
          />
        </TouchableOpacity>

        {showCategories && (
          <View style={styles.dropdown}>
            {BUSINESS_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.dropdownItem, form.businessCategory === cat && styles.dropdownItemActive]}
                onPress={() => { setForm(f => ({ ...f, businessCategory: cat })); setShowCategories(false); }}
              >
                <Text style={[styles.dropdownText, form.businessCategory === cat && styles.dropdownTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
          <Text style={styles.saveBtnText}>Сохранить</Text>
        </TouchableOpacity>

        <View style={{ height: SIZES['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm,
  },
  backBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary,
  },
  scroll: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES['3xl'] },
  label: {
    fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary,
    marginTop: SIZES.base, marginBottom: SIZES.sm,
  },
  input: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.base, height: SIZES.inputHeight,
    fontSize: SIZES.body, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, ...FONTS.regular,
  },
  inputDisabled: {
    backgroundColor: COLORS.surface, justifyContent: 'center',
  },
  inputDisabledText: {
    fontSize: SIZES.body, color: COLORS.textSecondary, ...FONTS.regular,
  },
  selectInput: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  selectPlaceholder: { fontSize: SIZES.body, color: COLORS.textTertiary },
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    marginTop: SIZES.xs, ...SHADOWS.md, overflow: 'hidden',
  },
  dropdownItem: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.md },
  dropdownItemActive: { backgroundColor: COLORS.accentSoft },
  dropdownText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  dropdownTextActive: { color: COLORS.accent, ...FONTS.medium },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd,
    height: SIZES.buttonHeight, justifyContent: 'center', alignItems: 'center',
    marginTop: SIZES.xl,
  },
  saveBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
});
