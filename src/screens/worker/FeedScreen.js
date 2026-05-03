import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  StatusBar, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FAMILIES } from '../../constants/theme';
import { Icon, MonoTag, Money, Pill, Chip, IconButton, LogoBlock } from '../../components/ui/Atoms';
import useStore from '../../store/useStore';

const CATEGORY_FILTERS = [
  { key: 'all',        label: 'Все',     icon: null },
  { key: 'pvz',        label: 'ПВЗ',     icon: 'box' },
  { key: 'horeca',     label: 'HoReCa',  icon: 'fork' },
  { key: 'warehouse',  label: 'Склад',   icon: 'truck' },
  { key: 'retail',     label: 'Ритейл',  icon: 'cart' },
  { key: 'cleaning',   label: 'Клининг', icon: 'broom' },
  { key: 'courier',    label: 'Курьер',  icon: 'bolt' },
];

const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

export default function FeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const getCompany = useCallback((id) => companies.find(c => c.id === id), [companies]);

  const filteredShifts = useMemo(() => {
    let result = shifts.filter(s => s.status === 'active');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const c = getCompany(s.companyId);
        return s.title.toLowerCase().includes(q) || c?.companyName?.toLowerCase().includes(q);
      });
    }
    if (categoryFilter !== 'all') {
      result = result.filter(s => {
        const t = s.title.toLowerCase();
        const bc = getCompany(s.companyId)?.businessCategory || '';
        switch (categoryFilter) {
          case 'pvz':       return t.includes('пвз') || bc === 'ПВЗ';
          case 'horeca':    return bc === 'HoReCa' || /бармен|официант|повар/.test(t);
          case 'warehouse': return bc === 'Склад/Логистика' || /склад|грузчик|комплектовщик/.test(t);
          case 'retail':    return bc === 'Ритейл' || /продавец|кассир/.test(t);
          case 'cleaning':  return bc === 'Клининг' || /уборщик|клининг/.test(t);
          case 'courier':   return /курьер|доставк/.test(t);
          default: return true;
        }
      });
    }
    return result.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [shifts, search, categoryFilter, getCompany]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  const formatDateLabel = (dateStr) => {
    if (dateStr === TODAY) return 'Сегодня';
    if (dateStr === TOMORROW) return 'Завтра';
    const d = new Date(dateStr);
    const m = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };

  const lettersOf = (name) => (name || '').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const [hero, ...rest] = filteredShifts;
  const dayName = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'][new Date().getDay()];

  const renderShift = ({ item }) => {
    const c = getCompany(item.companyId);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.row}
        onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.id })}
      >
        <View style={styles.rowTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.rowCompany}>
              <LogoBlock letters={lettersOf(c?.companyName)} size={28} radius={8} />
              <Text style={styles.companyName} numberOfLines={1}>{c?.companyName || 'Заказчик'}</Text>
            </View>
            <Text style={styles.shiftTitle} numberOfLines={2}>{item.title}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.payBig}>{item.pay}</Text>
            <Text style={styles.payUnit}>BYN · {(item.pay / (item.duration || 8)).toFixed(1)}/ч</Text>
          </View>
        </View>
        <View style={styles.rowMeta}>
          {item.urgent && <Pill bg={COLORS.live} color={COLORS.white}>Срочно</Pill>}
          {item.requirements?.noExperienceOk && <Pill bg={COLORS.paperSoft} color={COLORS.fg}>Без опыта</Pill>}
          <Pill border={COLORS.line} icon="clock">{item.startTime}–{item.endTime}</Pill>
          <Pill border={COLORS.line} icon="cal">{formatDateLabel(item.date)}</Pill>
          <Text style={styles.codeText}>SB·{item.id.slice(-4).toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const ListHeader = (
    <View>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topMono}>{dayName} · {currentUser?.city || 'Минск'}</Text>
          <Text style={styles.topGreeting}>Привет, {currentUser?.firstName || 'друг'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="search" onPress={() => setShowSearch(s => !s)} />
          <IconButton icon="bell" />
        </View>
      </View>

      {/* Display heading */}
      <View style={styles.heroBlock}>
        <Text style={styles.h1}>
          Смены{'\n'}<Text style={styles.serif}>на сегодня</Text>
        </Text>
        <View style={styles.h1Meta}>
          <Text style={styles.metaLabel}>В ЛЕНТЕ</Text>
          <Text style={styles.metaCount}>{filteredShifts.length}</Text>
          <Text style={styles.metaLabel}>· обновлено сейчас</Text>
        </View>
      </View>

      {/* Search input — appears when toggled */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <Icon name="search" size={18} color={COLORS.fgMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Поиск по названию, компании…"
            placeholderTextColor={COLORS.fgFaint}
            style={styles.searchInput}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="x" size={18} color={COLORS.fgMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Category chips */}
      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 22, gap: 8 }}
          data={CATEGORY_FILTERS}
          keyExtractor={(c) => c.key}
          renderItem={({ item }) => (
            <Chip active={categoryFilter === item.key} icon={item.icon} onPress={() => setCategoryFilter(item.key)}>
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* HERO card — first shift */}
      {hero && (
        <View style={{ paddingHorizontal: 18, paddingBottom: 14 }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ShiftDetail', { shiftId: hero.id })}
            style={styles.heroCard}
          >
            {/* Signal corner — yellow rounded triangle */}
            <View style={styles.signalCorner}>
              <Text style={styles.signalCornerLabel}>В ЧАС</Text>
              <Text style={styles.signalCornerValue}>{(hero.pay / (hero.duration || 8)).toFixed(1)}</Text>
              <Text style={styles.signalCornerUnit}>BYN/Ч</Text>
            </View>

            {hero.urgent && (
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>СРОЧНО · СЕГОДНЯ</Text>
              </View>
            )}

            <Text style={styles.heroTitle} numberOfLines={3}>{hero.title}</Text>
            <Text style={styles.heroSubtitle}>{getCompany(hero.companyId)?.companyName || 'Заказчик'}</Text>

            <View style={styles.heroPayRow}>
              <Money amount={String(hero.pay)} size={50} color={COLORS.signal} />
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.heroPayLabel}>ЗА СМЕНУ</Text>
                <Text style={styles.heroPayValue}>{hero.startTime}–{hero.endTime}</Text>
              </View>
            </View>

            <View style={styles.heroFooter}>
              <Text style={styles.heroCode}>SB·{hero.id.slice(-4).toUpperCase()}</Text>
              <View style={styles.heroArrow}>
                <Icon name="arrow" size={18} color={COLORS.ink} strokeWidth={2.2} />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Подобрано для тебя</Text>
        <Text style={styles.sectionMono}>СОРТ. ↓ СТАВКА</Text>
      </View>
    </View>
  );

  const EmptyComponent = (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Нет подходящих смен</Text>
      <Text style={styles.emptyText}>Попробуй сменить категорию или сбросить поиск</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        renderItem={renderShift}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={!hero ? EmptyComponent : null}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingHorizontal: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.ink} />}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 14 },
  topMono: { fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgMuted, letterSpacing: 1, textTransform: 'uppercase' },
  topGreeting: { fontFamily: FAMILIES.textSemi, fontSize: 14, color: COLORS.ink, marginTop: 2 },

  // Hero block
  heroBlock: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 18 },
  h1: { fontFamily: FAMILIES.display, fontSize: 42, lineHeight: 40, letterSpacing: -2, color: COLORS.ink },
  serif: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic', color: COLORS.fgFaint },
  h1Meta: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 },
  metaLabel: { fontFamily: FAMILIES.mono, fontSize: 11, color: COLORS.fgMuted, letterSpacing: 1, textTransform: 'uppercase' },
  metaCount: { fontFamily: FAMILIES.display, fontSize: 18, color: COLORS.ink, letterSpacing: -0.5 },

  // Search
  searchWrap: {
    marginHorizontal: 22, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.line,
    paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontFamily: FAMILIES.text, fontSize: 14, color: COLORS.ink, padding: 0 },

  // Chips
  chipsRow: { paddingBottom: 16 },

  // Hero card
  heroCard: {
    backgroundColor: COLORS.graphite, borderRadius: SIZES.radiusBlock,
    padding: 22, paddingTop: 20, position: 'relative', overflow: 'hidden',
  },
  signalCorner: {
    position: 'absolute', top: 0, right: 0, width: 110, height: 110,
    backgroundColor: COLORS.signal, borderBottomLeftRadius: 60,
    paddingTop: 16, paddingRight: 14, alignItems: 'flex-end', justifyContent: 'flex-start',
  },
  signalCornerLabel: { fontFamily: FAMILIES.mono, fontSize: 9, color: COLORS.signalDeep, letterSpacing: 1, textTransform: 'uppercase' },
  signalCornerValue: { fontFamily: FAMILIES.display, fontSize: 22, color: COLORS.ink, letterSpacing: -1, lineHeight: 22, marginTop: 2 },
  signalCornerUnit: { fontFamily: FAMILIES.mono, fontSize: 9, color: COLORS.signalDeep, letterSpacing: 0.8 },

  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: COLORS.live, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, maxWidth: 200,
  },
  liveDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: COLORS.white },
  livePillText: { fontFamily: FAMILIES.textBold, fontSize: 10, color: COLORS.white, letterSpacing: 0.5 },

  heroTitle: { fontFamily: FAMILIES.display, fontSize: 26, lineHeight: 28, letterSpacing: -1.2, color: COLORS.fgInv, marginTop: 14, maxWidth: '70%' },
  heroSubtitle: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.fgInvMuted, marginTop: 6 },

  heroPayRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 22 },
  heroPayLabel: { fontFamily: FAMILIES.mono, fontSize: 9.5, color: COLORS.fgInvMuted, letterSpacing: 1, textTransform: 'uppercase' },
  heroPayValue: { fontFamily: FAMILIES.textSemi, fontSize: 12, color: COLORS.fgInv, marginTop: 2 },

  heroFooter: {
    marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(244,241,234,0.12)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  heroCode: { fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgInvMuted, letterSpacing: 1 },
  heroArrow: { width: 36, height: 36, borderRadius: 999, backgroundColor: COLORS.signal, alignItems: 'center', justifyContent: 'center' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 8 },
  sectionTitle: { fontFamily: FAMILIES.display, fontSize: 18, color: COLORS.ink, letterSpacing: -0.6 },
  sectionMono: { fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgMuted, letterSpacing: 1 },

  // Row card
  row: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: 14, gap: 10, borderWidth: 1, borderColor: COLORS.lineSoft,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowCompany: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  companyName: { fontFamily: FAMILIES.textMed, fontSize: 12, color: COLORS.fgMuted, flex: 1 },
  shiftTitle: { fontFamily: FAMILIES.display, fontSize: 17, lineHeight: 20, letterSpacing: -0.6, color: COLORS.ink },
  payBig: { fontFamily: FAMILIES.display, fontSize: 24, color: COLORS.ink, letterSpacing: -1, lineHeight: 24 },
  payUnit: { fontFamily: FAMILIES.mono, fontSize: 9, color: COLORS.fgMuted, letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  codeText: { marginLeft: 'auto', fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgFaint, letterSpacing: 0.8 },

  empty: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyTitle: { fontFamily: FAMILIES.display, fontSize: 22, color: COLORS.ink, letterSpacing: -0.8 },
  emptyText: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.fgMuted, marginTop: 8, textAlign: 'center' },
});
