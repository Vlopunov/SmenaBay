// «Новая смена» — screen 25, presented modally. Pay comes first, on the sky
// of the hour the shift starts: it is the one decision that makes a shift
// fill. The marker on the slider is the market reference — the median of
// similar shifts in the store. Then the rows, tasks and requirements, the
// «Срочно» switch. The payout total and the button are pinned to the
// bottom, so the employer sees the sum before publishing, not after.
import React, { useMemo, useState } from 'react';
import {
  View, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform, Text as RNText, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import {
  Press, Chip, Button, Card, Divider, Stepper, Switch, Material,
} from '../../design/ui';
import Slider from '../../design/Slider';
import Sheet from '../../design/Sheet';
import { SkyView, skyByHour } from '../../design/Sky';
import { Pictogram, CategoryTile } from '../../design/category';
import { rublesLabel } from '../../design/Money';
import { useTheme, displayFont } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import {
  money, plural, isoDay, dayLabel, shortDate, longDate,
} from '../../design/format';
import { SHIFT_TEMPLATES } from '../../data/mockData';
import PhoneSheet from '../../components/PhoneSheet';
import useStore from '../../store/useStore';

// `kind` — the category pictogram (design/category.js).
export const CATEGORIES = [
  { key: 'pvz', label: 'ПВЗ, выдача заказов', short: 'ПВЗ', kind: 'pvz' },
  { key: 'warehouse', label: 'Склад, комплектация', short: 'Склад', kind: 'sklad' },
  { key: 'courier', label: 'Курьер, доставка', short: 'Курьер', kind: 'kuryer' },
  { key: 'horeca', label: 'Общепит, кухня, зал', short: 'Общепит', kind: 'obshchepit' },
  { key: 'retail', label: 'Магазин, продажи', short: 'Магазин', kind: 'riteyl' },
  { key: 'promo', label: 'Промо, дегустации', short: 'Промо', kind: 'riteyl' },
  { key: 'cleaning', label: 'Уборка, клининг', short: 'Клининг', kind: 'klining' },
  { key: 'construction', label: 'Стройка, монтаж', short: 'Стройка', kind: 'proizvodstvo' },
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
  { key: 'smartphoneRequired', label: 'Смартфон' },
  { key: 'adult', label: '18+' },
  { key: 'medicalBookRequired', label: 'Медкнижка' },
  { key: 'ownClothes', label: 'Своя одежда' },
];

const MAX_TASKS = 300;
const PAY_MIN = 45;
const PAY_MAX = 140;

const IN_CITY = {
  'Минск': 'в Минске', 'Гомель': 'в Гомеле', 'Гродно': 'в Гродно', 'Брест': 'в Бресте', 'Могилёв': 'в Могилёве', 'Витебск': 'в Витебске',
};

/**
 * Market reference: the median pay of similar shifts in the store (same
 * first word of the title), in the chosen address's city when there are enough.
 */
function marketFor({ id, title, locationId }, shifts, cityByLoc) {
  const key = (title || '').trim().split(/\s+/)[0]?.toLowerCase();
  if (!key) return null;
  const similar = shifts.filter((s) => s.id !== id && s.status !== 'cancelled' && s.title.toLowerCase().startsWith(key));
  const city = cityByLoc[locationId];
  const local = city ? similar.filter((s) => cityByLoc[s.locationId] === city) : [];
  const pool = local.length >= 2 ? local : similar;
  if (pool.length < 2) return null;
  const pays = pool.map((s) => s.pay).sort((a, b) => a - b);
  return { min: pays[0], median: pays[Math.floor(pays.length / 2)], where: local.length >= 2 ? IN_CITY[city] || null : null };
}

/** 'пт, 11 сентября' · 'Сегодня, 11 сентября' */
function dateLong(d) {
  const l = dayLabel(d);
  return l === 'Сегодня' || l === 'Завтра' ? `${l}, ${longDate(d)}` : `${shortDate(d).split(',')[0]}, ${longDate(d)}`;
}
function dateChip(d) {
  const l = dayLabel(d);
  return l === 'Сегодня' || l === 'Завтра' ? l : shortDate(d);
}

/** The rising line of the mockup's market hint. */
function Trend({ size = 13, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 18 10 11l3.5 3.5L20 7" />
    </Svg>
  );
}

/** A form row: label column 92 (80 on SE) · value · chevron. */
function Line({ label, value, valueC = 'ink', sub, error, onPress, chevron, right, compact, children, pad, a11y }) {
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 11 : 12, paddingHorizontal: compact ? 13 : 14, paddingVertical: pad ?? (compact ? 10 : 11), minHeight: 44 }}>
      <T v="body" c="ink2" style={{ width: compact ? 80 : 92, fontSize: compact ? 13.5 : 14.5, lineHeight: 19 }}>{label}</T>
      <View style={{ flex: 1, minWidth: 0 }}>
        {children}
        {value != null ? <T v="body" c={valueC} weight="500" style={{ fontSize: compact ? 14.5 : 15.5, lineHeight: 20 }}>{value}</T> : null}
        {sub ? <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>{sub}</T> : null}
        {error ? <T v="caption" c="error" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>{error}</T> : null}
      </View>
      {right}
      {chevron ? <Icon name="chevron.right" size={13} c="ink2" weight="semibold" style={{ opacity: 0.6 }} /> : null}
    </View>
  );
  if (!onPress) return content;
  return <Press feedback="highlight" onPress={onPress} accessibilityLabel={a11y || `${label}: ${value || ''}`}>{content}</Press>;
}

