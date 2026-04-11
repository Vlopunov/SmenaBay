import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const STATUS_FILTERS = ['Все', 'Активные', 'Заполненные', 'Завершённые', 'Отменённые'];
const statusMap = { 'Активные': 'active', 'Заполненные': 'filled', 'Завершённые': 'completed', 'Отменённые': 'cancelled' };
const statusColors = {
  active: { bg: '#DBEAFE', color: '#2563EB', label: 'Активна' },
  filled: { bg: '#D1FAE5', color: '#059669', label: 'Заполнена' },
  in_progress: { bg: '#FEF3C7', color: '#D97706', label: 'В процессе' },
  completed: { bg: '#F0FDF4', color: '#16A34A', label: 'Завершена' },
  cancelled: { bg: '#FEE2E2', color: '#EF4444', label: 'Отменена' },
};

export default function EmployerShiftsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const getCompanyShifts = useStore(s => s.getCompanyShifts);
  const companyShifts = getCompanyShifts();
  const applications = useStore(s => s.applications);
  const duplicateShift = useStore(s => s.duplicateShift);
  const [filter, setFilter] = useState('Все');

  const filtered = useMemo(() => {
    if (filter === 'Все') return companyShifts;
    return companyShifts.filter(s => s.status === statusMap[filter]);
  }, [companyShifts, filter]);

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => {
    if (d === today) return 'Сегодня';
    const date = new Date(d);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const renderShift = ({ item }) => {
    const sc = statusColors[item.status] || statusColors.active;
    const apps = applications.filter(a => a.shiftId === item.id);
    const pending = apps.filter(a => a.status === 'pending').length;
    const approved = apps.filter(a => a.status === 'approved').length;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ManageApplications', { shiftId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
          <Text style={styles.cardPay}>{item.pay} BYN</Text>
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDate}>{formatDate(item.date)}, {item.timeStart}–{item.timeEnd}</Text>
        <View style={styles.cardBottom}>
          <Text style={styles.cardStats}>
            Откликов: {apps.length} · Подтв: {approved}/{item.spotsTotal}
            {pending > 0 ? ` · Новых: ${pending}` : ''}
          </Text>
          {item.status === 'active' && (
            <TouchableOpacity
              style={styles.dupBtn}
              onPress={() => {
                const tmpl = duplicateShift(item.id);
                if (tmpl) navigation.navigate('CreateShift', { template: tmpl });
              }}
            >
              <Ionicons name="copy-outline" size={16} color={COLORS.accent} />
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

      <FlatList
        data={STATUS_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        renderItem={renderShift}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, filtered.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Нет смен</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'Все' ? 'Создайте первую смену' : 'Нет смен с таким статусом'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingTop: SIZES.sm, paddingBottom: SIZES.xs },
  headerTitle: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  filters: { paddingHorizontal: SIZES.lg, gap: SIZES.sm, marginBottom: SIZES.md, alignItems: 'center' },
  filterChip: { paddingHorizontal: SIZES.md, height: 34, justifyContent: 'center', borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  filterText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  filterTextActive: { color: COLORS.white },
  list: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.tabBarHeight + SIZES.xl },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base, marginBottom: SIZES.md, ...SHADOWS.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  statusBadge: { paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm },
  statusText: { fontSize: SIZES.caption, ...FONTS.medium },
  cardPay: { fontSize: SIZES.bodyLarge, ...FONTS.bold, color: COLORS.textPrimary },
  cardTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  cardDate: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 3 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.md, paddingTop: SIZES.md, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  cardStats: { fontSize: SIZES.small, color: COLORS.textSecondary },
  dupBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.base },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
});
