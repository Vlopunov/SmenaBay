// «Смены» — the feed and the map are one space with a view switch in the
// header (handoff screens 1 and 5). A guest sees exactly this: no sign-up
// banner, no bell — there is nothing to show in it yet.
import React, { useMemo, useState, useRef } from 'react';
import { View, SectionList, TextInput, RefreshControl, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, RoundButton, TextTabs, SectionHeader, Separator, EmptyState, Glass } from '../../design/ui';
import ShiftRow, { FeedShiftRow } from '../../design/ShiftRow';
import { useTheme, SUPPORTS_GLASS } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { plural, daySection, isoDay, timeRange, hours, perHour } from '../../design/format';
import FiltersSheet from '../../components/FiltersSheet';
import ShiftsMap from '../../components/ShiftsMap';
import useStore from '../../store/useStore';
import { EMPTY_FILTERS, passes, activeFilterCount, conditions, visibleShifts, isFull } from './shiftFilters';

function ViewSwitch({ value, onChange }) {
  const { c, dark } = useTheme();
  const item = (key, icon, label) => {
    const on = value === key;
    return (
      <Press
        feedback="none"
        onPress={() => { if (!on) { haptic.selection(); onChange(key); } }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: on }}
        style={[{ width: 36, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
          on && { backgroundColor: dark ? c.fillSecondary : c.elevated, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }]}
      >
        <Icon name={icon} size={16} c={on ? 'label' : 'secondary'} weight="semibold" />
      </Press>
    );
  };
  return (
    <View style={{ height: 34, borderRadius: 17, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', padding: 2 }}>
      {item('list', 'list.bullet', 'Список')}
      {item('map', 'map', 'Карта')}
    </View>
  );
}

function SearchField({ value, onChange, placeholder = 'Должность или компания', height = 36, glass }) {
  const { c } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height, paddingHorizontal: 14 }}>
      <Icon name="magnifyingglass" size={15} c="tertiary" weight="medium" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.labelTertiary}
        returnKeyType="search"
        autoCorrect={false}
        clearButtonMode="while-editing"
        accessibilityLabel="Поиск смен"
        style={{ flex: 1, fontSize: 15, color: c.label, paddingVertical: 0 }}
      />
    </View>
  );
  if (glass) return <Glass radius={height / 2} style={{ flex: 1 }}>{body}</Glass>;
  return <View style={{ borderRadius: height / 2, backgroundColor: c.fill }}>{body}</View>;
}

