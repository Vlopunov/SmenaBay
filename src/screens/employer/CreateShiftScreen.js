// New shift (handoff screen 10). The form starts with PAY, not the job title:
// it is the one field that decides whether the shift fills. Then the ledger —
// position, category, date, time, seats, address — then requirements as
// chips. The bottom panel states the payout before «Опубликовать».
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Switch, TextInput, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, LedgerRow, Separator, Chip, Button, RoundButton, SectionHeader } from '../../design/ui';
import FormRow from '../../design/FormRow';
import Slider from '../../design/Slider';
import Sheet from '../../design/Sheet';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { money, plural, isoDay, dayLabel, shortDate } from '../../design/format';
import { SHIFT_TEMPLATES } from '../../data/mockData';
import PhoneSheet from '../../components/PhoneSheet';
import useStore from '../../store/useStore';

export const CATEGORIES = [
  { key: 'pvz', label: 'ПВЗ, выдача заказов', symbol: 'shippingbox' },
  { key: 'warehouse', label: 'Склад, комплектация', symbol: 'tray.2' },
  { key: 'courier', label: 'Курьер, доставка', symbol: 'bicycle' },
  { key: 'horeca', label: 'Общепит, кухня, зал', symbol: 'fork.knife' },
  { key: 'retail', label: 'Магазин, продажи', symbol: 'bag' },
  { key: 'promo', label: 'Промо, дегустации', symbol: 'megaphone' },
  { key: 'cleaning', label: 'Уборка, клининг', symbol: 'sparkles' },
  { key: 'construction', label: 'Стройка, монтаж', symbol: 'hammer' },
];

function guessCategory(title = '') {
  const t = title.toLowerCase();
  if (/пвз|выдач/.test(t)) return 'pvz';
  if (/склад|грузчик|комплект|сборщик|погрузчик/.test(t)) return 'warehouse';
  if (/курьер|достав/.test(t)) return 'courier';
  if (/повар|официант|бармен|кухн/.test(t)) return 'horeca';
  if (/продав|кассир|консультант/.test(t)) return 'retail';
  if (/промо/.test(t)) return 'promo';
  if (/уборщ|клининг/.test(t)) return 'cleaning';
  if (/строй|монтаж|разнорабоч/.test(t)) return 'construction';
  return null;
}

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);
const hoursBetween = (a, b) => {
  const [ah, am] = a.split(':').map(Number); const [bh, bm] = b.split(':').map(Number);
  let d = bh * 60 + bm - (ah * 60 + am); if (d <= 0) d += 24 * 60; return d / 60;
};

const REQS = [
  { key: 'noExperienceOk', label: 'Без опыта' },
  { key: 'smartphoneRequired', label: 'Свой смартфон' },
  { key: 'medicalBookRequired', label: 'Медкнижка' },
  { key: 'ownClothes', label: 'Своя одежда' },
  { key: 'adult', label: '18+' },
];

function Stepper({ value, onChange, min = 1, max = 20 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <RoundButton icon="minus" variant="fill" size={32} iconSize={14} onPress={() => { if (value > min) { haptic.selection(); onChange(value - 1); } }} accessibilityLabel="Меньше мест" />
      <RoundButton icon="plus" variant="fill" size={32} iconSize={14} onPress={() => { if (value < max) { haptic.selection(); onChange(value + 1); } }} accessibilityLabel="Больше мест" />
    </View>
  );
}

