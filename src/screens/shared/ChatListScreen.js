// Chats (screen 17). The second line of every row is the shift, not
// «онлайн»: without that context the list is useless. An unread chat sits
// on the brand tint with a count; my own last message carries its read
// ticks. Conversations with blocked users are hidden (Guideline 1.2).
import React, { useMemo, useState } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, LargeTitle, SearchField, Button, Divider, EmptyState } from '../../design/ui';
import { PersonMono, CompanyMono } from '../../design/Monogram';
import { SkyView } from '../../design/Sky';
import { categoryOf } from '../../design/category';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { plural, dayLabel, shortDate, clock, ago, isoDay, presence, shiftEnd } from '../../design/format';
import { visibleShifts } from '../worker/shiftFilters';
import useStore from '../../store/useStore';

const RULE = 'Чат открывается, когда смена подтверждена.';

/** Read ticks: one when sent, two when read. */
function Ticks({ read, color, size = 13 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      {read ? (
        <>
          <Path d="m3 13 3.5 3.5L13 9" />
          <Path d="m11 13 3.5 3.5L21 9" />
        </>
      ) : <Path d="m6 12.5 3.8 3.8L18 8" />}
    </Svg>
  );
}

/**
 * The other side of the conversation. For the employer — the worker. For
 * the worker — the company's contact person (the human who writes), or
 * the company itself when it has none.
 */