export default function FeedScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { height: winH } = useWindowDimensions();

  const currentUser = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const unread = useStore((s) => (s.currentUser ? s.getUnreadCount() : 0));
  const getLocationById = useStore((s) => s.getLocationById);
  const refresh = useStore((s) => s.initializeFromFirestore);

  const [view, setView] = useState('list');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [inViewIds, setInViewIds] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef(null);

  const city = currentUser?.city || 'Минск';
  const companyOf = useMemo(() => Object.fromEntries(companies.map((co) => [co.id, co])), [companies]);

  // Everything a worker could see, enriched once.
  const pool = useMemo(() => visibleShifts(shifts, blockedUsers)
    .map((s) => ({ ...s, full: isFull(s), company: companyOf[s.companyId], location: getLocationById(s.locationId) })),
  [shifts, blockedUsers, companyOf]);

  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((s) => s.title.toLowerCase().includes(q) || s.company?.companyName?.toLowerCase().includes(q));
  }, [pool, query]);

  const results = useMemo(() => searched
    .filter((s) => passes(s, filters))
    .sort((a, b) => (a.date === b.date ? a.timeStart.localeCompare(b.timeStart) : a.date.localeCompare(b.date))),
  [searched, filters]);

  const sections = useMemo(() => {
    const byDay = new Map();
    results.forEach((s) => { if (!byDay.has(s.date)) byDay.set(s.date, []); byDay.get(s.date).push(s); });
    return [...byDay.entries()].map(([day, data]) => ({ day, title: daySection(day), data }));
  }, [results]);

  const today = isoDay();
  const todayCount = pool.filter((s) => s.date === today && !s.full).length;

  // Quick tabs and the sheet share one state: the tab is a shortcut, not a
  // second filter.
  const tab = filters.urgentOnly ? 'urgent' : filters.skills.includes('noExp') ? 'noexp' : 'all';
  const setTab = (k) => {
    haptic.selection();
    setFilters((f) => ({
      ...f,
      urgentOnly: k === 'urgent',
      skills: k === 'noexp' ? [...new Set([...f.skills, 'noExp'])] : f.skills.filter((x) => x !== 'noExp'),
    }));
  };
  const extraCount = activeFilterCount(filters) - (filters.urgentOnly ? 1 : 0) - (filters.skills.includes('noExp') ? 1 : 0);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  };

  const open = (id) => navigation.navigate('ShiftDetail', { shiftId: id });

  // Selection survives the view switch: back on the list, scroll to it.
  const switchView = (v) => {
    setView(v);
    if (v === 'list' && selectedId) {
      setTimeout(() => {
        const si = sections.findIndex((sec) => sec.data.some((x) => x.id === selectedId));
        if (si < 0) return;
        const ii = sections[si].data.findIndex((x) => x.id === selectedId);
        listRef.current?.scrollToLocation({ sectionIndex: si, itemIndex: ii, viewPosition: 0.4, animated: false });
      }, 50);
    }
  };

  // ── Empty states: name a number and a next step ─────────────
  const renderEmpty = () => {
    if (query.trim()) {
      return <EmptyState title={`По запросу «${query.trim()}» ничего`} text="Попробуй короче — например, «Оператор» или название компании." action="Очистить поиск" onAction={() => setQuery('')} />;
    }
    if (activeFilterCount(filters) > 0) {
      const best = conditions(filters)
        .map((cond) => ({ ...cond, n: searched.filter((s) => passes(s, cond.without)).length }))
        .sort((a, b) => b.n - a.n)[0];
      if (best && best.n > 0) {
        return <EmptyState title="Под фильтры не подошла ни одна" text={`Если убрать «${best.label}», появится ${best.n} ${plural(best.n, ['смена', 'смены', 'смен'])}.`} action="Убрать это условие" onAction={() => { haptic.selection(); setFilters(best.without); }} />;
      }
      return <EmptyState title="Под фильтры не подошла ни одна" text="Попробуй сбросить фильтры." action="Сбросить фильтры" onAction={() => setFilters(EMPTY_FILTERS)} />;
    }
    const t = new Date(); t.setDate(t.getDate() + 1);
    const tomorrow = pool.filter((s) => s.date === isoDay(t) && !s.full).length;
    return (
      <EmptyState
        title="Смен на сегодня нет"
        text={tomorrow ? `Завтра в городе уже ${tomorrow} ${plural(tomorrow, ['смена', 'смены', 'смен'])}.` : 'Новые смены появляются каждый день — загляни позже.'}
        action={tomorrow ? 'Смотреть завтра' : undefined}
        onAction={() => setFilters({ ...EMPTY_FILTERS, when: ['tomorrow'] })}
      />
    );
  };

  const header = (
    <View>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <T v="screenTitle" accessibilityRole="header">Смены</T>
          <T v="caption" c="secondary" style={{ marginTop: 2 }}>
            {city} · {todayCount} {plural(todayCount, ['смена', 'смены', 'смен'])} сегодня
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          {currentUser ? <RoundButton icon="bell" variant="fill" size={34} iconSize={16} badge={unread} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Уведомления" /> : null}
          <ViewSwitch value={view} onChange={switchView} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
        <SearchField value={query} onChange={setQuery} />
      </View>
      <TextTabs
        style={{ paddingTop: 17 }}
        items={[{ key: 'all', label: 'Все' }, { key: 'urgent', label: 'Срочные' }, { key: 'noexp', label: 'Без опыта' }]}
        value={tab}
        onChange={setTab}
        right={(
          <Press feedback="none" onPress={() => setSheet(true)} hitSlop={8} accessibilityLabel={`Фильтры${extraCount ? `, выбрано ${extraCount}` : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="line.3.horizontal.decrease" size={14} c="accent" weight="semibold" />
            <T v="body" c="accent">{extraCount ? `Фильтры · ${extraCount}` : 'Фильтры'}</T>
          </Press>
        )}
      />
      <Separator style={{ marginTop: 9 }} />
    </View>
  );

  if (view === 'map') {
    const visible = inViewIds ? results.filter((s) => inViewIds.includes(s.id)) : results;
    const panelMax = Math.round(winH * 0.36);
    return (
      <View style={{ flex: 1, backgroundColor: c.ledger }}>
        <ShiftsMap
          shifts={results}
          selectedId={selectedId}
          onSelect={(id) => { haptic.selection(); setSelectedId(id); }}
          onViewChange={setInViewIds}
        />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <SearchField value={query} onChange={setQuery} placeholder="Смены рядом" height={44} glass />
          <RoundButton icon="list.bullet" size={44} iconSize={18} onPress={() => { haptic.selection(); switchView('list'); }} accessibilityLabel="Список" />
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: tabSpace - 10 }}>
          <View style={{
            borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden',
            backgroundColor: SUPPORTS_GLASS ? c.sheet : c.glassFallback,
            borderWidth: StyleSheet.hairlineWidth * 2, borderColor: SUPPORTS_GLASS ? c.glassBorder : c.glassFallbackBorder,
            maxHeight: panelMax + 70,
          }}>
            <View style={{ alignItems: 'center', paddingTop: 8 }}>
              <View style={{ width: 36, height: 5, borderRadius: 2.5, backgroundColor: c.fillSecondary }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 12 }}>
              <T v="rowTitle" style={{ fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: -0.5 }}>
                {visible.length ? `${visible.length} ${plural(visible.length, ['смена', 'смены', 'смен'])} в кадре` : 'Здесь смен нет'}
              </T>
              <Press feedback="none" onPress={() => setSheet(true)} hitSlop={8}><T v="body" c="accent">{extraCount ? `Фильтры · ${extraCount}` : 'Фильтры'}</T></Press>
            </View>
            <Separator />
            <ScrollView style={{ maxHeight: panelMax }} contentContainerStyle={{ paddingBottom: 12 }}>
              {visible.length === 0 && results.length > 0 ? (
                <EmptyState title="Здесь смен нет" text="Сдвинь карту или посмотри все смены списком." action="Показать списком" onAction={() => switchView('list')} />
              ) : null}
              {visible.map((s, i) => (
                <ShiftRow
                  key={s.id}
                  amount={s.pay}
                  title={s.title}
                  urgent={s.urgent && !s.full}
                  line2={`${timeRange(s)} · ${hours(s.durationHours)}`}
                  line3={s.location?.address}
                  unavailable={s.full}
                  selected={s.id === selectedId}
                  last={i === visible.length - 1}
                  onPress={() => { if (s.id === selectedId) open(s.id); else { haptic.selection(); setSelectedId(s.id); } }}
                  accessibilityLabel={`${s.title}, ${s.pay} BYN, ${timeRange(s)}`}
                />
              ))}
            </ScrollView>
          </View>
        </View>
        <FiltersSheet visible={sheet} onClose={() => setSheet(false)} value={filters} onApply={setFilters} pool={searched} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onScrollToIndexFailed={() => {}}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.labelSecondary} />}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            top={section.day !== sections[0]?.day}
            title={section.title}
            right={`${section.data.length} ${plural(section.data.length, ['смена', 'смены', 'смен'])}`}
          />
        )}
        renderItem={({ item, index, section }) => (
          <FeedShiftRow
            shift={item}
            company={item.company}
            location={item.location}
            last={index === section.data.length - 1}
            onPress={() => { setSelectedId(item.id); open(item.id); }}
          />
        )}
      />
      <FiltersSheet visible={sheet} onClose={() => setSheet(false)} value={filters} onApply={setFilters} pool={searched} />
    </View>
  );
}
