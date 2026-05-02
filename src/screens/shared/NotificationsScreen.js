import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const typeIcons = {
  application_approved: { icon: 'checkmark-circle', color: '#059669' },
  application_rejected: { icon: 'close-circle', color: '#EF4444' },
  new_application: { icon: 'person-add', color: '#4F46E5' },
  shift_reminder: { icon: 'alarm', color: '#F59E0B' },
  shift_cancelled: { icon: 'close-circle', color: '#EF4444' },
  shift_invite: { icon: 'paper-plane', color: '#4F46E5' },
  payment_sent: { icon: 'cash', color: '#059669' },
  review_received: { icon: 'star', color: '#F59E0B' },
  nearby_shift: { icon: 'location', color: '#4F46E5' },
  shift_filled: { icon: 'checkmark-done', color: '#059669' },
  shift_starting_soon: { icon: 'alarm', color: '#D97706' },
  plan_expiring: { icon: 'card', color: '#8B5CF6' },
};

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const getNotificationsForUser = useStore(s => s.getNotificationsForUser);
  const notifications = getNotificationsForUser();
  const markRead = useStore(s => s.markNotificationRead);
  const markAllRead = useStore(s => s.markAllRead);

  const unreadCount = notifications.filter(n => !n.read).length;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();

  const sections = useMemo(() => {
    const groups = {};
    notifications.forEach(n => {
      const date = typeof n.createdAt === 'string' ? n.createdAt.split('T')[0] : n.createdAt;
      let label;
      if (date === today) label = 'Сегодня';
      else if (date === yesterday) label = 'Вчера';
      else {
        const d = new Date(date);
        const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
        label = `${d.getDate()} ${months[d.getMonth()]}`;
      }
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [notifications, today, yesterday]);

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const handleTap = (notif) => {
    markRead(notif.id);
    if (notif.relatedShiftId) {
      navigation.navigate('ShiftDetail', { shiftId: notif.relatedShiftId });
    }
  };

  const renderItem = ({ item }) => {
    const config = typeIcons[item.type] || { icon: 'notifications', color: COLORS.textTertiary };
    return (
      <TouchableOpacity
        style={[styles.item, !item.read && styles.itemUnread]}
        onPress={() => handleTap(item)}
        activeOpacity={0.6}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.color + '14' }]}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, !item.read && styles.itemTitleUnread]}>{item.title}</Text>
          <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{formatTime(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомления</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Прочитать все</Text>
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Нет уведомлений</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  markAll: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent, paddingRight: SIZES.lg },

  sectionHeader: { paddingHorizontal: SIZES.lg, paddingTop: SIZES.lg, paddingBottom: SIZES.sm },
  sectionTitle: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },

  list: { paddingBottom: SIZES['3xl'] },
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  itemUnread: { backgroundColor: COLORS.accentSoft + '40' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: SIZES.md },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  itemTitleUnread: { ...FONTS.semibold },
  itemBody: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2, lineHeight: 18 },
  itemTime: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: SIZES.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginTop: 6 },

  empty: { alignItems: 'center', paddingTop: SIZES['5xl'] },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
});
