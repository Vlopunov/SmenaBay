// «Мои смены» — screen 11. On top, one pass: the nearest confirmed shift.
// If it was confirmed since the last visit, the sky grows and the
// countdown rises (§9.1 · 2). Then «Ждут ответа», then history. The month
// in money lives in the subtitle — a reference, not a KPI tile.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { LargeTitle, SectionTitle, EmptyState, Group, Divider, Press, CircleButton, Card } from '../../design/ui';
import PassCard, { PassCompact, useNow } from '../../design/PassCard';
import { ShiftLine } from '../../design/ShiftCard';
import Money from '../../design/Money';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import {
  money, monthName, capitalize, dayLabel, shortDate, timeRange, plural, parseDay, shiftEnd, waitedFor,
} from '../../design/format';
import { visibleShifts } from './shiftFilters';
import useStore from '../../store/useStore';

const smena = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;

function dayWord(shift, now) {
  const d = dayLabel(shift.date, now);
  return d === 'Сегодня' || d === 'Завтра' || d === 'Вчера' ? d.toLowerCase() : shortDate(shift.date);
}

function HistoryRow({ x, me, reviews, onPress, last }) {
  const cancelled = x.app.status === 'cancelled_by_worker' || x.shift.status === 'cancelled';
  const rejected = x.app.status === 'rejected' && !cancelled;
  const worked = !cancelled && !rejected && (x.app.status === 'approved' || x.app.status === 'completed');
  const reviewed = reviews.some((r) => r.shiftId === x.shift.id && r.authorId === me?.id);
  const [label, color] = cancelled ? ['Отменена', 'error']
    : rejected ? ['Не подошло', 'ink2']
      : worked ? (reviewed ? ['Выполнена', 'ink2'] : ['Выполнена · оцени', 'success'])
        : ['Прошла', 'ink2'];
  return (
    <View>
      <Press onPress={onPress} feedback="highlight" accessibilityLabel={`${x.shift.title}, ${label}`}>
        <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="rowTitle" c={cancelled || rejected ? 'ink3' : 'ink'} style={{ fontSize: 15, lineHeight: 19 }} numberOfLines={2}>{x.shift.title}</T>
            <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5 }} numberOfLines={1}>{`${x.company?.companyName || ''} · ${shortDate(x.shift.date)}`}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Money value={x.shift.pay} size="inline" c={cancelled || rejected ? 'ink2' : 'ink'} style={{ fontSize: 15 }} />
            <T v="badge" c={color} style={{ marginTop: 4, fontSize: 11.5, fontWeight: '600', letterSpacing: 0 }}>{label}</T>
          </View>
        </View>
      </Press>
      {!last ? <Divider inset={14} style={{ marginRight: 14 }} /> : null}
    </View>
  );
}