function partnerOf(isWorker, company, worker) {
  if (!isWorker) {
    const name = `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim() || 'Исполнитель';
    return { kind: 'person', first: worker?.firstName, last: worker?.lastName, uri: worker?.avatar, name, lastSeen: worker?.lastSeen };
  }
  const contact = company?.contactPerson?.trim();
  if (contact) {
    const [first, ...rest] = contact.split(/\s+/);
    return { kind: 'person', first, last: rest.join(' '), name: contact, company: company?.companyName, lastSeen: company?.lastSeen };
  }
  return { kind: 'company', name: company?.companyName || 'Заказчик', logo: company?.logo, lastSeen: company?.lastSeen };
}

// «Минск» → «в Минске», «Гомель» → «в Гомеле», «Гродно» stays.
function cityIn(city) {
  const s = String(city || 'Минск').trim();
  if (/[ьйа]$/i.test(s)) return `${s.slice(0, -1)}е`;
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(s)) return `${s}е`;
  return s;
}

// «9:38» today, «вчера», «6 сен».
function stamp(iso, now) {
  if (!iso) return '';
  const d = new Date(iso);
  return dayLabel(d, now) === 'Сегодня' ? clock(iso) : ago(isoDay(d), now);
}

// «Оператор ПВЗ · сегодня 10:00» · «Сборщик заказов · выполнена»
function shiftLine(shift, now) {
  if (!shift) return null;
  if (shift.status === 'cancelled') return `${shift.title} · отменена`;
  if (shift.status === 'completed' || shiftEnd(shift) < now) return `${shift.title} · выполнена`;
  const label = dayLabel(shift.date, now);
  const day = label === 'Сегодня' || label === 'Завтра' || label === 'Вчера' ? label.toLowerCase() : `${shortDate(shift.date)},`;
  return `${shift.title} · ${day} ${shift.timeStart}`;
}

function CountBadge({ n }) {
  const { c } = useTheme();
  return (
    <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
      <T v="badge" c="onBrand" maxFontSizeMultiplier={1.3} style={{ fontSize: 11.5, lineHeight: 14, letterSpacing: 0 }}>{n > 99 ? '99+' : n}</T>
    </View>
  );
}

function ChatRow({ item, meId, now, onPress, last }) {
  const { c } = useTheme();
  const { partner, shift, company, lastMsg, unread } = item;
  const bg = unread ? c.brandTint : c.surface;
  const mine = !!lastMsg && lastMsg.senderId === meId;
  const preview = lastMsg ? (lastMsg.imageUri && !lastMsg.text ? 'Фото' : lastMsg.text) : 'Напиши первым';
  const line = shiftLine(shift, now);
  const time = stamp(lastMsg?.createdAt || item.cv.createdAt, now);
  const online = presence(partner.lastSeen, now) === 'в сети';
  const a11y = [
    partner.name,
    partner.company,
    online ? 'в сети' : null,
    line,
    unread ? `${unread} ${plural(unread, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}` : null,
    `${mine ? 'Ты: ' : ''}${preview}`,
    mine ? (lastMsg.read ? 'прочитано' : 'отправлено') : null,
    time,
  ].filter(Boolean).join(', ');

  return (
    <View>
      <Press feedback="highlight" onPress={onPress} style={{ backgroundColor: bg }} accessibilityLabel={a11y}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
          {partner.kind === 'person'
            ? <PersonMono first={partner.first} last={partner.last} uri={partner.uri} size={46} online={online} ring={bg} />
            : <CompanyMono name={partner.name} logo={partner.logo} size={46} category={categoryOf(shift, company)} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <T v="rowTitle" style={{ flex: 1, fontSize: 16, lineHeight: 20 }} numberOfLines={1}>{partner.name}</T>
              <T v="caption" c="ink2" style={{ fontSize: 12, lineHeight: 15 }}>{time}</T>
            </View>
            {line ? (
              <T v="caption" c={unread ? 'brand' : 'ink2'} weight="500" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }} numberOfLines={2}>{line}</T>
            ) : null}
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: unread ? 'flex-end' : 'center', gap: mine && !unread ? 5 : 8 }}>
              {mine && !unread ? <Ticks read={lastMsg.read} color={c.ink2} /> : null}
              <T v="body" c={unread ? 'ink' : 'ink2'} weight={unread ? '500' : '400'} style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19 }} numberOfLines={1}>
                {preview}
              </T>
              {unread ? <CountBadge n={unread} /> : null}
            </View>
          </View>
        </View>
      </Press>
      {!last ? <Divider /> : null}
    </View>
  );
}

export default function ChatListScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const conversations = useStore((s) => s.conversations);
  const workers = useStore((s) => s.workers);
  const companies = useStore((s) => s.companies);
  const shifts = useStore((s) => s.shifts);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const isWorker = me?.role !== 'employer';
  const [query, setQuery] = useState('');
  const now = new Date();

  const chats = useMemo(() => {
    if (!me) return [];
    return conversations
      .filter((cv) => cv.workerId === me.id || cv.companyId === me.id)
      .filter((cv) => !blockedUsers.includes(isWorker ? cv.companyId : cv.workerId))
      .map((cv) => {
        const shift = shifts.find((s) => s.id === cv.shiftId);
        const company = companies.find((co) => co.id === cv.companyId);
        const worker = workers.find((w) => w.id === cv.workerId);
        const msgs = cv.messages || [];
        const lastMsg = msgs[msgs.length - 1];
        const unread = msgs.filter((m) => m.senderId !== me.id && m.senderId !== 'system' && !m.read).length;
        return { cv, shift, company, partner: partnerOf(isWorker, company, worker), lastMsg, unread };
      })
      .sort((a, b) => String(b.cv.lastMessageAt || b.cv.createdAt).localeCompare(String(a.cv.lastMessageAt || a.cv.createdAt)));
  }, [me, conversations, shifts, workers, companies, blockedUsers, isWorker]);

  const unreadTotal = chats.reduce((n, x) => n + x.unread, 0);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter((x) => [x.partner.name, x.company?.companyName, x.shift?.title, x.lastMsg?.text]
      .some((s) => s && String(s).toLowerCase().includes(q)));
  }, [chats, query]);

  // The worker's next step from an empty list: the feed, with an exact number.
  const openCount = useMemo(() => (isWorker ? visibleShifts(shifts, blockedUsers).length : 0), [isWorker, shifts, blockedUsers]);
  const city = me?.city || 'Минск';

  const title = (
    <LargeTitle
      title="Чаты"
      subtitle={chats.length ? (unreadTotal ? `${unreadTotal} ${plural(unreadTotal, ['непрочитанное', 'непрочитанных', 'непрочитанных'])}` : 'Всё прочитано') : undefined}
    />
  );

  // ── Empty: explains the rule and offers the next step ─────────
  if (!me || chats.length === 0) {
    const sky = t.sky('day');
    const action = !me
      ? { title: 'Войти', onPress: () => navigation.navigate('Profile') }
      : isWorker
        ? { title: openCount ? `Смотреть ${openCount} ${plural(openCount, ['смену', 'смены', 'смен'])} в ${cityIn(city)}` : 'Открыть ленту смен', onPress: () => navigation.navigate('Shifts') }
        : { title: 'Мои смены и отклики', onPress: () => navigation.navigate('EmpShifts') };
    return (
      <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: tabSpace }}>
        {title}
        <View style={{ marginTop: 44, alignItems: 'center' }}>
          <SkyView sky={sky} radius={24} style={{ width: 72, height: 72, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bubble.left" size={32} c={sky.ink} />
          </SkyView>
          <T v="titleSection" display weight="800" style={{ marginTop: 16, fontSize: 20, lineHeight: 26, textAlign: 'center' }} accessibilityRole="header">
            Переписок пока нет
          </T>
          <T v="body" c="ink2" style={{ marginTop: 8, marginHorizontal: 14, fontSize: 14.5, lineHeight: 22, textAlign: 'center' }}>
            {isWorker
              ? `${RULE} Так заказчик не пишет до того, как выбрал человека.`
              : 'Чат с исполнителем открывается, когда ты подтверждаешь отклик.'}
          </T>
          <Button title={action.title} onPress={action.onPress} style={{ marginTop: 18, alignSelf: 'stretch', minHeight: 50, borderRadius: 16 }} textStyle={{ fontSize: 16.5 }} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: tabSpace }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {title}
      <SearchField value={query} onChangeText={setQuery} placeholder="Поиск по чатам" style={{ marginTop: 14 }} />

      {shown.length ? (
        <View style={[{ marginTop: 14, borderRadius: 20, backgroundColor: c.surface }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: c.line }]}>
          <View style={{ borderRadius: 20, overflow: 'hidden' }}>
            {shown.map((item, i) => (
              <ChatRow
                key={item.cv.id}
                item={item}
                meId={me.id}
                now={now}
                last={i === shown.length - 1}
                onPress={() => navigation.navigate('ChatConversation', { conversationId: item.cv.id })}
              />
            ))}
          </View>
        </View>
      ) : (
        <EmptyState
          icon="magnifyingglass"
          tone="neutral"
          title={`По запросу «${query.trim()}» ничего`}
          text="Ищи по имени, компании или названию смены."
          action="Очистить поиск"
          actionVariant="secondary"
          onAction={() => setQuery('')}
        />
      )}

      <T v="caption" c="ink2" style={{ marginTop: 14, paddingHorizontal: 4, fontSize: 12.5, lineHeight: 18 }}>{RULE}</T>
    </ScrollView>
  );
}
