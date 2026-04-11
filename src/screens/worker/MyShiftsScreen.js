import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const TABS = ['Активные', 'Завершённые', 'Отклонённые'];

const statusConfig = {
  pending: { label: 'Ожидает', bg: '#FEF3C7', color: '#D97706' },
  approved: { label: 'Подтверждена', bg: '#D1FAE5', color: '#059669' },
  in_progress: { label: 'В процессе', bg: '#DBEAFE', color: '#2563EB' },
  completed: { label: 'Завершена', bg: '#D1FAE5', color: '#059669' },
  rejected: { label: 'Отклонён', bg: '#FEE2E2', color: '#EF4444' },
  cancelled_by_worker: { label: 'Вы отменили', bg: '#F3F4F6', color: '#6B7280' },
  cancelled: { label: 'Отменена', bg: '#FEE2E2', color: '#EF4444' },
};

export default function MyShiftsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const applications = useStore(s => s.applications);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);
  const cancelApplication = useStore(s => s.cancelApplication);
  const getReviewForShift = useStore(s => s.getReviewForShift);
  const [tab, setTab] = useState(0);

  const myApps = useMemo(() =>
    applications.filter(a => a.workerId === currentUser?.id),
    [applications, currentUser]
  );

  const getShift = (id) => shifts.find(s => s.id === id);
  const getCompany = (id) => companies.find(c => c.id === id);

  const activeItems = useMemo(() =>
    myApps.filter(a =>
      ['pending', 'approved'].includes(a.status) &&
      !['completed', 'cancelled'].includes(getShift(a.shiftId)?.status)
    ),
    [myApps, shifts]
  );

  const completedItems = useMemo(() =>
    myApps.filter(a =>
      a.status === 'approved' && getShift(a.shiftId)?.status === 'completed'
    ),
    [myApps, shifts]
  );

  const rejectedItems = useMemo(() =>
    myApps.filter(a =>
      ['rejected', 'cancelled_by_worker'].includes(a.status) ||
      (a.status === 'approved' && getShift(a.shiftId)?.status === 'cancelled')
    ),
    [myApps, shifts]
  );

  const currentItems = tab === 0 ? activeItems : tab === 1 ? completedItems : rejectedItems;

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => {
    if (d === today) return 'Сегодня';
    const date = new Date(d);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const renderItem = ({ item: app }) => {
    const shift = getShift(app.shiftId);
    if (!shift) return null;
    const company = getCompany(shift.companyId);
    const shiftCancelled = shift.status === 'cancelled';
    const appStatus = shiftCancelled ? 'cancelled' : app.status;
    const config = statusConfig[appStatus] || statusConfig.pending;
    const hasReview = !!getReviewForShift(shift.id, currentUser?.id);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ShiftDetail', { shiftId: shift.id })}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={styles.cardPay}>{shift.pay} BYN</Text>
        </View>

        <Text style={styles.cardTitle}>{shift.title}</Text>
        <Text style={styles.cardCompany}>{company?.companyName}</Text>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.infoText}>{formatDate(shift.date)}, {shift.timeStart}–{shift.timeEnd}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {app.status === 'pending' && !shiftCancelled && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => cancelApplication(app.id)}
            >
              <Text style={styles.cancelBtnText}>Отменить отклик</Text>
            </TouchableOpacity>
          )}
          {app.status === 'approved' && company?.phone && (
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${company.phone}`)}
            >
              <Ionicons name="call-outline" size={16} color={COLORS.accent} />
              <Text style={styles.contactBtnText}>Связаться</Text>
            </TouchableOpacity>
          )}
          {tab === 1 && !hasReview && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => navigation.navigate('WriteReview', {
                shiftId: shift.id,
                targetId: shift.companyId,
                type: 'worker_about_company',
              })}
            >
              <Ionicons name="star-outline" size={16} color={COLORS.white} />
              <Text style={styles.reviewBtnText}>Оставить отзыв</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Мои смены</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t, i) => {
          const count = i === 0 ? activeItems.length : i === 1 ? completedItems.length : rejectedItems.length;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === i && styles.tabActive]}
              onPress={() => setTab(i)}
            >
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
              {count > 0 && (
                <View style={[styles.tabBadge, tab === i && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, tab === i && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={currentItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>
              {tab === 0 ? 'Нет активных смен' : tab === 1 ? 'Нет завершённых смен' : 'Нет отклонённых'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {tab === 0 ? 'Откликнитесь на смену в ленте' : 'Здесь будет история'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  headerTitle: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  tabs: { flexDirection: 'row', paddingHorizontal: SIZES.lg, gap: SIZES.xs, marginBottom: SIZES.md },
  tab: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, height: 36,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, gap: SIZES.xs,
  },
  tabActive: { backgroundColor: COLORS.textPrimary },
  tabText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  tabBadge: {
    backgroundColor: COLORS.surface, borderRadius: 10, minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: COLORS.accent },
  tabBadgeText: { fontSize: 11, ...FONTS.bold, color: COLORS.textSecondary },
  tabBadgeTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.tabBarHeight + SIZES.xl },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base, marginBottom: SIZES.md, ...SHADOWS.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: SIZES.caption, ...FONTS.medium },
  cardPay: { fontSize: SIZES.bodyLarge, ...FONTS.bold, color: COLORS.textPrimary },
  cardTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  cardCompany: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  cardInfo: { marginTop: SIZES.md, gap: SIZES.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  infoText: { fontSize: SIZES.small, color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md, paddingTop: SIZES.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cancelBtn: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.error },
  cancelBtnText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.error },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.accentSoft },
  contactBtnText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.accent },
  reviewBtnText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.white },
  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
});
