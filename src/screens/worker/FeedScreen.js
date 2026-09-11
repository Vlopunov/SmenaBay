// «Смены» — screens 1 and 2. The list and the map are one space: the list
// fades out over 200 ms onto a map that is already standing under it, and
// the selected shift survives the switch. On the map a pin shows the sum;
// swiping the preview cards moves the map, picking a pin moves the cards.
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { View, SectionList, FlatList, RefreshControl, useWindowDimensions, Share } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import {
  Press, LargeTitle, SectionTitle, SearchField, Segmented, Chip, CircleButton, EmptyState, SkeletonCard,
} from '../../design/ui';
import { FeedCard, MapPreviewCard } from '../../design/ShiftCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { plural, daySection, isoDay } from '../../design/format';
import FiltersSheet from '../../components/FiltersSheet';
import ShiftsMap from '../../components/ShiftsMap';
import { openReportMenu } from '../../components/ReportMenu';
import useStore from '../../store/useStore';
import { EMPTY_FILTERS, passes, activeFilterCount, conditions, visibleShifts, isFull } from './shiftFilters';

const smena = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;

export default function FeedScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const { width: winW } = useWindowDimensions();
  const reduced = useReducedMotion();
  const compact = winW < 380;
  const gutter = compact ? 16 : 20;

  const currentUser = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const applications = useStore((s) => s.applications);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const unread = useStore((s) => (s.currentUser ? s.getUnreadCount() : 0));
  const getLocationById = useStore((s) => s.getLocationById);
  const refresh = useStore((s) => s.initializeFromFirestore);
  const toggleSavedShift = useStore((s) => s.toggleSavedShift);
  const isSavedShift = useStore((s) => s.isSavedShift);

  const [view, setView] = useState('list');
  const [mapMounted, setMapMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sheet, setSheet] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef(null);
  const pagerRef = useRef(null);

  const city = currentUser?.city || 'Минск';
  const companyOf = useMemo(() => Object.fromEntries(companies.map((co) => [co.id, co])), [companies]);
  const mineOf = useMemo(() => {
    if (!currentUser) return {};
    const out = {};
    applications.forEach((a) => {
      if (a.workerId !== currentUser.id) return;
      if (a.status === 'pending') out[a.shiftId] = { state: 'pending', at: a.appliedAt };
      if (a.status === 'approved') out[a.shiftId] = { state: 'confirmed', at: a.respondedAt };
    });
    return out;
  }, [applications, currentUser]);

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

  const open = (id) => { setSelectedId(id); navigation.navigate('ShiftDetail', { shiftId: id }); };

  // Quick tabs and the sheet share one state: the tab is a shortcut.
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

  // ── List ⇄ map: the list fades over the mounted map ──────────
  const listO = useSharedValue(1);
  const listStyle = useAnimatedStyle(() => ({ opacity: listO.value }));
  const switchView = (v) => {
    if (v === view) return;
    haptic.selection();
    if (v === 'map') setMapMounted(true);
    setView(v);
    listO.value = withTiming(v === 'map' ? 0 : 1, { duration: 200 });
    if (v === 'list' && selectedId) {
      setTimeout(() => {
        const si = sections.findIndex((sec) => sec.data.some((x) => x.id === selectedId));
        if (si < 0) return;
        const ii = sections[si].data.findIndex((x) => x.id === selectedId);
        listRef.current?.scrollToLocation({ sectionIndex: si, itemIndex: ii, viewPosition: 0.4, animated: false });
      }, 40);
    }
  };

  // Long press: the context menu — save, share, report / block.
  const onLongPress = (s) => {
    haptic.light();
    const saved = currentUser && isSavedShift(s.id);
    const extra = [
      currentUser ? { label: saved ? 'Убрать из сохранённых' : 'Сохранить', onPress: () => { toggleSavedShift(s.id); toast.success(saved ? 'Убрано из сохранённых' : 'Сохранено'); } } : null,
      { label: 'Поделиться', onPress: () => Share.share({ message: `${s.title} · ${s.pay} BYN · ${s.company?.companyName || ''} — com.smenabay.app://shift/${s.id}` }) },
    ].filter(Boolean);
    openReportMenu({ targetType: 'shift', targetId: s.id, targetName: s.title, blockUserId: s.companyId, extra, store: useStore.getState() });
  };

  // ── Empty states: a number and a next step ───────────────────
  const renderEmpty = () => {
    if (!pool.length && !shifts.length) {
      return <View style={{ paddingHorizontal: gutter, gap: gutter === 16 ? 8 : 10, marginTop: 18 }}>{[0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)}</View>;
    }
    if (query.trim()) {
      return <EmptyState icon="magnifyingglass" title={`По запросу «${query.trim()}» ничего`} text="Попробуй короче — например, «Оператор» или название компании." action="Очистить поиск" onAction={() => setQuery('')} />;
    }
    if (activeFilterCount(filters) > 0) {
      const best = conditions(filters)
        .map((cond) => ({ ...cond, n: searched.filter((s) => passes(s, cond.without)).length }))
        .sort((a, b) => b.n - a.n)[0];
      if (best && best.n > 0) {
        return <EmptyState icon="line.3.horizontal.decrease" title="Под фильтры не подошла ни одна" text={`Если убрать «${best.label}», появится ${smena(best.n)}.`} action="Убрать это условие" onAction={() => { haptic.selection(); setFilters(best.without); }} />;
      }
      return <EmptyState icon="line.3.horizontal.decrease" title="Под фильтры не подошла ни одна" text="Попробуй сбросить фильтры." action="Сбросить фильтры" onAction={() => setFilters(EMPTY_FILTERS)} />;
    }
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    const tomorrow = pool.filter((s) => s.date === isoDay(tm) && !s.full).length;
    return (
      <EmptyState
        title="Сегодня смен нет"
        text={tomorrow ? `Новые появляются утром. На завтра в городе уже ${smena(tomorrow)}.` : 'Новые появляются утром — загляни позже.'}
        action={tomorrow ? 'Смотреть завтра' : undefined}
        onAction={() => setFilters({ ...EMPTY_FILTERS, when: ['tomorrow'] })}
      />
    );
  };

  const switcher = (glass) => (
    <Segmented
      glass={glass}
      items={[{ key: 'list', icon: 'list.bullet', label: 'Список' }, { key: 'map', icon: 'map', label: 'Карта' }]}
      value={view}
      onChange={switchView}
    />
  );

  const header = (
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter }}>
      <LargeTitle
        title="Смены"
        subtitle={`${city} · ${smena(pool.length)}`}
        right={(
          <>
            {currentUser ? <CircleButton icon="bell" badge={unread} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Уведомления" /> : null}
            {switcher(false)}
          </>
        )}
      />
      <SearchField value={query} onChangeText={setQuery} placeholder="Должность или компания" style={{ marginTop: 14 }} />
      <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Chip label="Все" selected={tab === 'all'} onPress={() => setTab('all')} />
        <Chip label="Срочные" selected={tab === 'urgent'} onPress={() => setTab('urgent')} />
        <Chip label="Без опыта" selected={tab === 'noexp'} onPress={() => setTab('noexp')} />
        <Press onPress={() => setSheet(true)} hitSlop={8} outerStyle={{ marginLeft: 'auto' }} accessibilityLabel={`Фильтры${extraCount ? `, выбрано ${extraCount}` : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Icon name="line.3.horizontal.decrease" size={16} c="brand" weight="semibold" />
          <T v="bodyStrong" c="brand" style={{ fontSize: 13.5 }}>{extraCount ? `Фильтры · ${extraCount}` : 'Фильтры'}</T>
        </Press>
      </View>
    </View>
  );

  // ── Map preview pager ────────────────────────────────────────
  const cardW = winW - 28;
  const mapList = results;
  useEffect(() => {
    if (view !== 'map' || !selectedId) return;
    const i = mapList.findIndex((s) => s.id === selectedId);
    if (i >= 0) pagerRef.current?.scrollToIndex({ index: i, animated: !reduced });
  }, [selectedId, view]);
  useEffect(() => {
    if (view === 'map' && !selectedId && mapList[0]) setSelectedId(mapList[0].id);
  }, [view]);

  const rise = useSharedValue(0);
  useEffect(() => {
    if (view === 'map') { rise.value = 0; rise.value = reduced ? withTiming(1, { duration: 200 }) : withSpring(1, t.motion.default); }
  }, [view]);
  const riseStyle = useAnimatedStyle(() => ({ opacity: rise.value, transform: reduced ? [] : [{ translateY: (1 - rise.value) * 24 }] }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {mapMounted ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents={view === 'map' ? 'auto' : 'none'}>
          <ShiftsMap shifts={mapList} selectedId={selectedId} onSelect={(id) => { haptic.selection(); setSelectedId(id); }} />
          <View style={{ position: 'absolute', top: insets.top + 6, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} pointerEvents="box-none">
            <View style={[{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 15, backgroundColor: c.material }, t.sh.e1]}>
              <T v="bodyStrong" display weight="700" style={{ fontSize: 15 }}>{city} · {smena(mapList.length)}</T>
            </View>
            {switcher(true)}
          </View>
          {mapList.length ? (
            <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: tabSpace - 6 }, riseStyle]}>
              <FlatList
                ref={pagerRef}
                data={mapList}
                horizontal
                keyExtractor={(s) => s.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardW + 8}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
                getItemLayout={(_, index) => ({ length: cardW + 8, offset: (cardW + 8) * index, index })}
                onScrollToIndexFailed={() => {}}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / (cardW + 8));
                  const s = mapList[i];
                  if (s && s.id !== selectedId) { haptic.selection(); setSelectedId(s.id); }
                }}
                renderItem={({ item }) => (
                  <View style={{ width: cardW }}>
                    <MapPreviewCard shift={item} company={item.company} onPress={() => open(item.id)} />
                  </View>
                )}
              />
            </Animated.View>
          ) : null}
        </View>
      ) : null}

      <Animated.View style={[{ flex: 1, backgroundColor: c.bg }, listStyle]} pointerEvents={view === 'list' ? 'auto' : 'none'}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.ink2} />}
          renderSectionHeader={({ section }) => (
            <SectionTitle
              title={section.title}
              right={smena(section.data.length)}
              style={{ paddingHorizontal: gutter, marginTop: section.day === sections[0]?.day ? 18 : 16, marginBottom: 10 }}
            />
          )}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: gutter, paddingBottom: compact ? 8 : 10 }}>
              <FeedCard
                shift={item}
                company={item.company}
                location={item.location}
                mine={mineOf[item.id]?.state}
                appliedAt={mineOf[item.id]?.at}
                onPress={() => open(item.id)}
                onLongPress={() => onLongPress(item)}
              />
            </View>
          )}
        />
      </Animated.View>
      <FiltersSheet visible={sheet} onClose={() => setSheet(false)} value={filters} onApply={setFilters} pool={searched} />
    </View>
  );
}
