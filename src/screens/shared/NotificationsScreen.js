// In-app notifications: tiles on the grey `bg`, like the push surfaces in the
// handoff. Tapping one opens the shift it is about.
import React, { useMemo } from 'react';
import { View, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, EmptyState } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { ago, daySection } from '../../design/format';
import useStore from '../../store/useStore';

const ICON = {
  application_approved: 'checkmark.circle',
  application_rejected: 'xmark.circle',
  new_application: 'person.badge.plus',
  shift_cancelled: 'slash.circle',
  shift_filled: 'person.2',
  shift_reminder: 'timer',
  shift_starting_soon: 'timer',
  review_received: 'star',
  shift_invite: 'envelope',
};

export default function NotificationsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const all = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllRead);

  const sections = useMemo(() => {
    const mine = all.filter((n) => n.userId === me?.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const groups = new Map();
    mine.forEach((n) => {
      const key = daySection(String(n.createdAt).length > 10 ? new Date(n.createdAt) : n.createdAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(n);
    });
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [all, me?.id]);
  const unread = sections.reduce((n, s) => n + s.data.filter((x) => !x.read).length, 0);

  const open = (n) => {
    markRead(n.id);
    if (!n.relatedShiftId) return;
    navigation.navigate(me?.role === 'employer' ? 'ShiftManage' : 'ShiftDetail', { shiftId: n.relatedShiftId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <NavBar
        variant="fill"
        onBack={() => navigation.goBack()}
        right={unread ? <Press feedback="none" onPress={markAllRead} hitSlop={10}><T v="body" c="accent">Прочитать все</T></Press> : null}
      />
      <SectionList
        sections={sections}
        keyExtractor={(n) => n.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={(
          <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6 }}>
            <T v="title" accessibilityRole="header">Уведомления</T>
            <T v="caption" c="secondary" style={{ marginTop: 2 }}>{unread ? `${unread} непрочитанных` : 'Всё прочитано'}</T>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="Пока тихо" text={me?.role === 'employer' ? 'Здесь появятся новые отклики и ответы исполнителей.' : 'Здесь появятся ответы на отклики и напоминания о сменах.'} />}
        renderSectionHeader={({ section }) => <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 8 }}>{section.title}</T>}
        renderItem={({ item: n }) => (
          <Press
            onPress={() => open(n)}
            style={{ marginHorizontal: 16, marginBottom: 8, borderRadius: 18, backgroundColor: c.elevated, padding: 14, flexDirection: 'row', gap: 12 }}
            accessibilityLabel={`${n.read ? '' : 'Новое. '}${n.title}. ${n.body}`}
          >
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={ICON[n.type] || 'bell'} size={16} c="label" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <T v="bodyStrong" style={{ flex: 1 }}>{n.title}</T>
                <T v="small" c="secondary">{ago(n.createdAt)}</T>
              </View>
              <T v="caption" c="secondary" style={{ marginTop: 2 }}>{n.body}</T>
            </View>
            {!n.read ? <View style={{ position: 'absolute', top: 16, left: 6, width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.accent }} /> : null}
          </Press>
        )}
      />
    </View>
  );
}
