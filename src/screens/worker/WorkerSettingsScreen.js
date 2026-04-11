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

export default function WorkerSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const updateProfile = useStore(s => s.updateProfile);

  const [form, setForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    city: currentUser?.city || '',
    categories: currentUser?.categories || [],
    avatar: currentUser?.avatar || '',
  });

  const [showCities, setShowCities] = useState(false);

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const handleSave = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert('Ошибка', 'Имя и фамилия обязательны');
      return;
    }
    if (!form.city) {
      Alert.alert('Ошибка', 'Выберите город');
      return;
    }
    if (form.categories.length === 0) {
      Alert.alert('Ошибка', 'Выберите минимум 1 категорию');
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
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Личные данные</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* First name */}
        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          value={form.firstName}
          onChangeText={v => setForm(f => ({ ...f, firstName: v }))}
          placeholder="Ваше имя"
          placeholderTextColor={COLORS.textTertiary}
        />

        {/* Last name */}
        <Text style={styles.label}>Фамилия</Text>
        <TextInput
          style={styles.input}
          value={form.lastName}
          onChangeText={v => setForm(f => ({ ...f, lastName: v }))}
          placeholder="Ваша фамилия"
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
          onPress={() => setShowCities(!showCities)}
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

        {/* Categories */}
        <Text style={styles.label}>Категории</Text>
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

        {/* Avatar URL */}
        <Text style={styles.label}>Ссылка на аватар</Text>
        <TextInput
          style={styles.input}
          value={form.avatar}
          onChangeText={v => setForm(f => ({ ...f, avatar: v }))}
          placeholder="https://..."
          placeholderTextColor={COLORS.textTertiary}
          autoCapitalize="none"
          keyboardType="url"
        />

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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  chip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  chipText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd,
    height: SIZES.buttonHeight, justifyContent: 'center', alignItems: 'center',
    marginTop: SIZES.xl,
  },
  saveBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
});
