import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Image, StatusBar, Alert, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { BADGE_INFO, WORKER_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';
import Avatar from '../../components/Avatar';
import { formatDate } from '../../utils/formatDate';

export default function WorkerDirectoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const workers = useStore(s => s.workers);
  const blockedUsers = useStore(s => s.blockedUsers);
  const currentUser = useStore(s => s.currentUser);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const isFavorite = useStore(s => s.isFavorite);
  const favorites = useStore(s => s.favorites);
  const shifts = useStore(s => s.shifts);
  const inviteWorkerToShift = useStore(s => s.inviteWorkerToShift);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Все');
  const [inviteWorkerId, setInviteWorkerId] = useState(null);

  const activeShifts = useMemo(
    () => shifts.filter(s => s.companyId === currentUser?.id && s.status === 'active'),
    [shifts, currentUser],
  );

  const filteredWorkers = useMemo(() => {
    // Blocked workers are hidden from the directory (Guideline 1.2).
    let result = workers.filter(w => !blockedUsers.includes(w.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(w =>
        `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
        w.city?.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'Все') {
      result = result.filter(w => w.categories?.includes(categoryFilter));
    }
    return result.sort((a, b) => b.rating - a.rating);
  }, [workers, search, categoryFilter, blockedUsers]);

  const handleInvite = (shiftId) => {
    const result = inviteWorkerToShift(inviteWorkerId, shiftId);
    setInviteWorkerId(null);
    if (result?.error === 'already_invited') {
      Alert.alert('', 'Приглашение уже отправлено');
    } else {
      Alert.alert('', 'Приглашение отправлено!');
    }
  };

  const CATEGORIES = ['Все', ...WORKER_CATEGORIES];

  const renderWorker = ({ item: worker }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: worker.id })}
    >
      <Avatar uri={worker.avatar} name={worker.firstName} name2={worker.lastName} size={48} />
      <View style={styles.workerInfo}>
        <Text style={styles.name} numberOfLines={1}>{worker.firstName} {worker.lastName}</Text>
        <View style={styles.metaRow}>
          {worker.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.metaText}>{worker.shiftsCompleted} смен</Text>
          {worker.city && <Text style={styles.metaText}>{worker.city}</Text>}
        </View>
        {worker.badges.length > 0 && (
          <View style={styles.badgesRow}>
            {worker.badges.slice(0, 3).map(b => {
              const info = BADGE_INFO[b];
              if (!info) return null;
              return (
                <View key={b} style={[styles.miniBadge, { backgroundColor: info.color + '14' }]}>
                  <Ionicons name={info.icon} size={10} color={info.color} />
                  <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.heartBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => toggleFavorite(worker.id)}
        >
          <Ionicons
            name={isFavorite(worker.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite(worker.id) ? COLORS.error : COLORS.textTertiary}
          />
        </TouchableOpacity>
        {activeShifts.length > 0 && (
          <TouchableOpacity
            style={styles.inviteBtn}
            onPress={() => setInviteWorkerId(worker.id)}
          >
            <Ionicons name="paper-plane-outline" size={14} color={COLORS.accent} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Исполнители</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по имени..."
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
      </View>

      {/* Category chips */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, categoryFilter === item && styles.chipActive]}
            onPress={() => setCategoryFilter(item)}
          >
            <Text style={[styles.chipText, categoryFilter === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.count}>{filteredWorkers.length} исполнителей</Text>

      <FlatList
        data={filteredWorkers}
        renderItem={renderWorker}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Никого не найдено</Text>
          </View>
        }
      />

      {/* Invite shift picker modal */}
      <Modal visible={!!inviteWorkerId} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setInviteWorkerId(null)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Выберите смену</Text>
            {activeShifts.map(shift => (
              <TouchableOpacity
                key={shift.id}
                style={styles.modalItem}
                onPress={() => handleInvite(shift.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemTitle}>{shift.title}</Text>
                  <Text style={styles.modalItemSub}>{formatDate(shift.date)}, {shift.timeStart}–{shift.timeEnd}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setInviteWorkerId(null)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.md, paddingBottom: SIZES.sm,
    backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },

  searchRow: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.sm, backgroundColor: COLORS.white },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.md, height: 44, ...SHADOWS.sm, gap: SIZES.sm,
  },
  searchInput: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary },

  chips: {
    paddingHorizontal: SIZES.lg, paddingTop: SIZES.sm, paddingBottom: SIZES.md, gap: SIZES.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  chip: {
    paddingHorizontal: SIZES.md, height: 32, justifyContent: 'center',
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  chipText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white },

  count: { fontSize: SIZES.caption, color: COLORS.textTertiary, paddingHorizontal: SIZES.lg, marginTop: SIZES.sm, marginBottom: SIZES.sm },

  list: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.tabBarHeight + SIZES.xl },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.skeleton },
  workerInfo: { flex: 1, marginLeft: SIZES.md },
  name: { fontSize: SIZES.body, ...FONTS.semibold, color: COLORS.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginTop: 3 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textPrimary },
  metaText: { fontSize: SIZES.small, color: COLORS.textSecondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: SIZES.xs },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 9, ...FONTS.medium },

  actions: { alignItems: 'center', gap: SIZES.sm },
  heartBtn: { padding: 4 },
  inviteBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
  },

  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl, padding: SIZES.lg, paddingBottom: SIZES['3xl'] },
  modalTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginBottom: SIZES.md },
  modalItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SIZES.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  modalItemTitle: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  modalItemSub: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  modalCancel: { marginTop: SIZES.lg, alignItems: 'center', paddingVertical: SIZES.md },
  modalCancelText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.textSecondary },
});
