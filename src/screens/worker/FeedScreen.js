import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const DATE_FILTERS = ['Все', 'Сегодня', 'Завтра', 'Эта неделя'];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Все категории', icon: 'apps-outline' },
  { key: 'pvz', label: 'ПВЗ', icon: 'cube-outline' },
  { key: 'horeca', label: 'HoReCa', icon: 'restaurant-outline' },
  { key: 'warehouse', label: 'Склад', icon: 'file-tray-stacked-outline' },
  { key: 'retail', label: 'Ритейл', icon: 'storefront-outline' },
  { key: 'cleaning', label: 'Клининг', icon: 'sparkles-outline' },
  { key: 'coffee', label: 'Кофейни', icon: 'cafe-outline' },
  { key: 'courier', label: 'Курьеры', icon: 'bicycle-outline' },
  { key: 'promo', label: 'Промо', icon: 'megaphone-outline' },
  { key: 'events', label: 'Ивенты', icon: 'musical-notes-outline' },
  { key: 'production', label: 'Производство', icon: 'construct-outline' },
];

export default function FeedScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);
  const getUnreadCount = useStore(s => s.getUnreadCount);
  const toggleSavedShift = useStore(s => s.toggleSavedShift);
  const savedShifts = useStore(s => s.savedShifts);
  const userSaved = savedShifts[currentUser?.id] || [];

  const [search, setSearch] = useState('');

  // Accept initial search from navigation params (e.g. "Find similar" from MyShifts)
  useEffect(() => {
    if (route?.params?.initialSearch) {
      setSearch(route.params.initialSearch);
    }
  }, [route?.params?.initialSearch]);
  const [dateFilter, setDateFilter] = useState('Все');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [payMin, setPayMin] = useState('');
  const [noExpOnly, setNoExpOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [noMedBook, setNoMedBook] = useState(false);

  const activeFilterCount = [
    categoryFilter !== 'all',
    !!payMin,
    noExpOnly,
    urgentOnly,
    noMedBook,
  ].filter(Boolean).length;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  const unreadCount = getUnreadCount();

  const filteredShifts = useMemo(() => {
    let result = shifts.filter(s => s.status === 'active');

    // City filter
    if (currentUser?.city) {
      result = result.filter(s => {
        const company = companies.find(c => c.id === s.companyId);
        return company?.city === currentUser.city;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => {
        const company = companies.find(c => c.id === s.companyId);
        return s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          company?.companyName.toLowerCase().includes(q);
      });
    }

    // Date filter
    if (dateFilter === 'Сегодня') result = result.filter(s => s.date === today);
    else if (dateFilter === 'Завтра') result = result.filter(s => s.date === tomorrow);
    else if (dateFilter === 'Эта неделя') {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekEndStr = weekEnd.toISOString().split('T')[0];
      result = result.filter(s => s.date >= today && s.date <= weekEndStr);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(s => {
        const title = s.title.toLowerCase();
        const bcat = companies.find(c => c.id === s.companyId)?.businessCategory || '';
        switch (categoryFilter) {
          case 'pvz': return title.includes('пвз') || bcat === 'ПВЗ';
          case 'horeca': return bcat === 'HoReCa' || title.includes('официант') || title.includes('повар') || title.includes('бармен');
          case 'warehouse': return bcat === 'Склад/Логистика' || title.includes('склад') || title.includes('грузчик') || title.includes('комплектовщик') || title.includes('сборщик');
          case 'retail': return bcat === 'Ритейл' || title.includes('продавец') || title.includes('кассир');
          case 'cleaning': return bcat === 'Клининг' || title.includes('уборщик') || title.includes('клининг');
          case 'coffee': return title.includes('бариста') || title.includes('кофейн') || title.includes('кофе');
          case 'courier': return title.includes('курьер') || title.includes('доставк');
          case 'promo': return title.includes('промоутер') || title.includes('промо') || title.includes('раздач');
          case 'events': return bcat === 'Ивенты' || title.includes('ивент') || title.includes('мероприят');
          case 'production': return bcat === 'Производство' || title.includes('производств') || title.includes('разнорабоч');
          default: return true;
        }
      });
    }

    // Advanced filters
    if (payMin && !isNaN(payMin)) result = result.filter(s => s.pay >= Number(payMin));
    if (noExpOnly) result = result.filter(s => s.requirements.noExperienceOk);
    if (urgentOnly) result = result.filter(s => s.urgent);
    if (noMedBook) result = result.filter(s => !s.requirements.medicalBookRequired);

    // Sort: urgent first, then by date
    return result.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [shifts, search, dateFilter, categoryFilter, payMin, noExpOnly, urgentOnly, noMedBook, currentUser, companies]);

  const getCompany = useCallback((id) => companies.find(c => c.id === id), [companies]);
  const getLocation = useCallback((companyId, locId) => {
    const company = companies.find(c => c.id === companyId);
    return company?.locations.find(l => l.id === locId);
  }, [companies]);

  const formatDate = (dateStr) => {
    if (dateStr === today) return 'Сегодня';
    if (dateStr === tomorrow) return 'Завтра';
    const d = new Date(dateStr);
    const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const renderShift = ({ item }) => {
    const company = getCompany(item.companyId);
    const location = getLocation(item.companyId, item.locationId);

    return (
      <TouchableOpacity
        style={styles.shiftCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.id })}
      >
        {item.urgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={12} color={COLORS.white} />
            <Text style={styles.urgentText}>Срочно</Text>
          </View>
        )}

        <View style={styles.shiftHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shiftTitle}>{item.title}</Text>
            <View style={styles.companyRow}>
              <Text style={styles.companyName}>{company?.companyName}</Text>
              {company?.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={COLORS.star} />
                  <Text style={styles.ratingText}>{company.rating}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.payBadge}>
            <View style={styles.payTopRow}>
              <Text style={styles.payAmount}>{item.pay}</Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => toggleSavedShift(item.id)}
              >
                <Ionicons
                  name={userSaved.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={userSaved.includes(item.id) ? COLORS.accent : COLORS.textTertiary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.payCurrency}>BYN</Text>
          </View>
        </View>

        <View style={styles.shiftDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.textTertiary} />
            <Text style={styles.detailText}>{formatDate(item.date)}, {item.timeStart}–{item.timeEnd}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={15} color={COLORS.textTertiary} />
            <Text style={styles.detailText} numberOfLines={1}>{location?.address || 'Адрес'}</Text>
          </View>
        </View>

        <View style={styles.shiftTags}>
          {item.requirements.noExperienceOk && (
            <View style={[styles.tag, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.tagText, { color: '#059669' }]}>Без опыта</Text>
            </View>
          )}
          {item.durationHours && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.durationHours}ч</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>~{item.payPerHour.toFixed(0)} BYN/ч</Text>
          </View>
          <View style={styles.spotsTag}>
            <Text style={styles.spotsText}>
              {item.spotsTotal - item.spotsTaken}/{item.spotsTotal} мест
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Смены</Text>
          <Text style={styles.city}>
            <Ionicons name="location" size={13} color={COLORS.accent} /> {currentUser?.city || 'Минск'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notifDot}>
              <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск смен..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, (showFilters || activeFilterCount > 0) && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={(showFilters || activeFilterCount > 0) ? COLORS.white : COLORS.accent} />
          {activeFilterCount > 0 && !showFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showFilters && (
        <View style={styles.advFilters}>
          {/* Category */}
          <Text style={[styles.advSectionTitle, { marginTop: 0 }]}>Категория</Text>
          <View style={styles.advChipsWrap}>
            {CATEGORY_FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.advCatChip, categoryFilter === f.key && styles.advCatChipActive]}
                onPress={() => setCategoryFilter(f.key)}
              >
                <Ionicons name={f.icon} size={14} color={categoryFilter === f.key ? COLORS.white : COLORS.textSecondary} />
                <Text style={[styles.advCatText, categoryFilter === f.key && styles.advCatTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pay */}
          <Text style={styles.advSectionTitle}>Оплата</Text>
          <View style={styles.advRow}>
            <Text style={styles.advLabel}>от</Text>
            <TextInput
              style={styles.advInput}
              value={payMin}
              onChangeText={setPayMin}
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="number-pad"
            />
            <Text style={styles.advUnit}>BYN</Text>
          </View>

          {/* Toggles */}
          <Text style={styles.advSectionTitle}>Условия</Text>
          <View style={styles.advChipsWrap}>
            <TouchableOpacity
              style={[styles.advToggle, noExpOnly && styles.advToggleActive]}
              onPress={() => setNoExpOnly(!noExpOnly)}
            >
              <Ionicons name="school-outline" size={14} color={noExpOnly ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.advToggleText, noExpOnly && styles.advToggleTextActive]}>Без опыта</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.advToggle, urgentOnly && styles.advToggleActive]}
              onPress={() => setUrgentOnly(!urgentOnly)}
            >
              <Ionicons name="flash-outline" size={14} color={urgentOnly ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.advToggleText, urgentOnly && styles.advToggleTextActive]}>Срочные</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.advToggle, noMedBook && styles.advToggleActive]}
              onPress={() => setNoMedBook(!noMedBook)}
            >
              <Ionicons name="medkit-outline" size={14} color={noMedBook ? COLORS.white : COLORS.textSecondary} />
              <Text style={[styles.advToggleText, noMedBook && styles.advToggleTextActive]}>Без медкнижки</Text>
            </TouchableOpacity>
          </View>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={styles.advReset}
              onPress={() => { setCategoryFilter('all'); setPayMin(''); setNoExpOnly(false); setUrgentOnly(false); setNoMedBook(false); }}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
              <Text style={styles.advResetText}>Сбросить фильтры</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Date Filters */}
      <FlatList
        data={DATE_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.quickChip, dateFilter === item && styles.quickChipActive]}
            onPress={() => setDateFilter(item)}
          >
            <Text style={[styles.quickChipText, dateFilter === item && styles.quickChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results count */}
      <Text style={styles.resultsCount}>{filteredShifts.length} смен найдено</Text>

      {/* Shifts List */}
      <FlatList
        data={filteredShifts}
        renderItem={renderShift}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Нет подходящих смен</Text>
            <Text style={styles.emptySubtitle}>Попробуйте изменить фильтры</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm,
  },
  greeting: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  city: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  notifBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm,
  },
  notifDot: {
    position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18,
    borderRadius: 9, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4, borderWidth: 1.5, borderColor: COLORS.white,
  },
  notifDotText: { fontSize: 10, ...FONTS.bold, color: COLORS.white },

  // Search
  searchRow: { flexDirection: 'row', paddingHorizontal: SIZES.lg, gap: SIZES.sm, marginTop: SIZES.sm },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, height: 44, ...SHADOWS.sm,
  },
  searchInput: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary, marginLeft: SIZES.sm, letterSpacing: 0 },
  filterBtn: {
    width: 44, height: 44, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.accent },
  filterBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { fontSize: 9, ...FONTS.bold, color: COLORS.white },

  // Advanced Filters
  advFilters: {
    marginHorizontal: SIZES.lg, marginTop: SIZES.sm, marginBottom: SIZES.xs,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.base, ...SHADOWS.md, zIndex: 10,
  },
  advSectionTitle: {
    fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SIZES.sm, marginTop: SIZES.sm,
  },
  advChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginBottom: SIZES.xs },
  advCatChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surface,
  },
  advCatChipActive: { backgroundColor: COLORS.accent },
  advCatText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  advCatTextActive: { color: COLORS.white },
  advRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.sm },
  advLabel: { fontSize: SIZES.small, color: COLORS.textSecondary },
  advInput: {
    width: 80, height: 36, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm, fontSize: SIZES.body, color: COLORS.textPrimary, textAlign: 'center',
  },
  advUnit: { fontSize: SIZES.small, color: COLORS.textSecondary },
  advToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
  },
  advToggleActive: { backgroundColor: COLORS.accent },
  advToggleText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  advToggleTextActive: { color: COLORS.white },
  advReset: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.xs,
    marginTop: SIZES.md, paddingVertical: SIZES.sm,
  },
  advResetText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.error },

  // Quick Filters
  quickFilters: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, gap: SIZES.sm, alignItems: 'center' },
  quickChip: {
    paddingHorizontal: SIZES.md, height: 34, justifyContent: 'center', borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  quickChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  quickChipText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  quickChipTextActive: { color: COLORS.white },

  resultsCount: {
    fontSize: SIZES.caption, color: COLORS.textTertiary, paddingHorizontal: SIZES.lg,
    marginBottom: SIZES.sm,
  },

  // Shift Card
  listContent: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.tabBarHeight + SIZES.xl },
  shiftCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base,
    marginBottom: SIZES.md, ...SHADOWS.sm,
  },
  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    backgroundColor: COLORS.error, paddingHorizontal: SIZES.sm, paddingVertical: 3,
    borderRadius: SIZES.radiusSm, marginBottom: SIZES.sm,
  },
  urgentText: { fontSize: 11, ...FONTS.semibold, color: COLORS.white },
  shiftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shiftTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginTop: 3 },
  companyName: { fontSize: SIZES.small, color: COLORS.textSecondary },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: SIZES.caption, ...FONTS.medium, color: COLORS.textSecondary },
  payBadge: { alignItems: 'flex-end' },
  payTopRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  payAmount: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.success },
  payCurrency: { fontSize: SIZES.caption, color: COLORS.textTertiary },
  shiftDetails: { marginTop: SIZES.md, gap: SIZES.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  detailText: { fontSize: SIZES.small, color: COLORS.textSecondary, flex: 1 },
  shiftTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: SIZES.md, gap: SIZES.sm },
  tag: {
    paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.surface,
  },
  tagText: { fontSize: 11, ...FONTS.medium, color: COLORS.textSecondary },
  spotsTag: {
    paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.accentSoft,
  },
  spotsText: { fontSize: 11, ...FONTS.medium, color: COLORS.accent },

  // Empty
  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
});