export default function CreateShiftScreen({ navigation, route }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const createShift = useStore((s) => s.createShift);
  const editShift = useStore((s) => s.editShift);
  const editing = useStore((s) => (route?.params?.editShiftId ? s.getShiftById(route.params.editShiftId) : null));
  const template = route?.params?.template;
  const base = editing || template || {};
  const locations = me?.locations || [];

  const [pay, setPay] = useState(base.pay || 65);
  const [title, setTitle] = useState(base.title || '');
  const [category, setCategory] = useState(base.category || guessCategory(base.title) || null);
  const [dates, setDates] = useState(editing ? [editing.date] : [isoDay()]);
  const [timeStart, setTimeStart] = useState(base.timeStart || '10:00');
  const [timeEnd, setTimeEnd] = useState(base.timeEnd || '18:00');
  const [spots, setSpots] = useState(base.spotsTotal || 1);
  const [locationId, setLocationId] = useState(base.locationId || locations[0]?.id || null);
  const [description, setDescription] = useState(base.description || '');
  const [urgent, setUrgent] = useState(!!base.urgent);
  const [req, setReq] = useState(() => {
    const r = base.requirements || { noExperienceOk: true };
    return { ...r, adult: r.minAge === 18 };
  });
  const [other, setOther] = useState(base.requirements?.other || '');
  const [sheet, setSheet] = useState(null); // 'title' | 'category' | 'date' | 'time' | 'address' | 'other'
  const [errors, setErrors] = useState({});
  const [verify, setVerify] = useState(false);

  const duration = hoursBetween(timeStart, timeEnd);
  const location = locations.find((l) => l.id === locationId);
  const market = useMemo(() => {
    const key = (title || '').split(' ')[0].toLowerCase();
    if (!key) return null;
    const similar = shifts.filter((s) => s.id !== editing?.id && s.title.toLowerCase().startsWith(key) && s.status !== 'cancelled');
    if (similar.length < 2) return null;
    const pays = similar.map((s) => s.pay).sort((a, b) => a - b);
    return { min: pays[0], median: pays[Math.floor(pays.length / 2)] };
  }, [title, shifts]);

  const dateOptions = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return isoDay(d); });
  const dateLabel = (d) => { const l = dayLabel(d); return l === 'Сегодня' || l === 'Завтра' ? `${l}, ${shortDate(d)}` : shortDate(d); };

  const submit = () => {
    const e = {};
    if (!title.trim()) e.title = 'Какая работа';
    if (!locationId) e.address = 'Где смена';
    if (description.trim().length < 20) e.description = 'Хотя бы пару предложений — минимум 20 символов';
    if (!dates.length) e.date = 'Выбери день';
    setErrors(e);
    if (Object.keys(e).length) { haptic.error(); return; }

    const requirements = {
      noExperienceOk: !!req.noExperienceOk,
      smartphoneRequired: !!req.smartphoneRequired,
      medicalBookRequired: !!req.medicalBookRequired,
      ownClothes: !!req.ownClothes,
      minAge: req.adult ? 18 : null,
      other: other.trim() || null,
    };
    const data = { title: title.trim(), category, description: description.trim(), locationId, timeStart, timeEnd, pay, spotsTotal: spots, urgent, requirements };

    if (editing) {
      editShift(editing.id, { ...data, date: dates[0], durationHours: duration, payPerHour: +(pay / duration).toFixed(2) });
      haptic.success();
      navigation.goBack();
      return;
    }
    const r = createShift({ ...data, date: dates });
    if (r?.error === 'phone_not_verified') { setVerify(true); return; }
    if (r?.error === 'limit') {
      Alert.alert('Лимит на этот месяц исчерпан', 'Лимит текущего тарифа обновится первого числа следующего месяца.', [{ text: 'Понятно' }]);
      return;
    }
    haptic.success();
    navigation.goBack();
  };

  const chip = (label, on, onPress, key) => <Chip key={key || label} label={label} selected={on} onPress={() => { haptic.selection(); onPress(); }} tone="sheet" />;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 10, paddingBottom: 10 }}>
        <Press feedback="none" onPress={() => navigation.goBack()} hitSlop={10}><T v="body" c="accent" style={{ fontSize: 17 }}>Отмена</T></Press>
        <T v="rowTitle">{editing ? 'Изменить смену' : 'Новая смена'}</T>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 150 + insets.bottom }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
            <T v="caption" c="secondary">Оплата за смену</T>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <T v="moneyHero">{money(pay)}</T>
              <T v="rowTitle" c="secondary" style={{ fontSize: 19, letterSpacing: 0 }}>BYN</T>
              <T v="body" c="secondary" style={{ marginLeft: 4 }}>≈{Math.round(pay / duration)} BYN/ч</T>
            </View>
            {market ? (
              <View style={{ flexDirection: 'row', gap: 7, marginTop: 8 }}>
                <Icon name="chart.bar" size={13} c="secondary" style={{ marginTop: 2 }} />
                <T v="small" c="secondary" style={{ flex: 1 }}>
                  {`Похожие смены платят от ${market.min} BYN, чаще — ${market.median}.${pay < market.median ? ' С оплатой ниже обычной смена закрывается дольше.' : ''}`}
                </T>
              </View>
            ) : null}
            <Slider min={45} max={140} step={5} value={Math.min(140, Math.max(45, pay))} onChange={setPay} accessibilityLabel="Оплата за смену" formatValue={(v) => `${v} BYN`} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
              <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>45 BYN</T>
              <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>140 BYN</T>
            </View>
          </View>

          <Separator style={{ marginTop: 18 }} />
          <LedgerRow label="Должность" value={title || 'Выбрать'} valueC={title ? 'label' : 'tertiary'} onPress={() => setSheet('title')} chevron alignTop={false} />
          {errors.title ? <T v="small" c="destructive" style={{ paddingHorizontal: 22, marginTop: -6, marginBottom: 6, marginLeft: 120 }}>{errors.title}</T> : null}
          <Press feedback="highlight" onPress={() => setSheet('category')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 13, paddingBottom: 14 }}>
              <T v="caption" c="secondary" style={{ width: 84 }}>Категория</T>
              {category ? <Icon name={CATEGORIES.find((x) => x.key === category)?.symbol} size={15} c="label" /> : null}
              <T v="value" c={category ? 'label' : 'tertiary'} style={{ flex: 1 }}>{CATEGORIES.find((x) => x.key === category)?.label || 'Выбрать'}</T>
              <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" />
            </View>
          </Press>
          <Separator inset />
          <LedgerRow label={dates.length > 1 ? 'Даты' : 'Дата'} value={dates.length ? dates.map(dateLabel).join('\n') : 'Выбрать'} sub={dates.length > 1 ? `${dates.length} ${plural(dates.length, ['смена', 'смены', 'смен'])} с одинаковыми условиями` : undefined} onPress={() => setSheet('date')} chevron />
          <LedgerRow label="Время" value={`${timeStart}–${timeEnd}`} sub={`${duration} ${plural(Math.round(duration), ['час', 'часа', 'часов'])}${duration > 12 ? ' — длинная смена' : ''}`} onPress={() => setSheet('time')} chevron />
          <LedgerRow label="Мест" alignTop={false} value={String(spots)} right={<Stepper value={spots} onChange={setSpots} />} />
          <LedgerRow label="Адрес" value={location?.address || 'Выбрать'} valueC={location ? 'label' : errors.address ? 'destructive' : 'tertiary'} sub={location?.name} onPress={() => setSheet('address')} chevron last />

          <SectionHeader title="Задачи" />
          <View style={{ paddingHorizontal: 22, paddingVertical: 12 }}>
            <TextInput
              value={description}
              onChangeText={(v) => { setDescription(v); if (errors.description) setErrors((x) => ({ ...x, description: undefined })); }}
              placeholder="Что нужно делать, с кем работать, где вход"
              placeholderTextColor={c.labelTertiary}
              multiline
              style={{ minHeight: 88, borderRadius: 14, backgroundColor: c.fill, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, fontSize: 15, lineHeight: 21, color: c.label, textAlignVertical: 'top', borderWidth: errors.description ? 2 : 0, borderColor: c.destructive }}
              accessibilityLabel="Задачи на смене"
            />
            {errors.description ? <T v="small" c="destructive" style={{ marginTop: 6 }}>{errors.description}</T> : null}
          </View>

          <SectionHeader title="Требования" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
            {REQS.map((r) => <Chip key={r.key} label={r.label} selected={!!req[r.key]} onPress={() => { haptic.selection(); setReq((x) => ({ ...x, [r.key]: !x[r.key] })); }} />)}
            <Chip label={other ? other : 'Своё'} icon={other ? undefined : 'plus'} selected={!!other} onPress={() => setSheet('other')} />
          </View>

          <Separator />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14 }}>
            <View style={{ flex: 1 }}>
              <T v="value" style={{ fontSize: 16, lineHeight: 21 }}>Отметить как срочную</T>
              <T v="caption" c="secondary">Метка «Срочно» и вкладка «Срочные» в ленте исполнителей</T>
            </View>
            <Switch value={urgent} onValueChange={(v) => { haptic.selection(); setUrgent(v); }} trackColor={{ true: c.accent, false: c.fillSecondary }} ios_backgroundColor={c.fillSecondary} accessibilityLabel="Срочная смена" />
          </View>
          <Separator />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 10, backgroundColor: c.glassFallback, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.glassFallbackBorder }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 6, paddingBottom: 10 }}>
          <T v="caption" c="secondary">К выплате исполнителям</T>
          <T v="bodyStrong" style={{ fontSize: 16 }}>{money(pay * spots * (editing ? 1 : dates.length))} BYN за {spots * (editing ? 1 : dates.length)} {plural(spots * (editing ? 1 : dates.length), ['место', 'места', 'мест'])}</T>
        </View>
        <Button title={editing ? 'Сохранить изменения' : dates.length > 1 ? `Опубликовать ${dates.length} ${plural(dates.length, ['смену', 'смены', 'смен'])}` : 'Опубликовать'} onPress={submit} />
      </View>

      {/* ── Pickers ─────────────────────────────────────────── */}
      <Sheet visible={sheet === 'title'} onClose={() => setSheet(null)} title="Должность">
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); if (!category) setCategory(guessCategory(v)); }}
            placeholder="Например, оператор ПВЗ"
            placeholderTextColor={c.labelTertiary}
            autoFocus
            style={{ height: 54, borderRadius: 27, backgroundColor: c.fillSecondary, paddingHorizontal: 20, fontSize: 17, color: c.label }}
            returnKeyType="done"
            onSubmitEditing={() => setSheet(null)}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 14 }}>
            {SHIFT_TEMPLATES.map((t) => chip(t, title === t, () => { setTitle(t); setCategory(guessCategory(t)); setSheet(null); }))}
          </View>
          <Button title="Готово" style={{ marginTop: 18 }} onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'category'} onClose={() => setSheet(null)} title="Категория">
        <View style={{ paddingTop: 6 }}>
          {CATEGORIES.map((cat, i) => (
            <View key={cat.key}>
              <Press feedback="highlight" onPress={() => { haptic.selection(); setCategory(cat.key); setSheet(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14 }}>
                <Icon name={cat.symbol} size={18} c="label" />
                <T v="value" style={{ flex: 1, fontSize: 16 }}>{cat.label}</T>
                {category === cat.key ? <Icon name="checkmark" size={15} c="accent" weight="semibold" /> : null}
              </Press>
              {i < CATEGORIES.length - 1 ? <Separator inset /> : null}
            </View>
          ))}
        </View>
      </Sheet>

      <Sheet visible={sheet === 'date'} onClose={() => setSheet(null)} title={editing ? 'Дата' : 'Даты'}>
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          {!editing ? <T v="caption" c="secondary" style={{ marginBottom: 10 }}>Можно выбрать несколько дней — опубликуем по смене на каждый.</T> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {dateOptions.map((d) => chip(dateLabel(d), dates.includes(d), () => {
              if (editing) { setDates([d]); return; }
              setDates((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort()));
            }, d))}
          </View>
          <Button title="Готово" style={{ marginTop: 18 }} disabled={!dates.length} onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'time'} onClose={() => setSheet(null)} title="Время">
        <View style={{ paddingTop: 8 }}>
          <T v="section" c="secondary" style={{ paddingHorizontal: 22 }}>Начало</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 22, paddingVertical: 10 }}>
            {TIMES.map((t) => chip(t, timeStart === t, () => setTimeStart(t), `s${t}`))}
          </ScrollView>
          <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 8 }}>Конец</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 22, paddingVertical: 10 }}>
            {TIMES.map((t) => chip(t, timeEnd === t, () => setTimeEnd(t), `e${t}`))}
          </ScrollView>
          <T v="body" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 6 }}>{timeStart}–{timeEnd} · {duration} ч{hoursBetween(timeStart, timeEnd) && timeEnd <= timeStart ? ' · через полночь' : ''}</T>
          <View style={{ paddingHorizontal: 22 }}><Button title="Готово" style={{ marginTop: 16 }} onPress={() => setSheet(null)} /></View>
        </View>
      </Sheet>

      <Sheet visible={sheet === 'address'} onClose={() => setSheet(null)} title="Адрес">
        <View style={{ paddingTop: 6 }}>
          {locations.map((l, i) => (
            <View key={l.id}>
              <Press feedback="highlight" onPress={() => { haptic.selection(); setLocationId(l.id); setSheet(null); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 13 }}>
                <View style={{ flex: 1 }}>
                  <T v="value" style={{ fontSize: 16 }}>{l.address}</T>
                  {l.name ? <T v="caption" c="secondary">{l.name}</T> : null}
                </View>
                {locationId === l.id ? <Icon name="checkmark" size={15} c="accent" weight="semibold" /> : null}
              </Press>
              <Separator inset />
            </View>
          ))}
          <Press feedback="highlight" onPress={() => { setSheet(null); navigation.navigate('Locations'); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 14 }}>
            <Icon name="plus" size={15} c="accent" weight="semibold" />
            <T v="value" c="accent" style={{ fontSize: 16 }}>{locations.length ? 'Добавить адрес' : 'Добавить первый адрес'}</T>
          </Press>
        </View>
      </Sheet>

      <Sheet visible={sheet === 'other'} onClose={() => setSheet(null)} title="Своё требование">
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <TextInput
            value={other}
            onChangeText={setOther}
            placeholder="Например, закрытая обувь"
            placeholderTextColor={c.labelTertiary}
            autoFocus
            maxLength={60}
            style={{ height: 54, borderRadius: 27, backgroundColor: c.fillSecondary, paddingHorizontal: 20, fontSize: 17, color: c.label }}
            returnKeyType="done"
            onSubmitEditing={() => setSheet(null)}
          />
          <Button title="Готово" style={{ marginTop: 14 }} onPress={() => setSheet(null)} />
        </View>
      </Sheet>

      <PhoneSheet
        visible={verify}
        onClose={() => setVerify(false)}
        navigation={navigation}
        title="Подтверди номер"
        text="Смены публикуются только с подтверждённым номером — так исполнители знают, что за сменой стоит живой человек."
        note="Номер увидят исполнители, которых ты подтвердишь на смену."
        intent={{ type: 'verify-phone' }}
      />
    </View>
  );
}
