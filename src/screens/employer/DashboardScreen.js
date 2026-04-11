import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const getCompanyStats = useStore(s => s.getCompanyStats);
  const getCompanyShifts = useStore(s => s.getCompanyShifts);
  const stats = getCompanyStats();
  const companyShifts = getCompanyShifts();
  const applications = useStore(s => s.applications);
  const shifts = useStore(s => s.shifts); // subscribe for re-render on shift changes
  const notifications = useStore(s => s.notifications); // subscribe for unread count
  const getUnreadCount = useStore(s => s.getUnreadCount);

  const activeShifts = companyShifts.filter(s => ['active', 'in_progress', 'filled'].includes(s.status)).slice(0, 5);
  const unreadCount = getUnreadCount();

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => {
    if (d === today) return 'Сегодня';
    const date = new Date(d);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const METRICS = [
    { label: 'Активных смен', value: stats.activeShifts || 0, icon: 'flash-outline', color: '#4F46E5' },
    { label: 'Ждут подтверждения', value: stats.pendingApplications || 0, icon: 'hourglass-outline', color: '#D97706' },
    { label: 'Смен за месяц', value: stats.monthShifts || 0, icon: 'calendar-outline', color: '#059669' },
    { label: 'Рейтинг', value: stats.rating ? stats.rating.toFixed(1) : '—', icon: 'star-outline', color: '#F59E0B' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{currentUser?.companyName}</Text>
          <Text style={styles.plan}>Тариф: {currentUser?.plan === 'premium' ? 'Премиум' : currentUser?.plan === 'business' ? 'Бизнес' : 'Старт'}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.textPrimary} />
          {unreadCount > 0 && (
            <View style={styles.notifDot}>
              <Text style={styles.notifDotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Metrics */}
        <View style={styles.metricsGrid}>
          {METRICS.map(m => (
            <View key={m.label} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.color + '14' }]}>
                <Ionicons name={m.icon} size={20} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Active Shifts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Активные смены</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EmployerShifts')}>
              <Text style={styles.seeAll}>Все</Text>
            </TouchableOpacity>
          </View>

          {activeShifts.length > 0 ? activeShifts.map(shift => {
            const apps = applications.filter(a => a.shiftId === shift.id);
            const pending = apps.filter(a => a.status === 'pending').length;
            const approved = apps.filter(a => a.status === 'approved').length;

            return (
              <TouchableOpacity
                key={shift.id}
                style={styles.shiftCard}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ManageApplications', { shiftId: shift.id })}
              >
                <View style={styles.shiftTop}>
                  <Text style={styles.shiftTitle}>{shift.title}</Text>
                  {shift.urgent && (
                    <View style={styles.urgentTag}>
                      <Ionicons name="flash" size={10} color={COLORS.white} />
                    </View>
                  )}
                </View>
                <Text style={styles.shiftDate}>{formatDate(shift.date)}, {shift.timeStart}–{shift.timeEnd}</Text>

                <View style={styles.shiftBottom}>
                  <View style={styles.shiftStats}>
                    {pending > 0 && (
                      <View style={[styles.shiftStatBadge, { backgroundColor: '#FEF3C7' }]}>
                        <Text style={[styles.shiftStatText, { color: '#D97706' }]}>Новых: {pending}</Text>
                      </View>
                    )}
                    <View style={[styles.shiftStatBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.shiftStatText, { color: '#059669' }]}>{approved}/{shift.spotsTotal} подтв.</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          }) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Нет активных смен</Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('CreateShift')}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={COLORS.white} />
                <Text style={styles.createBtnText}>Создать смену</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: SIZES.tabBarHeight + SIZES['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  greeting: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.3 },
  plan: { fontSize: SIZES.small, color: COLORS.accent, ...FONTS.medium, marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm },
  notifDot: { position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: COLORS.white },
  notifDotText: { fontSize: 10, ...FONTS.bold, color: COLORS.white },
  scroll: { paddingHorizontal: SIZES.lg },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  metricCard: { width: '48%', backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base, ...SHADOWS.sm, flexGrow: 1 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.sm },
  metricValue: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary },
  metricLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },

  section: { marginTop: SIZES.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.md },
  sectionTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary },
  seeAll: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.accent },

  shiftCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.sm },
  shiftTop: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  shiftTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  urgentTag: { backgroundColor: COLORS.error, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  shiftDate: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 4 },
  shiftBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.md },
  shiftStats: { flexDirection: 'row', gap: SIZES.sm },
  shiftStatBadge: { paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm },
  shiftStatText: { fontSize: 11, ...FONTS.medium },

  emptyCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.xl, alignItems: 'center', ...SHADOWS.sm },
  emptyText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginBottom: SIZES.md },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, backgroundColor: COLORS.accent, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd },
  createBtnText: { fontSize: SIZES.body, ...FONTS.semibold, color: COLORS.white },
});
