// Chats: one line per conversation, the shift it is about, the last message.
// Conversations with blocked users are hidden (Guideline 1.2).
import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { Press, Separator, EmptyState, Monogram, PersonAvatar, Badge } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { dayLabel, clock, ago } from '../../design/format';
import useStore from '../../store/useStore';

export default function ChatListScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const me = useStore((s) => s.currentUser);
  const conversations = useStore((s) => s.conversations);
  const workers = useStore((s) => s.workers);
  const companies = useStore((s) => s.companies);
  const shifts = useStore((s) => s.shifts);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const isWorker = me?.role !== 'employer';

  const chats = useMemo(() => {
    if (!me) return [];
    return conversations
      .filter((cv) => cv.workerId === me.id || cv.companyId === me.id)
      .filter((cv) => !blockedUsers.includes(isWorker ? cv.companyId : cv.workerId))
      .map((cv) => {
        const shift = shifts.find((s) => s.id === cv.shiftId);
        const partner = isWorker ? companies.find((co) => co.id === cv.companyId) : workers.find((w) => w.id === cv.workerId);
        const last = cv.messages[cv.messages.length - 1];
        const unread = cv.messages.filter((m) => m.senderId !== me.id && m.senderId !== 'system' && !m.read).length;
        return { cv, shift, partner, last, unread };
      })
      .sort((a, b) => String(b.cv.lastMessageAt || b.cv.createdAt).localeCompare(String(a.cv.lastMessageAt || a.cv.createdAt)));
  }, [me, conversations, shifts, workers, companies, blockedUsers, isWorker]);

  const header = (
    <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, paddingBottom: 14 }}>
      <T v="screenTitle" accessibilityRole="header">Чат</T>
      <T v="caption" c="secondary" style={{ marginTop: 2 }}>
        {isWorker ? 'Переписка с заказчиками по сменам' : 'Переписка с исполнителями'}
      </T>
    </View>
  );

  if (!me || chats.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.ledger }}>
        {header}
        <Separator />
        <EmptyState
          title="Переписок нет"
          text={isWorker ? 'Чат открывается, когда заказчик подтвердит отклик.' : 'Чат с исполнителем открывается, когда ты подтверждаешь отклик.'}
        />
        {!me ? (
          <Press feedback="none" onPress={() => navigation.navigate('Profile')} style={{ paddingHorizontal: 22 }}>
            <T v="body" c="accent">Войти</T>
          </Press>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <FlatList
        data={chats}
        keyExtractor={(x) => x.cv.id}
        ListHeaderComponent={<>{header}<Separator /></>}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        renderItem={({ item, index }) => {
          const { cv, shift, partner, last, unread } = item;
          const name = isWorker ? partner?.companyName : `${partner?.firstName || ''} ${partner?.lastName || ''}`.trim();
          const preview = last
            ? `${last.senderId === me.id ? 'Ты: ' : ''}${last.imageUri && !last.text ? 'Фото' : last.text}`
            : 'Напиши первым';
          const when = last ? (dayLabel(new Date(last.createdAt)) === 'Сегодня' ? clock(last.createdAt) : ago(last.createdAt)) : '';
          return (
            <View>
              <Press feedback="highlight" onPress={() => navigation.navigate('ChatConversation', { conversationId: cv.id })} accessibilityLabel={`${name}, ${unread ? `${unread} непрочитанных, ` : ''}${preview}`}>
                <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 22, paddingVertical: 13 }}>
                  {isWorker
                    ? <Monogram name={partner?.companyName} logo={partner?.logo} size={44} />
                    : <PersonAvatar first={partner?.firstName} last={partner?.lastName} uri={partner?.avatar} size={44} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                      <T v="rowTitle" style={{ flex: 1, fontSize: 16, lineHeight: 21 }} numberOfLines={1}>{name}</T>
                      <T v="small" c="secondary">{when}</T>
                    </View>
                    {shift ? <T v="caption" c="secondary" numberOfLines={1}>{shift.title} · {dayLabel(shift.date).toLowerCase()}, {shift.timeStart}</T> : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <T v="body" c={unread ? 'label' : 'secondary'} style={{ flex: 1, fontWeight: unread ? '500' : '400' }} numberOfLines={1}>{preview}</T>
                      {unread ? <Badge count={unread} style={{ borderWidth: 0 }} /> : null}
                    </View>
                  </View>
                </View>
              </Press>
              {index < chats.length - 1 ? <Separator style={{ marginLeft: 78, marginRight: 22 }} /> : null}
            </View>
          );
        }}
      />
    </View>
  );
}