export default function MyShiftsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(30000);
  const [allHistory, setAllHistory] = useState(false);

  const me = useStore((s) => s.currentUser);
  const applications = useStore((s) => s.applications);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const reviews = useStore((s) => s.reviews);
  const blocked = useStore((s) => s.blockedUsers);
  const getLocationById = useStore((s) => s.getLocationById);
  const markSeen = useStore((s) => s.markMyShiftsSeen);
  // Seen-at is kept per user id.
  const seenFor = () => {
    const st = useStore.getState();
    return st.myShiftsSeenAt?.[st.currentUser?.id] || null;
  };

  // Capture the previous visit before marking this one, so a confirmation
  // that happened in between still gets its moment on screen — and only
  // while the tab is actually in front.
  const focused = useIsFocused();
  const prevSeen = useRef(seenFor());
  const wasFocused = useRef(false);
  if (focused && !wasFocused.current) prevSeen.current = seenFor();
  wasFocused.current = focused;
  useFocusEffect(useCallback(() => {
    const id = setTimeout(() => markSeen(), 1500);
    return () => clearTimeout(id);
  }, []));

  const mine = useMemo(() => {
    if (!me) return [];
    return applications
      .filter((a) => a.workerId === me.id)
      .map((a) => {
        const shift = shifts.find((s) => s.id === a.shiftId);
        if (!shift) return null;
        return { app: a, shift, company: companies.find((co) => co.id === shift.companyId), location: getLocationById(shift.locationId) };
      })
      .filter(Boolean);
  }, [me, applications, shifts, companies]);

  const ended = (x) => shiftEnd(x.shift) <= now || x.shift.status === 'completed';
  const confirmed = mine.filter((x) => x.app.status === 'approved' && !ended(x) && x.shift.status !== 'cancelled')
    .sort((a, b) => (a.shift.date + a.shift.timeStart).localeCompare(b.shift.date + b.shift.timeStart));
  const waiting = mine.filter((x) => x.app.status === 'pending' && !ended(x))
    .sort((a, b) => String(b.app.appliedAt).localeCompare(String(a.app.appliedAt)));
  const history = mine.filter((x) => !confirmed.includes(x) && !waiting.includes(x))
    .sort((a, b) => b.shift.date.localeCompare(a.shift.date));

  const worked = (x) => (x.app.status === 'approved' || x.app.status === 'completed') && ended(x) && x.shift.status !== 'cancelled';
  const month = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthWorked = history.filter((x) => worked(x) && parseDay(x.shift.date) >= month);
  const earned = monthWorked.reduce((sum, x) => sum + x.shift.pay, 0);
  const openCount = me ? visibleShifts(shifts, blocked).filter((s) => s.spotsTaken < s.spotsTotal && s.status === 'active').length : 0;
  const city = me?.city || 'Минск';

  const byMonth = useMemo(() => {
    const groups = new Map();
    history.forEach((x) => {
      const d = parseDay(x.shift.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!groups.has(key)) groups.set(key, { title: capitalize(monthName(d)), items: [] });
      groups.get(key).items.push(x);
    });
    return [...groups.values()];
  }, [history]);

  const answeredAt = confirmed[0]?.app.respondedAt;
  const celebrate = focused && !!answeredAt && (!prevSeen.current || new Date(answeredAt) > new Date(prevSeen.current));

  const open = (id) => navigation.navigate('ShiftDetail', { shiftId: id });
  const subtitle = `${capitalize(monthName(now))} · ${monthWorked.length ? `${smena(monthWorked.length)} · ${money(earned)} BYN` : 'пока пусто'}`;

  if (allHistory) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CircleButton icon="chevron.left" onPress={() => setAllHistory(false)} accessibilityLabel="Назад" />
          <T v="titleScreen" style={{ fontSize: 22, lineHeight: 26 }} accessibilityRole="header">История</T>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: tabSpace }}>
          {byMonth.map((g) => (
            <View key={g.title}>
              <SectionTitle title={g.title} right={smena(g.items.length)} style={{ marginTop: 18, marginBottom: 9 }} />
              <Group>
                {g.items.map((x, i) => <HistoryRow key={x.app.id} x={x} me={me} reviews={reviews} last={i === g.items.length - 1} onPress={() => (worked(x) && !reviews.some((r) => r.shiftId === x.shift.id && r.authorId === me?.id) ? navigation.navigate('RateShift', { shiftId: x.shift.id }) : open(x.shift.id))} />)}
              </Group>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  const empty = !me || mine.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 4, paddingBottom: tabSpace }}>
        <LargeTitle title="Мои смены" subtitle={subtitle} />

        {empty ? (
          <EmptyState
            style={{ marginTop: 40 }}
            icon="calendar.badge.checkmark"
            title="Смен пока нет"
            text="Откликнись на смену в ленте — она появится здесь, а потом станет пропуском с отсчётом."
            action={openCount ? `Смотреть ${smena(openCount)} в ${city === 'Минск' ? 'Минске' : 'городе'}` : 'Смотреть смены'}
            onAction={() => navigation.navigate('Shifts')}
          />
        ) : null}

        {confirmed[0] ? (
          <PassCard
            // A fresh mount starts collapsed, so the growth never flashes
            // the finished card first.
            key={`${confirmed[0].app.id}:${celebrate ? 1 : 0}`}
            style={{ marginTop: 16 }}
            shift={confirmed[0].shift}
            company={confirmed[0].company}
            location={confirmed[0].location}
            celebrate={celebrate}
            onPress={() => open(confirmed[0].shift.id)}
          />
        ) : null}
        {confirmed.length > 1 ? (
          <View style={{ marginTop: 8, gap: 8 }}>
            {confirmed.slice(1).map((x) => <PassCompact key={x.app.id} shift={x.shift} onPress={() => open(x.shift.id)} />)}
          </View>
        ) : null}

        {waiting.length ? (
          <>
            <SectionTitle title="Ждут ответа" right={`${waiting.length} ${plural(waiting.length, ['отклик', 'отклика', 'откликов'])}`} style={{ marginTop: 20, marginBottom: 9 }} />
            <View style={{ gap: 8 }}>
              {waiting.map((x) => (
                <ShiftLine
                  key={x.app.id}
                  shift={x.shift}
                  sub={`${x.company?.companyName || ''} · ${dayWord(x.shift, now)} ${timeRange(x.shift)}`}
                  statusText={`Ждёт ${waitedFor(x.app.appliedAt, now)}`}
                  statusC="urgentInk"
                  onPress={() => open(x.shift.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        {!empty && !confirmed.length && !waiting.length ? (
          <Card style={{ marginTop: 16 }}>
            <EmptyState
              style={{ paddingVertical: 22 }}
              title="Активных смен нет"
              text="Откликнись на смену — ответ заказчика придёт в уведомления."
              action={openCount ? `Смотреть ${smena(openCount)}` : 'Смотреть смены'}
              onAction={() => navigation.navigate('Shifts')}
            />
          </Card>
        ) : null}

        {history.length ? (
          <>
            <SectionTitle title="История" right={history.length > 3 ? 'Вся история' : undefined} onRightPress={history.length > 3 ? () => setAllHistory(true) : undefined} style={{ marginTop: 20, marginBottom: 9 }} />
            <Group>
              {history.slice(0, 3).map((x, i, arr) => (
                <HistoryRow
                  key={x.app.id}
                  x={x}
                  me={me}
                  reviews={reviews}
                  last={i === arr.length - 1}
                  onPress={() => (worked(x) && !reviews.some((r) => r.shiftId === x.shift.id && r.authorId === me?.id) ? navigation.navigate('RateShift', { shiftId: x.shift.id }) : open(x.shift.id))}
                />
              ))}
            </Group>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
