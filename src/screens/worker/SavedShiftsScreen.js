import React, { useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function SavedShiftsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);
  const savedShifts = useStore(s => s.savedShifts);
  const toggleSavedShift = useStore(s => s.toggleSavedShift);

  const userSaved = savedShifts[currentUser?.id] || [];
  const savedItems = useMemo(
    () => shifts.filter(s => userSaved.includes(s.id)).sort((a, b) => new Date(a.date) - new Date(b.date)),
    [shifts, userSaved],
  );

  const getCompany = useCallback((id) => companies.find(c => c.id === id), [companies]);

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => {
    if (d === today) return 'Сегодня';
    const tomorrow = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return t.toISOString().split('T')[0]; })();
    if (d === tomorrow) return 'Завтра';
    const date = new Date(d);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const renderShift = ({ item }) => {
    const company = getCompany(item.companyId);
    const isPast = item.status !== 'active';

    return (
      <TouchableOpacity
        style={[styles.card, isPast && styles.cardPast]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.id })}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            {item.urgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flash" size={11} color={COLORS.white} />
                <Text style={styles.urgentText}>Срочно</Text>
              </View>
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.company}>{company?.companyName}</Text>
          </View>
          <View style={styles.rightCol}>
            <Text style={styles.pay}>{item.pay} BYN</Text>
            <TouchableOpacity
              style={styles.bookmarkBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => toggleSavedShift(item.id)}
            >
              <Ionicons name="bookmark" size={20} color={COLORS.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.detailText}>{formatDate(item.date)}, {item.timeStart}–{item.timeEnd}</Text>
          </View>
        </View>

        {isPast && (
          <View style={styles.pastBadge}>
            <Text style={styles.pastText}>
              {item.status === 'completed' ? 'Завершена' : item.status === 'cancelled' ? 'Отменена' : 'Заполнена'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Сохранённые</Text>
      </View>

      <FlatList
        data={savedItems}
        renderItem={renderShift}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bookmark-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Нет сохранённых смен</Text>
            <Text style={styles.emptySubtitle}>
              Нажмите закладку на любой смене, чтобы сохранить её здесь
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

  list: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.tabBarHeight + SIZES.xl },

  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.base, marginBottom: SIZES.md, ...SHADOWS.sm,
  },
  cardPast: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  rightCol: { alignItems: 'flex-end', gap: SIZES.sm },
  pay: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.success },
  bookmarkBtn: { padding: 4 },

  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    backgroundColor: COLORS.error, paddingHorizontal: SIZES.sm, paddingVertical: 2,
    borderRadius: SIZES.radiusSm, marginBottom: SIZES.xs,
  },
  urgentText: { fontSize: 10, ...FONTS.semibold, color: COLORS.white },

  title: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  company: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },

  details: { marginTop: SIZES.md, gap: SIZES.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  detailText: { fontSize: SIZES.small, color: COLORS.textSecondary },

  pastBadge: {
    marginTop: SIZES.sm, alignSelf: 'flex-start',
    paddingHorizontal: SIZES.sm, paddingVertical: 2,
    borderRadius: SIZES.radiusSm, backgroundColor: COLORS.surface,
  },
  pastText: { fontSize: SIZES.caption, ...FONTS.medium, color: COLORS.textTertiary },

  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs, textAlign: 'center', paddingHorizontal: SIZES['2xl'] },
});