export default function CreateShiftScreen({ navigation, route }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  // iPhone SE: gutters 16, money.hero 44 → 38, a one-line market hint.
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const createShift = useStore((s) => s.createShift);
  const editShift = useStore((s) => s.editShift);
  const duplicateShift = useStore((s) => s.duplicateShift);
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
  const [panelH, setPanelH] = useState(130 + insets.bottom);

  const duration = hoursBetween(timeStart, timeEnd);
  const location = locations.find((l) => l.id === locationId);
  const cityByLoc = useMemo(() => {
    const m = {};
    companies.forEach((co) => (co.locations || []).forEach((l) => { m[l.id] = l.city; }));
    locations.forEach((l) => { m[l.id] = l.city; });
    return m;
  }, [companies, locations]);
  const market = useMemo(
    () => marketFor({ id: editing?.id, title, locationId }, shifts, cityByLoc),
    [title, locationId, shifts, cityByLoc, editing?.id],
  );

  // «Ещё»: fill the form like one of the recent shifts (store.duplicateShift).
  const recent = useMemo(() => {
    if (editing || !me) return [];
    const seen = new Set();
    return shifts
      .filter((s) => s.companyId === me.id)
      .sort((a, b) => (b.date + b.timeStart).localeCompare(a.date + a.timeStart))
      .map((s) => ({ id: s.id, label: `${s.title} · ${s.pay} BYN · ${s.timeStart}–${s.timeEnd}` }))
      .filter((x) => (seen.has(x.label) ? false : seen.add(x.label)))
      .slice(0, 5);
  }, [shifts, me, editing]);

  const dateOptions = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return isoDay(d); });
  const clearErr = (k) => { if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined })); };

  const fillFrom = (id) => {
    const tpl = duplicateShift(id);
    if (!tpl) return;
    haptic.selection();
    setPay(tpl.pay || 65);
    setTitle(tpl.title || '');
    setCategory(tpl.category || guessCategory(tpl.title) || null);
    setTimeStart(tpl.timeStart || '10:00');
    setTimeEnd(tpl.timeEnd || '18:00');
    setSpots(tpl.spotsTotal || 1);
    if (tpl.locationId && locations.some((l) => l.id === tpl.locationId)) setLocationId(tpl.locationId);
    setDescription(tpl.description || '');
    setUrgent(!!tpl.urgent);
    const r = tpl.requirements || {};
    setReq({ ...r, adult: r.minAge === 18 });
    setOther(r.other || '');
    setErrors({});
  };
  const more = () => showActions({
    title: 'Заполнить как в прошлой смене',
    options: recent.map((x) => ({ label: x.label, onPress: () => fillFrom(x.id) })),
  });

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

  const close = () => setSheet(null);
  const sky = t.sky(skyByHour(parseInt(timeStart, 10)));
  const cat = CATEGORIES.find((x) => x.key === category);
  const copies = editing ? 1 : dates.length;
  const seatsN = spots * copies;
  const total = pay * seatsN;
  const hero = compact ? 38 : 44;
  const durText = `${String(Math.round(duration * 10) / 10).replace('.', ',')} ч`;
  const overnight = timeEnd <= timeStart;
  const timeSub = [overnight ? 'через полночь' : null, duration > 12 ? 'длинная смена' : null].filter(Boolean).join(' · ');
  const datesValue = !dates.length ? 'Выбрать'
    : dates.length <= 3 ? dates.map(dateLong).join('\n')
      : `${dates.slice(0, 2).map(dateLong).join('\n')}\nи ещё ${dates.length - 2}`;
  const cta = editing ? 'Сохранить изменения' : dates.length > 1 ? `Опубликовать ${dates.length} ${plural(dates.length, ['смену', 'смены', 'смен'])}` : 'Опубликовать смену';
  const sheetInput = { height: 50, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, fontSize: 17, color: c.ink };
  const headerText = { fontSize: compact ? 15 : 16, lineHeight: 20 };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: G, paddingTop: Platform.OS === 'ios' ? (compact ? 12 : 14) : insets.top + 10, paddingBottom: 4, minHeight: 44 }}>
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Press onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Отмена">
            <T v="bodyStrong" c="ink2" style={headerText}>Отмена</T>
          </Press>
        </View>
        <T v="rowTitle" style={{ fontSize: compact ? 16 : 17, lineHeight: 21 }} numberOfLines={1} accessibilityRole="header">{editing ? 'Изменить смену' : 'Новая смена'}</T>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {recent.length ? (
            <Press onPress={more} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityLabel="Ещё: заполнить как в прошлой смене">
              <T v="bodyStrong" c="ink2" style={headerText}>Ещё</T>
            </Press>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{ paddingHorizontal: G, paddingTop: compact ? 10 : 14, paddingBottom: panelH + 16 }}
        >
          {/* Pay — first and largest, on the sky of the start hour */}
          <SkyView sky={sky} radius={compact ? 18 : 20} style={{ paddingTop: compact ? 12 : 14, paddingHorizontal: compact ? 14 : 16, paddingBottom: compact ? 14 : 16 }}>
            <T v="caption" c={sky.ink2} weight="600" style={{ fontSize: compact ? 11.5 : 12.5, lineHeight: 15 }}>Оплата за смену</T>
            <View style={{ marginTop: compact ? 5 : 6, flexDirection: 'row', alignItems: 'baseline', gap: compact ? 8 : 9, flexWrap: 'wrap' }}>
              <T v="moneyHero" c={sky.ink} style={{ fontSize: hero, lineHeight: hero + 4, letterSpacing: -hero * 0.02 }} accessibilityLabel={rublesLabel(pay)}>
                {money(pay)}
                <RNText style={[displayFont('700'), { fontSize: hero / 2, color: sky.ink2, letterSpacing: 0 }]}>{' BYN'}</RNText>
              </T>
              <T v="bodyStrong" c={sky.ink2} style={{ fontSize: compact ? 13 : 14, lineHeight: 17 }}>{`≈${Math.round(pay / duration)} BYN/ч`}</T>
            </View>
            <View style={{ marginTop: compact ? 5 : 7 }}>
              <Slider
                min={PAY_MIN}
                max={PAY_MAX}
                step={5}
                value={Math.min(PAY_MAX, Math.max(PAY_MIN, pay))}
                onChange={setPay}
                thumb={compact ? 24 : 26}
                track={c.onSky}
                marker={market && market.median >= PAY_MIN && market.median <= PAY_MAX ? { value: market.median } : undefined}
                accessibilityLabel="Оплата за смену"
                formatValue={(v) => `${v} BYN`}
              />
            </View>
            <View style={{ marginTop: -3, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!compact ? <Trend size={13} color={sky.ink2} /> : null}
              <T v="caption" c={sky.ink2} weight="500" style={{ flex: 1, fontSize: compact ? 11.5 : 12, lineHeight: 16 }}>
                {market
                  ? `Похожие смены${!compact && market.where ? ` ${market.where}` : ''} чаще платят ${market.median} BYN`
                  : compact ? 'Сумму увидят в ленте первой' : 'Сумма — первое, что исполнители увидят в ленте'}
              </T>
            </View>
          </SkyView>

          {/* The rows */}
          <Card radius={compact ? 16 : 18} style={{ marginTop: compact ? 10 : 14 }}>
            {/* Clip on an inner layer so the pressed-row wash keeps the corners and the card keeps its shadow. */}
            <View style={{ borderRadius: compact ? 16 : 18, overflow: 'hidden' }}>
              <Line
                compact={compact}
                label="Должность"
                value={title || 'Выбрать'}
                valueC={title ? 'ink' : errors.title ? 'error' : 'disabled'}
                error={errors.title}
                onPress={() => setSheet('title')}
              />
              <Divider inset={compact ? 13 : 14} />
              <Line compact={compact} label="Категория" onPress={() => setSheet('category')} chevron a11y={`Категория: ${cat?.label || 'не выбрана'}`}>
                {cat ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
                      <Pictogram kind={cat.kind} size={16} />
                    </View>
                    <T v="body" weight="500" style={{ flex: 1, fontSize: compact ? 14.5 : 15.5, lineHeight: 20 }} numberOfLines={1}>{cat.short}</T>
                  </View>
                ) : <T v="body" c="disabled" weight="500" style={{ fontSize: compact ? 14.5 : 15.5, lineHeight: 20 }}>Выбрать</T>}
              </Line>
              <Divider inset={compact ? 13 : 14} />
              <Line
                compact={compact}
                label={dates.length > 1 ? 'Даты' : 'Дата'}
                value={datesValue}
                valueC={dates.length ? 'ink' : 'disabled'}
                sub={dates.length > 1 ? `${dates.length} ${plural(dates.length, ['смена', 'смены', 'смен'])} с одинаковыми условиями` : undefined}
                error={errors.date}
                onPress={() => setSheet('date')}
                chevron
              />
              <Divider inset={compact ? 13 : 14} />
              <Line
                compact={compact}
                label="Время"
                value={`${timeStart} – ${timeEnd}`}
                sub={timeSub || undefined}
                onPress={() => setSheet('time')}
                right={<T v="caption" c="ink2" style={{ fontSize: compact ? 12 : 13 }}>{durText}</T>}
                a11y={`Время: с ${timeStart} до ${timeEnd}, ${durText}`}
              />
              <Divider inset={compact ? 13 : 14} />
              <Line compact={compact} label="Мест" pad={compact ? 8 : 9}>
                <View style={{ alignItems: 'flex-end' }}>
                  <Stepper value={spots} min={1} max={20} onChange={(v) => { haptic.selection(); setSpots(v); }} />
                </View>
              </Line>
              <Divider inset={compact ? 13 : 14} />
              <Line
                compact={compact}
                label="Адрес"
                value={location?.address || 'Выбрать'}
                valueC={location ? 'ink' : errors.address ? 'error' : 'disabled'}
                sub={location?.name}
                error={errors.address}
                onPress={() => setSheet('address')}
                chevron
              />
            </View>
          </Card>

          {/* Tasks and requirements */}
          <Card radius={compact ? 16 : 18} style={{ marginTop: compact ? 10 : 12, paddingVertical: compact ? 11 : 12, paddingHorizontal: compact ? 13 : 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <T v="caption" c="ink2" weight="600" style={{ fontSize: compact ? 11.5 : 12.5, lineHeight: 15 }}>Задачи</T>
              <T v="caption" c={description.length > MAX_TASKS ? 'error' : 'ink2'} style={{ fontSize: 11.5, lineHeight: 15 }}>{`${description.length} / ${MAX_TASKS}`}</T>
            </View>
            <TextInput
              value={description}
              onChangeText={(v) => { setDescription(v); clearErr('description'); }}
              placeholder="Что нужно делать, с кем работать, где вход"
              placeholderTextColor={c.inkDisabled}
              multiline
              maxLength={MAX_TASKS}
              scrollEnabled={false}
              style={{ marginTop: 6, minHeight: 60, padding: 0, paddingTop: 0, fontSize: compact ? 14 : 14.5, lineHeight: 20, color: c.ink, textAlignVertical: 'top' }}
              accessibilityLabel="Задачи на смене"
            />
            {errors.description ? <T v="caption" c="error" style={{ marginTop: 4, fontSize: 12.5, lineHeight: 16 }}>{errors.description}</T> : null}
            <View style={{ marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.line }}>
              <T v="caption" c="ink2" weight="600" style={{ fontSize: compact ? 11.5 : 12.5, lineHeight: 15 }}>Требования</T>
              <View style={{ marginTop: compact ? 7 : 8, flexDirection: 'row', flexWrap: 'wrap', gap: compact ? 5 : 6 }}>
                {REQS.map((r) => (
                  <Chip key={r.key} label={r.label} tone="soft" size={compact ? 'sm' : 'md'} selected={!!req[r.key]} onPress={() => { haptic.selection(); setReq((x) => ({ ...x, [r.key]: !x[r.key] })); }} />
                ))}
                <Chip label={other || 'Своё'} icon={other ? undefined : 'plus'} tone="soft" size={compact ? 'sm' : 'md'} selected={!!other} onPress={() => setSheet('other')} />
              </View>
            </View>
          </Card>

          {/* Urgent */}
          <Card radius={compact ? 16 : 18} style={{ marginTop: compact ? 10 : 12, paddingVertical: 12, paddingHorizontal: compact ? 13 : 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="bolt.fill" size={14} c="urgent" />
                <T v="bodyStrong" style={{ fontSize: compact ? 14.5 : 15.5, lineHeight: 20 }}>Отметить «Срочно»</T>
              </View>
              <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 12.5, lineHeight: 17 }}>Смена попадёт во вкладку «Срочные» и получит метку</T>
            </View>
            <Switch value={urgent} onValueChange={(v) => { haptic.selection(); setUrgent(v); }} accessibilityLabel="Отметить «Срочно»" />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Total and the action, pinned to the bottom */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}>
        <Material style={{ paddingTop: compact ? 9 : 12, paddingHorizontal: G, paddingBottom: Math.max(insets.bottom - 4, 12) }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: compact ? 8 : 10 }}
            accessible
            accessibilityLabel={`К выплате исполнителям ${rublesLabel(total)} за ${seatsN} ${plural(seatsN, ['место', 'места', 'мест'])}`}
          >
            <T v="bodyStrong" c="ink2" weight="500" style={{ fontSize: compact ? 13 : 14, lineHeight: 18, flexShrink: 1 }} numberOfLines={1}>
              {copies > 1 ? `К выплате за ${copies} ${plural(copies, ['смену', 'смены', 'смен'])}` : 'К выплате исполнителям'}
            </T>
            <T v="moneyCard" style={{ fontSize: compact ? 20 : 22, lineHeight: 25, letterSpacing: 0 }}>
              {money(total)}
              <RNText style={[displayFont('700'), { fontSize: compact ? 13 : 14, color: c.ink2, letterSpacing: 0 }]}>{' BYN'}</RNText>
            </T>
          </View>
          <Button
            title={cta}
            onPress={submit}
            style={compact ? { minHeight: 50, borderRadius: 16 } : null}
            textStyle={compact ? { fontSize: 16.5 } : null}
          />
        </Material>
      </View>

      {/* ── Pickers ─────────────────────────────────────────── */}
      <Sheet visible={sheet === 'title'} onClose={close} title="Должность">
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <TextInput
            value={title}
            onChangeText={(v) => { setTitle(v); if (!category) setCategory(guessCategory(v)); clearErr('title'); }}
            placeholder="Например, оператор ПВЗ"
            placeholderTextColor={c.inkDisabled}
            autoFocus
            style={sheetInput}
            returnKeyType="done"
            onSubmitEditing={close}
            accessibilityLabel="Должность"
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 14 }}>
            {SHIFT_TEMPLATES.map((tpl) => (
              <Chip key={tpl} label={tpl} tone="soft" selected={title === tpl} onPress={() => { haptic.selection(); setTitle(tpl); setCategory(guessCategory(tpl)); clearErr('title'); close(); }} />
            ))}
          </View>
          <Button title="Готово" style={{ marginTop: 18 }} onPress={close} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'category'} onClose={close} title="Категория">
        <View style={{ paddingTop: 6 }}>
          {CATEGORIES.map((x, i) => (
            <View key={x.key}>
              <Press
                feedback="highlight"
                onPress={() => { haptic.selection(); setCategory(x.key); close(); }}
                accessibilityState={{ selected: category === x.key }}
                accessibilityLabel={x.label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 9, minHeight: 52 }}
              >
                <CategoryTile kind={x.kind} size={34} />
                <T v="body" style={{ flex: 1, fontSize: 16, lineHeight: 21 }}>{x.label}</T>
                {category === x.key ? <Icon name="checkmark" size={15} c="brand" weight="semibold" /> : null}
              </Press>
              {i < CATEGORIES.length - 1 ? <Divider inset={66} /> : null}
            </View>
          ))}
        </View>
      </Sheet>

      <Sheet visible={sheet === 'date'} onClose={close} title={editing ? 'Дата' : 'Даты'}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {!editing ? <T v="caption" c="ink2" style={{ marginBottom: 12, fontSize: 13.5, lineHeight: 19 }}>Можно выбрать несколько дней — опубликуем по смене на каждый.</T> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {dateOptions.map((d) => (
              <Chip
                key={d}
                label={dateChip(d)}
                tone="soft"
                selected={dates.includes(d)}
                onPress={() => {
                  haptic.selection();
                  clearErr('date');
                  if (editing) { setDates([d]); return; }
                  setDates((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d].sort()));
                }}
              />
            ))}
          </View>
          <Button title="Готово" style={{ marginTop: 18 }} disabled={!dates.length} onPress={close} />
        </View>
      </Sheet>

      <Sheet visible={sheet === 'time'} onClose={close} title="Время">
        <View style={{ paddingTop: 8 }}>
          <T v="caption" c="ink2" weight="600" style={{ paddingHorizontal: 20, fontSize: 12.5 }}>Начало</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{ x: Math.max(0, TIMES.indexOf(timeStart) * 70 - 40), y: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
            {TIMES.map((x) => <Chip key={`s${x}`} label={x} tone="soft" selected={timeStart === x} onPress={() => { haptic.selection(); setTimeStart(x); }} />)}
          </ScrollView>
          <T v="caption" c="ink2" weight="600" style={{ paddingHorizontal: 20, paddingTop: 8, fontSize: 12.5 }}>Конец</T>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentOffset={{ x: Math.max(0, TIMES.indexOf(timeEnd) * 70 - 40), y: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 10 }}>
            {TIMES.map((x) => <Chip key={`e${x}`} label={x} tone="soft" selected={timeEnd === x} onPress={() => { haptic.selection(); setTimeEnd(x); }} />)}
          </ScrollView>
          <T v="bodyStrong" c="ink2" style={{ paddingHorizontal: 20, paddingTop: 6 }}>{`${timeStart} – ${timeEnd} · ${durText}${overnight ? ' · через полночь' : ''}`}</T>
          <View style={{ paddingHorizontal: 20 }}><Button title="Готово" style={{ marginTop: 16 }} onPress={close} /></View>
        </View>
      </Sheet>

      <Sheet visible={sheet === 'address'} onClose={close} title="Адрес">
        <View style={{ paddingTop: 6 }}>
          {locations.map((l) => (
            <View key={l.id}>
              <Press
                feedback="highlight"
                onPress={() => { haptic.selection(); setLocationId(l.id); clearErr('address'); close(); }}
                accessibilityState={{ selected: locationId === l.id }}
                accessibilityLabel={`${l.address}${l.name ? `, ${l.name}` : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12, minHeight: 52 }}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="body" weight="500" style={{ fontSize: 16, lineHeight: 21 }}>{l.address}</T>
                  {l.name ? <T v="caption" c="ink2" style={{ marginTop: 1 }}>{l.name}</T> : null}
                </View>
                {locationId === l.id ? <Icon name="checkmark" size={15} c="brand" weight="semibold" /> : null}
              </Press>
              <Divider inset={20} />
            </View>
          ))}
          <Press
            feedback="highlight"
            onPress={() => { close(); navigation.navigate('Locations'); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, minHeight: 50 }}
          >
            <Icon name="plus" size={15} c="brand" weight="semibold" />
            <T v="bodyStrong" c="brand" style={{ fontSize: 16 }}>{locations.length ? 'Добавить адрес' : 'Добавить первый адрес'}</T>
          </Press>
        </View>
      </Sheet>

      <Sheet visible={sheet === 'other'} onClose={close} title="Своё требование">
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <TextInput
            value={other}
            onChangeText={setOther}
            placeholder="Например, закрытая обувь"
            placeholderTextColor={c.inkDisabled}
            autoFocus
            maxLength={60}
            style={sheetInput}
            returnKeyType="done"
            onSubmitEditing={close}
            accessibilityLabel="Своё требование"
          />
          <Button title="Готово" style={{ marginTop: 14 }} onPress={close} />
        </View>
      </Sheet>

      <PhoneSheet
        visible={verify}
        onClose={() => setVerify(false)}
        navigation={navigation}
        title="Подтверди номер"
        text="Смены публикуются только с подтверждённым номером — так исполнители знают, что за сменой стоит живой человек."
        social={false}
        intent={{ type: 'verify-phone' }}
      />
    </View>
  );
}
