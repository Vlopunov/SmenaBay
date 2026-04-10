import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const QUICK_FILTERS = ['Все', 'Сегодня', 'Завтра', 'ПВЗ', 'HoReCa', 'Склад', 'Высокая оплата'];

export default function FeedScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);
  const getUnreadCount = useStore(s => s.getUnreadCount);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Все');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [payMin, setPayMin] = useState('');
  const [noExpOnly, setNoExpOnly] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

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

    // Quick filters
    if (activeFilter === 'Сегодня') result = result.filter(s => s.date === today);
    else if (activeFilter === 'Завтра') result = result.filter(s => s.date === tomorrow);
    else if (activeFilter === 'ПВЗ') result = result.filter(s => s.title.toLowerCase().includes('пвз') || companies.find(c => c.id === s.companyId)?.businessCategory === 'ПВЗ');
    else if (activeFilter === 'HoReCa') result = result.filter(s => companies.find(c => c.id === s.companyId)?.businessCategory === 'HoReCa');
    else if (activeFilter === 'Склад') result = result.filter(s => s.title.toLowerCase().includes('склад') || s.title.toLowerCase().includes('грузчик') || s.title.toLowerCase().includes('комплектовщик') || s.title.toLowerCase().includes('сборщик'));
    else if (activeFilter === 'Высокая оплата') result = result.filter(s => s.pay >= 70);

    // Advanced filters
    if (payMin && !isNaN(payMin)) result = result.filter(s => s.pay >= Number(payMin));
    if (noExpOnly) result = result.filter(s => s.requirements.noExperienceOk);
    if (urgentOnly) result = result.filter(s => s.urgent);

    // Sort: urgent first, then by date
    return result.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(a.date) - new Date(b.date);
    });
  }, [shifts, search, activeFilter, payMin, noExpOnly, urgentOnly, currentUser]);

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
            <Text style={styles.payAmount}>{item.pay}</Text>
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
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={showFilters ? COLORS.white : COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showFilters && (
        <View style={styles.advFilters}>
          <View style={styles.advRow}>
            <Text style={styles.advLabel}>Оплата от</Text>
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
          <View style={styles.advRow}>
            <TouchableOpacity
              style={[styles.advToggle, noExpOnly && styles.advToggleActive]}
              onPress={() => setNoExpOnly(!noExpOnly)}
            >
              <Text style={[styles.advToggleText, noExpOnly && styles.advToggleTextActive]}>Без опыта</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.advToggle, urgentOnly && styles.advToggleActive]}
              onPress={() => setUrgentOnly(!urgentOnly)}
            >
              <Text style={[styles.advToggleText, urgentOnly && styles.advToggleTextActive]}>Срочные</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Filters */}
      <FlatList
        data={QUICK_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.quickChip, activeFilter === item && styles.quickChipActive]}
            onPress={() => setActiveFilter(item)}
          >
            <Text style={[styles.quickChipText, activeFilter === item && styles.quickChipTextActive]}>
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
  searchInput: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary, marginLeft: SIZES.sm },
  filterBtn: {
    width: 44, height: 44, borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: COLORS.accent },

  // Advanced Filters
  advFilters: {
    marginHorizontal: SIZES.lg, marginTop: SIZES.sm, backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd, padding: SIZES.md, ...SHADOWS.sm,
  },
  advRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.sm },
  advLabel: { fontSize: SIZES.small, color: COLORS.textSecondary, width: 70 },
  advInput: {
    width: 80, height: 36, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusSm,
    paddingHorizontal: SIZES.sm, fontSize: SIZES.body, color: COLORS.textPrimary, textAlign: 'center',
  },
  advUnit: { fontSize: SIZES.small, color: COLORS.textSecondary },
  advToggle: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
  },
  advToggleActive: { backgroundColor: COLORS.accent },
  advToggleText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  advToggleTextActive: { color: COLORS.white },

  // Quick Filters
  quickFilters: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, gap: SIZES.sm },
  quickChip: {
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull,
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
