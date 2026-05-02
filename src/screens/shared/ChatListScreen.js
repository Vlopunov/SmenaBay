import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';
import OnlineDot, { formatLastSeen } from '../../components/OnlineDot';
import Avatar from '../../components/Avatar';

export default function ChatListScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const conversations = useStore(s => s.conversations);
  const workers = useStore(s => s.workers);
  const companies = useStore(s => s.companies);
  const shifts = useStore(s => s.shifts);

  const isWorker = currentUser?.role === 'worker';

  const chats = useMemo(() => {
    return conversations
      .filter(c => c.workerId === currentUser?.id || c.companyId === currentUser?.id)
      .map(c => {
        const shift = shifts.find(s => s.id === c.shiftId);
        const partner = isWorker
          ? companies.find(co => co.id === c.companyId)
          : workers.find(w => w.id === c.workerId);
        const lastMsg = c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
        const unread = c.messages.filter(m => m.senderId !== currentUser?.id && !m.read).length;
        return { ...c, shift, partner, lastMsg, unread };
      })
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  }, [conversations, currentUser, shifts, workers, companies, isWorker]);

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const msgDate = d.toISOString().split('T')[0];
    if (msgDate === today) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const renderChat = ({ item }) => {
    const partnerName = isWorker
      ? item.partner?.companyName
      : `${item.partner?.firstName || ''} ${item.partner?.lastName || ''}`;
    const avatar = isWorker
      ? item.partner?.logo
      : item.partner?.avatar;

    const hasUnread = item.unread > 0;

    return (
      <TouchableOpacity
        style={[styles.chatCard, hasUnread && styles.chatCardUnread]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatConversation', { conversationId: item.id })}
      >
        <View>
          <Avatar
            uri={avatar}
            name={isWorker ? item.partner?.companyName : item.partner?.firstName}
            name2={isWorker ? undefined : item.partner?.lastName}
            size={52}
          />
          <OnlineDot lastSeen={item.partner?.lastSeen} size={14} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatTop}>
            <Text style={[styles.chatName, hasUnread && styles.chatNameUnread]} numberOfLines={1}>{partnerName}</Text>
            <Text style={[styles.chatTime, hasUnread && styles.chatTimeUnread]}>{formatTime(item.lastMsg?.createdAt || item.createdAt)}</Text>
          </View>
          <Text style={styles.chatShift} numberOfLines={1}>
            {item.shift?.title || 'Смена'}
          </Text>
          <View style={styles.chatBottom}>
            <Text style={[styles.chatLastMsg, hasUnread && styles.chatLastMsgUnread]} numberOfLines={1}>
              {item.lastMsg
                ? (item.lastMsg.senderId === currentUser?.id ? 'Вы: ' : '') + (item.lastMsg.imageUri ? '📷 Фото' : item.lastMsg.text)
                : 'Напишите первое сообщение'
              }
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чат</Text>
      </View>

      <FlatList
        data={chats}
        renderItem={renderChat}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Нет чатов</Text>
            <Text style={styles.emptySubtitle}>
              {isWorker
                ? 'Чат появится, когда заказчик подтвердит ваш отклик на смену'
                : 'Чат появится, когда вы подтвердите отклик исполнителя'
              }
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

  list: { paddingBottom: SIZES.tabBarHeight + SIZES.xl, flexGrow: 1 },

  chatCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight,
  },
  chatCardUnread: {
    backgroundColor: COLORS.accentSoft + '40',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.skeleton },
  chatInfo: { flex: 1, marginLeft: SIZES.md },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary, flex: 1, marginRight: SIZES.sm },
  chatNameUnread: { ...FONTS.bold },
  chatTime: { fontSize: SIZES.caption, color: COLORS.textTertiary },
  chatTimeUnread: { color: COLORS.accent, ...FONTS.medium },
  chatShift: { fontSize: SIZES.small, color: COLORS.accent, marginTop: 1 },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  chatLastMsg: { fontSize: SIZES.small, color: COLORS.textSecondary, flex: 1, marginRight: SIZES.sm },
  chatLastMsgUnread: { color: COLORS.textPrimary, ...FONTS.medium },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { fontSize: 11, ...FONTS.bold, color: COLORS.white },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SIZES['2xl'] },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.lg,
  },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.sm, textAlign: 'center', lineHeight: 22 },
});
