// «Уведомления» — screen 19. Grouped by day, each group one surface. The
// type tile repeats the colour and symbol of the matching status (§9.2),
// so the type reads before the text. Unread rows get a brand tint and a
// brand dot, not bold text. Tapping one opens the shift or chat it is about.
import React, { useMemo } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, CircleButton, EmptyState, Divider } from '../../design/ui';
import { PersonMono } from '../../design/Monogram';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { daySection, dayLabel, shortDate, clock } from '../../design/format';
import useStore from '../../store/useStore';

// type → tile tone and symbol; `title` replaces the stored one with the
// status wording used across the app.
const KIND = {
  application_approved: { tone: 'success', icon: 'checkmark', title: 'Смена подтверждена' },
  shift_reminder: { tone: 'success', icon: 'timer' },
  shift_starting_soon: { tone: 'success', icon: 'timer' },
  shift_filled: { tone: 'success', icon: 'person.2' },
  message: { tone: 'brand', icon: 'bubble.left' },
  new_message: { tone: 'brand', icon: 'bubble.left' },
  urgent_shift: { tone: 'urgent', icon: 'bolt.fill', title: 'Срочная смена' },
  shift_urgent: { tone: 'urgent', icon: 'bolt.fill', title: 'Срочная смена' },
  rate_shift: { tone: 'star', icon: 'star.fill', title: 'Оцени смену' },
  review_request: { tone: 'star', icon: 'star.fill', title: 'Оцени смену' },
  review_received: { tone: 'star', icon: 'star.fill' },
  application_rejected: { tone: 'neutral', icon: 'xmark.circle', title: 'Не подошло' },
  shift_cancelled: { tone: 'error', icon: 'xmark.circle' },
  new_application: { tone: 'brand', icon: 'person.badge.plus' },
  shift_invite: { tone: 'brand', icon: 'envelope' },
};

// Worker notifications about a shift read as «Оператор ПВЗ · Ozon ПВЗ
// Минск · сегодня 10:00», composed from the store rather than the stored
// sentence. Employers keep the stored text: it names the applicant.
const WITH_TIME = new Set(['application_approved', 'shift_reminder', 'shift_starting_soon', 'urgent_shift', 'shift_urgent', 'shift_invite']);
const WITH_SHIFT = new Set([...WITH_TIME, 'application_rejected', 'shift_cancelled', 'rate_shift', 'review_request']);

function dayWord(shift, now) {
  const d = dayLabel(shift.date, now);
  return d === 'Сегодня' || d === 'Завтра' || d === 'Вчера' ? d.toLowerCase() : shortDate(shift.date);
}

function Tile({ kind, unread, sender }) {
  const { c } = useTheme();
  if (sender) {
    const [first, last] = String(sender).split(' ');
    return <PersonMono first={first} last={last} size={38} />;
  }
  const tones = {
    success: [c.successTint, c.success],
    urgent: [c.urgentTint, c.urgent],
    // Fixed white star on the star fill, as in the handoff (both themes).
    star: [c.star, '#FFFFFF'],
    neutral: [c.surface2, c.ink2],
    error: [c.errorTint, c.error],
    // A brand tile on an unread (brand-tint) row sits on the surface instead.
    brand: [unread ? c.surface : c.brandTint, c.brand],
  };
  const [bg, fg] = tones[kind?.tone] || [c.surface2, c.ink2];
  const bold = kind?.icon === 'checkmark';
  return (
    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={kind?.icon || 'bell'} size={bold ? 19 : 20} c={fg} weight={bold ? 'bold' : 'semibold'} />
    </View>
  );
}

