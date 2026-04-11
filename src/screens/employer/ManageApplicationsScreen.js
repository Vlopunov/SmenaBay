import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { BADGE_INFO } from '../../data/mockData';
import useStore from '../../store/useStore';

const TABS = ['Новые', 'Подтверждённые', 'Отклонённые'];

export default function ManageApplicationsScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const insets = useSafeAreaInsets();
  const getShiftById = useStore(s => s.getShiftById);
  const getApplicationsForShift = useStore(s => s.getApplicationsForShift);
  const allApplications = useStore(s => s.applications); // subscribe for reactivity
  const allShifts = useStore(s => s.shifts); // subscribe for reactivity
  const shift = getShiftById(shiftId);
  const apps = getApplicationsForShift(shiftId);
  const workers = useStore(s => s.workers);
  const approve = useStore(s => s.approveApplication);
  const reject = useStore(s => s.rejectApplication);
  const completeShift = useStore(s => s.completeShift);
  const cancelShift = useStore(s => s.cancelShift);
  const getReviewForShift = useStore(s => s.getReviewForShift);
  const currentUser = useStore(s => s.currentUser);

  const [tab, setTab] = useState(0);

  const pending = useMemo(() => apps.filter(a => a.status === 'pending'), [apps]);
  const approved = useMemo(() => apps.filter(a => a.status === 'approved'), [apps]);
  const rejected = useMemo(() => apps.filter(a => ['rejected', 'cancelled_by_worker'].includes(a.status)), [apps]);
  const currentItems = tab === 0 ? pending : tab === 1 ? approved : rejected;

  if (!shift) return null;

  const isCompleted = shift.status === 'completed';
  const canComplete = shift.status !== 'completed' && shift.status !== 'cancelled' && approved.length > 0;

  const renderApp = ({ item: app }) => {
    const worker = workers.find(w => w.id === app.workerId);
    if (!worker) return null;
    const hasReview = !!getReviewForShift(shiftId, currentUser?.id, worker.id);

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.workerRow}
          onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: worker.id })}
        >
          <Image source={{ uri: worker.avatar || 'https://i.pravatar.cc/200' }} style={styles.avatar} />
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{worker.firstName} {worker.lastName}</Text>
            <View style={styles.workerMeta}>
              {worker.rating > 0 && (
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color={COLORS.star} />
                  <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
                </View>
              )}
              <Text style={styles.metaText}>{worker.shiftsCompleted} смен</Text>
            </View>
            {worker.badges.length > 0 && (
              <View style={styles.badgesRow}>
                {worker.badges.slice(0, 3).map(b => {
                  const info = BADGE_INFO[b];
                  if (!info) return null;
                  return (
                    <View key={b} style={[styles.miniBadge, { backgroundColor: info.color + '14' }]}>
                      <Ionicons name={info.icon} size={10} color={info.color} />
                      <Text style={[styles.miniBadgeText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.cardActions}>
          {tab === 0 && (
            <>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => reject(app.id)}>
                <Ionicons name="close" size={18} color={COLORS.error} />
                <Text style={styles.rejectText}>Отклонить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.approveBtn} onPress={() => approve(app.id)}>
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
                <Text style={styles.approveText}>Подтвердить</Text>
              </TouchableOpacity>
            </>
          )}
          {tab === 1 && (
            <>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${worker.phone}`)}>
                <Ionicons name="call-outline" size={16} color={COLORS.accent} />
                <Text style={styles.callText}>Позвонить</Text>
              </TouchableOpacity>
              {isCompleted && !hasReview && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => navigation.navigate('WriteReview', {
                    shiftId, targetId: worker.id, type: 'company_about_worker',
                  })}
                >
                  <Ionicons name="star-outline" size={16} color={COLORS.white} />
                  <Text style={styles.reviewBtnText}>Отзыв</Text>
                </TouchableOpacity>
              )}
            </>
          )}
          {tab === 2 && (
            <Text style={styles.rejectedStatus}>
              {app.status === 'cancelled_by_worker' ? 'Отменил сам' : 'Отклонён'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>{shift.title}</Text>
          <Text style={styles.navSub}>{shift.date}, {shift.timeStart}–{shift.timeEnd}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Shift actions */}
      <View style={styles.actionBar}>
        {canComplete && (
          <TouchableOpacity style={styles.completeBtn} onPress={() => completeShift(shiftId)}>
            <Text style={styles.completeBtnText}>Завершить смену</Text>
          </TouchableOpacity>
        )}
        {shift.status === 'active' && (
          <TouchableOpacity style={styles.cancelShiftBtn} onPress={() => cancelShift(shiftId)}>
            <Text style={styles.cancelShiftText}>Отменить</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((t, i) => {
          const count = i === 0 ? pending.length : i === 1 ? approved.length : rejected.length;
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
        renderItem={renderApp}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>
              {tab === 0 ? 'Нет новых откликов' : tab === 1 ? 'Нет подтверждённых' : 'Нет отклонённых'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navCenter: { flex: 1 },
  navTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  navSub: { fontSize: SIZES.caption, color: COLORS.textSecondary },

  actionBar: { flexDirection: 'row', paddingHorizontal: SIZES.lg, gap: SIZES.sm, marginBottom: SIZES.sm },
  completeBtn: { flex: 1, backgroundColor: COLORS.success, borderRadius: SIZES.radiusSm, paddingVertical: SIZES.sm, alignItems: 'center' },
  completeBtnText: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.white },
  cancelShiftBtn: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.error },
  cancelShiftText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.error },

  tabs: { flexDirection: 'row', paddingHorizontal: SIZES.lg, gap: SIZES.xs, marginBottom: SIZES.md },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.md, height: 36, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, gap: SIZES.xs },
  tabActive: { backgroundColor: COLORS.textPrimary },
  tabText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.white },
  tabBadge: { backgroundColor: COLORS.surface, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  tabBadgeActive: { backgroundColor: COLORS.accent },
  tabBadgeText: { fontSize: 11, ...FONTS.bold, color: COLORS.textSecondary },
  tabBadgeTextActive: { color: COLORS.white },

  list: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES['3xl'] },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base, marginBottom: SIZES.md, ...SHADOWS.sm },
  workerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.skeleton },
  workerInfo: { flex: 1, marginLeft: SIZES.md },
  workerName: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  workerMeta: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginTop: 3 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textPrimary },
  metaText: { fontSize: SIZES.small, color: COLORS.textSecondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: SIZES.sm },
  miniBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: SIZES.radiusSm },
  miniBadgeText: { fontSize: 10, ...FONTS.medium },

  cardActions: { flexDirection: 'row', gap: SIZES.sm, marginTop: SIZES.md, paddingTop: SIZES.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, borderWidth: 1, borderColor: COLORS.error },
  rejectText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.error },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.success },
  approveText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.white },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.accentSoft },
  callText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.accent },
  reviewBtnText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.white },
  rejectedStatus: { fontSize: SIZES.small, color: COLORS.textTertiary },

  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
});
