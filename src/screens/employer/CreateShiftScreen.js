import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { SHIFT_TEMPLATES } from '../../data/mockData';
import useStore from '../../store/useStore';

const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }
}

export default function CreateShiftScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const createShift = useStore(s => s.createShift);

  const template = route?.params?.template;

  const [form, setForm] = useState({
    title: template?.title || '',
    description: template?.description || '',
    locationId: template?.locationId || (currentUser?.locations?.[0]?.id || ''),
    date: '',
    timeStart: template?.timeStart || '09:00',
    timeEnd: template?.timeEnd || '18:00',
    pay: template?.pay?.toString() || '',
    spotsTotal: template?.spotsTotal || 1,
    urgent: template?.urgent || false,
    requirements: template?.requirements || {
      noExperienceOk: true, medicalBookRequired: false,
      smartphoneRequired: false, minAge: 18, ownClothes: false, other: null,
    },
  });

  const [errors, setErrors] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showTimeStart, setShowTimeStart] = useState(false);
  const [showTimeEnd, setShowTimeEnd] = useState(false);

  const locations = currentUser?.locations || [];
  const selectedLoc = locations.find(l => l.id === form.locationId);

  const duration = (() => {
    const [sh, sm] = form.timeStart.split(':').map(Number);
    const [eh, em] = form.timeEnd.split(':').map(Number);
    let d = (eh * 60 + em) - (sh * 60 + sm);
    if (d <= 0) d += 24 * 60;
    return d / 60;
  })();

  const payPerHour = form.pay ? (Number(form.pay) / duration).toFixed(1) : '0';

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Укажите название';
    if (form.description.length < 20) e.description = 'Минимум 20 символов';
    if (!form.locationId) e.locationId = 'Выберите локацию';
    if (!form.date) e.date = 'Выберите дату';
    if (!form.pay || Number(form.pay) <= 0) e.pay = 'Укажите оплату';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = () => {
    if (!validate()) return;
    const result = createShift({
      ...form,
      pay: Number(form.pay),
      spotsTotal: form.spotsTotal,
    });
    if (result.error === 'limit') {
      Alert.alert('Лимит исчерпан', 'Лимит бесплатного тарифа исчерпан. Обновите тариф для публикации новых смен.', [
        { text: 'Тарифы', onPress: () => navigation.navigate('Plans') },
        { text: 'OK' },
      ]);
      return;
    }
    navigation.goBack();
  };

  // Generate today + 14 days
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const formatDateOption = (d) => {
    const date = new Date(d);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0]; })();
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    if (d === today) return 'Сегодня';
    if (d === tomorrow) return 'Завтра';
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Создать смену</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={styles.label}>Название позиции *</Text>
        <TextInput
          style={[styles.input, errors.title && styles.inputError]}
          value={form.title}
          onChangeText={v => setForm(f => ({ ...f, title: v }))}
          placeholder="Оператор ПВЗ"
          placeholderTextColor={COLORS.textTertiary}
        />
        <TouchableOpacity onPress={() => setShowTemplates(!showTemplates)}>
          <Text style={styles.hint}>Выбрать из шаблонов</Text>
        </TouchableOpacity>
        {showTemplates && (
          <View style={styles.templatesRow}>
            {SHIFT_TEMPLATES.map(t => (
              <TouchableOpacity key={t} style={styles.templateChip}
                onPress={() => { setForm(f => ({ ...f, title: t })); setShowTemplates(false); }}
              >
                <Text style={styles.templateText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.title && <Text style={styles.error}>{errors.title}</Text>}

        {/* Description */}
        <Text style={styles.label}>Описание задач * (мин. 20 символов)</Text>
        <TextInput
          style={[styles.textarea, errors.description && styles.inputError]}
          value={form.description}
          onChangeText={v => setForm(f => ({ ...f, description: v }))}
          placeholder="Опишите, что нужно делать..."
          placeholderTextColor={COLORS.textTertiary}
          multiline numberOfLines={4} textAlignVertical="top"
        />
        <Text style={styles.charCount}>{form.description.length} символов</Text>
        {errors.description && <Text style={styles.error}>{errors.description}</Text>}

        {/* Location */}
        <Text style={styles.label}>Локация *</Text>
        <TouchableOpacity
          style={[styles.input, styles.selectInput, errors.locationId && styles.inputError]}
          onPress={() => setShowLocations(!showLocations)}
        >
          <Text style={selectedLoc ? styles.selectText : styles.selectPlaceholder}>
            {selectedLoc ? `${selectedLoc.name || selectedLoc.address}` : 'Выберите адрес'}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>
        {showLocations && (
          <View style={styles.dropdown}>
            {locations.map(loc => (
              <TouchableOpacity key={loc.id} style={styles.dropdownItem}
                onPress={() => { setForm(f => ({ ...f, locationId: loc.id })); setShowLocations(false); }}
              >
                <Text style={styles.dropdownText}>{loc.name || loc.address}</Text>
                <Text style={styles.dropdownSub}>{loc.address}</Text>
              </TouchableOpacity>
            ))}
            {locations.length === 0 && (
              <Text style={styles.dropdownEmpty}>Нет сохранённых адресов</Text>
            )}
          </View>
        )}

        {/* Date */}
        <Text style={styles.label}>Дата *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          <View style={styles.dateRow}>
            {dateOptions.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dateChip, form.date === d && styles.dateChipActive]}
                onPress={() => setForm(f => ({ ...f, date: d }))}
              >
                <Text style={[styles.dateChipText, form.date === d && styles.dateChipTextActive]}>
                  {formatDateOption(d)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {errors.date && <Text style={styles.error}>{errors.date}</Text>}

        {/* Time */}
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Начало</Text>
            <TouchableOpacity style={styles.input} onPress={() => { setShowTimeStart(!showTimeStart); setShowTimeEnd(false); }}>
              <Text style={styles.selectText}>{form.timeStart}</Text>
            </TouchableOpacity>
            {showTimeStart && (
              <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                {TIME_OPTIONS.map(t => (
                  <TouchableOpacity key={t} style={styles.timeItem}
                    onPress={() => { setForm(f => ({ ...f, timeStart: t })); setShowTimeStart(false); }}
                  >
                    <Text style={[styles.timeText, form.timeStart === t && { color: COLORS.accent, ...FONTS.medium }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Окончание</Text>
            <TouchableOpacity style={styles.input} onPress={() => { setShowTimeEnd(!showTimeEnd); setShowTimeStart(false); }}>
              <Text style={styles.selectText}>{form.timeEnd}</Text>
            </TouchableOpacity>
            {showTimeEnd && (
              <ScrollView style={styles.timeDropdown} nestedScrollEnabled>
                {TIME_OPTIONS.map(t => (
                  <TouchableOpacity key={t} style={styles.timeItem}
                    onPress={() => { setForm(f => ({ ...f, timeEnd: t })); setShowTimeEnd(false); }}
                  >
                    <Text style={[styles.timeText, form.timeEnd === t && { color: COLORS.accent, ...FONTS.medium }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
        <Text style={styles.durationText}>Длительность: {duration}ч</Text>

        {/* Pay */}
        <Text style={styles.label}>Оплата за смену (BYN) *</Text>
        <View style={styles.payRow}>
          <TextInput
            style={[styles.input, { flex: 1 }, errors.pay && styles.inputError]}
            value={form.pay}
            onChangeText={v => setForm(f => ({ ...f, pay: v.replace(/[^0-9.]/g, '') }))}
            placeholder="0"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
          />
          <Text style={styles.payHint}>≈ {payPerHour} BYN/ч</Text>
        </View>
        {errors.pay && <Text style={styles.error}>{errors.pay}</Text>}

        {/* Spots */}
        <Text style={styles.label}>Количество сотрудников</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => setForm(f => ({ ...f, spotsTotal: Math.max(1, f.spotsTotal - 1) }))}
          >
            <Ionicons name="remove" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{form.spotsTotal}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => setForm(f => ({ ...f, spotsTotal: Math.min(50, f.spotsTotal + 1) }))}
          >
            <Ionicons name="add" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Requirements */}
        <Text style={styles.label}>Требования</Text>
        <View style={styles.reqList}>
          {[
            ['noExperienceOk', 'Подходит без опыта'],
            ['medicalBookRequired', 'Медицинская книжка'],
            ['smartphoneRequired', 'Свой смартфон'],
            ['ownClothes', 'Своя спецодежда'],
          ].map(([key, label]) => (
            <View key={key} style={styles.reqRow}>
              <Text style={styles.reqLabel}>{label}</Text>
              <Switch
                value={form.requirements[key]}
                onValueChange={v => setForm(f => ({
                  ...f, requirements: { ...f.requirements, [key]: v },
                }))}
                trackColor={{ true: COLORS.accent }}
              />
            </View>
          ))}
        </View>

        {/* Urgent */}
        <View style={[styles.reqRow, styles.urgentRow]}>
          <View>
            <Text style={styles.reqLabel}>Срочная смена</Text>
            <Text style={styles.urgentHint}>Выделяется в ленте исполнителей</Text>
          </View>
          <Switch
            value={form.urgent}
            onValueChange={v => setForm(f => ({ ...f, urgent: v }))}
            trackColor={{ true: COLORS.error }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate} activeOpacity={0.7}>
          <Text style={styles.submitBtnText}>Опубликовать смену</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES['3xl'] },

  label: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary, marginTop: SIZES.base, marginBottom: SIZES.sm },
  input: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.base,
    height: SIZES.inputHeight, fontSize: SIZES.body, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center',
  },
  inputError: { borderColor: COLORS.error },
  selectInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  selectPlaceholder: { fontSize: SIZES.body, color: COLORS.textTertiary },
  error: { fontSize: SIZES.caption, color: COLORS.error, marginTop: SIZES.xs },
  hint: { fontSize: SIZES.caption, color: COLORS.accent, ...FONTS.medium, marginTop: SIZES.xs },

  textarea: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.base,
    minHeight: 100, fontSize: SIZES.body, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, textAlignVertical: 'top',
  },
  charCount: { fontSize: SIZES.caption, color: COLORS.textTertiary, textAlign: 'right', marginTop: SIZES.xs },

  templatesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.sm },
  templateChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.accentSoft },
  templateText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },

  dropdown: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, marginTop: SIZES.xs, ...SHADOWS.md, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  dropdownText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  dropdownSub: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: 2 },
  dropdownEmpty: { padding: SIZES.base, fontSize: SIZES.body, color: COLORS.textTertiary, textAlign: 'center' },

  dateScroll: { marginHorizontal: -SIZES.lg },
  dateRow: { flexDirection: 'row', gap: SIZES.sm, paddingHorizontal: SIZES.lg },
  dateChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  dateChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dateChipText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  dateChipTextActive: { color: COLORS.white },

  timeRow: { flexDirection: 'row', gap: SIZES.md },
  timeDropdown: { maxHeight: 150, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, marginTop: SIZES.xs, ...SHADOWS.md },
  timeItem: { paddingHorizontal: SIZES.base, paddingVertical: SIZES.sm },
  timeText: { fontSize: SIZES.body, color: COLORS.textPrimary },
  durationText: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: SIZES.xs },

  payRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  payHint: { fontSize: SIZES.small, color: COLORS.success, ...FONTS.medium },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.lg },
  counterBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  counterValue: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, minWidth: 30, textAlign: 'center' },

  reqList: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, overflow: 'hidden', ...SHADOWS.sm },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.base, paddingVertical: SIZES.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  reqLabel: { fontSize: SIZES.body, color: COLORS.textPrimary },
  urgentRow: { marginTop: SIZES.base, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.base, ...SHADOWS.sm },
  urgentHint: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: 2 },

  submitBtn: { backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight, justifyContent: 'center', alignItems: 'center', marginTop: SIZES['2xl'] },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
});