export default function NotificationsScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const all = useStore((s) => s.notifications);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const markRead = useStore((s) => s.markNotificationRead);
  const markAllRead = useStore((s) => s.markAllRead);
  const isEmployer = me?.role === 'employer';

  const sections = useMemo(() => {
    const now = new Date();
    const mine = all.filter((n) => n.userId === me?.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const groups = new Map();
    mine.forEach((n) => {
      const key = daySection(String(n.createdAt).length > 10 ? new Date(n.createdAt) : n.createdAt, now).toUpperCase();
      if (!groups.has(key)) groups.set(key, []);
      const kind = KIND[n.type];
      const shift = n.relatedShiftId ? shifts.find((s) => s.id === n.relatedShiftId) : null;
      const company = shift ? companies.find((co) => co.id === shift.companyId) : null;
      let body = n.body;
      if (!isEmployer && shift && WITH_SHIFT.has(n.type)) {
        body = [shift.title, company?.companyName, WITH_TIME.has(n.type) ? `${dayWord(shift, now)} ${shift.timeStart}` : null].filter(Boolean).join(' · ');
      }
      groups.get(key).push({
        n,
        kind,
        title: kind?.title || n.title,
        body,
        time: String(n.createdAt).length > 10 ? clock(n.createdAt) : null,
      });
    });
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [all, me?.id, shifts, companies, isEmployer]);
  const unread = sections.reduce((k, s) => k + s.data.filter((x) => !x.n.read).length, 0);

  const open = ({ n }) => {
    markRead(n.id);
    if (n.conversationId) { navigation.navigate('ChatConversation', { conversationId: n.conversationId }); return; }
    if (!n.relatedShiftId) return;
    if (!isEmployer && (n.type === 'rate_shift' || n.type === 'review_request')) { navigation.navigate('RateShift', { shiftId: n.relatedShiftId }); return; }
    navigation.navigate(isEmployer ? 'ShiftManage' : 'ShiftDetail', { shiftId: n.relatedShiftId });
  };

  const readAll = () => { haptic.selection(); markAllRead(); };

  const renderGroup = ({ item: section, index }) => (
    <View style={{ marginTop: index === 0 ? 18 : 20 }}>
      <T v="caption" c="ink2" weight="700" style={{ fontSize: 13, lineHeight: 16 }} accessibilityRole="header">{section.title}</T>
      <View style={[{ marginTop: 9, backgroundColor: c.surface, borderRadius: 20 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: c.line }]}>
        <View style={{ borderRadius: t.dark ? 19 : 20, overflow: 'hidden' }}>
          {section.data.map((x, i) => {
            const isUnread = !x.n.read;
            return (
              <View key={x.n.id}>
                <Press
                  feedback="highlight"
                  onPress={() => open(x)}
                  accessibilityLabel={`${isUnread ? 'Новое. ' : ''}${x.title}. ${x.body || ''}${x.time ? `. ${x.time}` : ''}`}
                  style={{ flexDirection: 'row', gap: 11, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: isUnread ? c.brandTint : 'transparent' }}
                >
                  <Tile kind={x.kind} unread={isUnread} sender={x.n.senderName} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="bodyStrong" weight="700" style={{ fontSize: 15, lineHeight: 19.5 }}>{x.title}</T>
                    {x.body ? <T v="caption" c="ink3" style={{ marginTop: 2, fontSize: 13, lineHeight: 18 }}>{x.body}</T> : null}
                    {x.time ? <T v="caption" c="ink2" style={{ marginTop: 4, fontSize: 11.5, lineHeight: 14 }}>{x.time}</T> : null}
                  </View>
                  {isUnread ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.brand, marginTop: 4 }} /> : null}
                </Press>
                {i < section.data.length - 1 ? <Divider /> : null}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={sections}
        keyExtractor={(s) => s.title}
        renderItem={renderGroup}
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={(
          <View>
            <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <T v="titleLarge" style={{ flex: 1, fontSize: 30, lineHeight: 34.5, letterSpacing: -0.6 }} accessibilityRole="header">Уведомления</T>
              {unread ? (
                <Press feedback="none" onPress={readAll} hitSlop={10} style={{ paddingTop: 8 }} accessibilityLabel={`Прочитать все, непрочитанных: ${unread}`}>
                  <T v="bodyStrong" c="brand" style={{ fontSize: 14, lineHeight: 18 }}>Прочитать все</T>
                </Press>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <EmptyState
            style={{ marginTop: 40 }}
            icon="bell"
            title="Пока тихо"
            text={isEmployer ? 'Здесь появятся новые отклики и ответы исполнителей.' : 'Здесь появятся ответы на отклики и напоминания о сменах.'}
          />
        )}
      />
    </View>
  );
}
