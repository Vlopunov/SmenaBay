// «Смены» заказчика — screen 24. The composition is visible right in the
// card: monograms of the taken seats and a dashed «+» for each free one. The
// subtitle counts what the employer actually cares about — seats closed. An
// under-filled shift with nobody waiting offers «Поднять оплату» at once.
import React, { useMemo, useState } from 'react';
import { View, SectionList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import { CircleButton, Card, SectionTitle, EmptyState, Press } from '../../design/ui';
import { SkyBand } from '../../design/ShiftCard';
import { skyKey } from '../../design/Sky';
import { StatusBadge, SeatDots } from '../../design/Status';
import { PersonMono } from '../../design/Monogram';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import {
  daySection, plural, monthName, capitalize, parseDay, timeRange, hours, money, seats, shiftStart,
} from '../../design/format';
import { employerSnapshot } from './employerData';
import useStore from '../../store/useStore';

const smena = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;
const responses = (n) => `${n} ${plural(n, ['отклик', 'отклика', 'откликов'])}`;

/** Full-width text segments, as in the mockup: brand label on a raised thumb. */
function Segments({ items, value, onChange, style }) {
  const t = useTheme();
  const { c } = t;
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: 'row', padding: 3, gap: 2, borderRadius: 12, backgroundColor: c.surface2 }, style]}>
      {items.map((it) => {
        const on = it.key === value;
        return (
          <Press
            key={it.key}
            onPress={() => { if (!on) { haptic.selection(); onChange(it.key); } }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[
              { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 9, backgroundColor: on ? c.surface : 'transparent' },
              on && { shadowColor: c.shadow, shadowOpacity: t.dark ? 0 : 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
            ]}
          >
            <T v="bodyStrong" c={on ? 'brand' : 'ink2'} style={{ fontSize: 14.5, lineHeight: 18, fontWeight: on ? '600' : '500' }}>{it.label}</T>
          </Press>
        );
      })}
    </View>
  );
}

function FreeSeatDot() {
  const { c } = useTheme();
  return (
    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.surface2, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="plus" size={12} c="ink2" weight="bold" />
    </View>
  );
}

function EmployerShiftCard({ shift, people, approved, pending, address, past, now, onOpen, onApplications, onRaise }) {
  const { c } = useTheme();
  const cancelled = shift.status === 'cancelled';
  const total = shift.spotsTotal;
  const free = Math.max(0, total - approved);
  const running = !past && shiftStart(shift) <= now;

  // Centred in the band (the badge itself aligns to flex-start).
  const mid = { alignSelf: 'center' };
  let badge = null;
  if (past) {
    badge = cancelled
      ? <StatusBadge state="cancelled" size="sm" style={mid} />
      : approved ? <StatusBadge state="done" size="sm" style={mid} /> : <StatusBadge state="rejected" label="Без исполнителей" size="sm" onSky style={mid} />;
  } else if (running) badge = <StatusBadge state="running" label="Идёт" size="sm" style={mid} />;
  else if (shift.urgent) badge = <StatusBadge state="urgent" size="sm" style={mid} />;

  // Up to four seats read as people; more — as dots.
  const asPeople = total <= 4;
  let action = null;
  if (!past && pending) {
    action = (
      <Press onPress={onApplications} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }} accessibilityLabel={`${responses(pending)}, открыть`} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, backgroundColor: c.urgentTint }}>
        <T v="badge" c="urgentInk" style={{ fontSize: 11.5, lineHeight: 14, letterSpacing: 0 }}>{responses(pending)}</T>
      </Press>
    );
  } else if (!past && free) {
    action = (
      <Press onPress={onRaise} hitSlop={{ top: 14, bottom: 12, left: 8, right: 8 }} accessibilityLabel="Поднять оплату">
        <T v="caption" c="brand" weight="600" style={{ fontSize: 12.5, lineHeight: 16 }}>Поднять оплату</T>
      </Press>
    );
  }

  const a11y = `${shift.title}, ${timeRange(shift)}${address ? `, ${address}` : ''}. ${shift.pay} BYN за место. ${cancelled ? 'Смена отменена' : `${approved} из ${total} мест закрыто`}${!past && pending ? `, ${responses(pending)}` : ''}${!past && shift.urgent ? '. Срочно' : ''}.`;

  return (
    <Card onPress={onOpen} accessibilityLabel={a11y} border={past} style={past && { shadowOpacity: 0 }}>
      {/* Clip on an inner layer: overflow on the card itself would clip its shadow. */}
      <View style={{ borderRadius: 20, overflow: 'hidden' }}>
        <SkyBand
          sky={past ? 'closed' : skyKey(shift, { now, ignoreClosed: true })}
          text={`${timeRange(shift)} · ${hours(shift.durationHours)}`}
          right={badge}
          height={34}
          fontSize={13.5}
        />
        <View style={{ paddingTop: 12, paddingHorizontal: 14, paddingBottom: 13 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" c={cancelled ? 'ink3' : 'ink'} numberOfLines={2}>{shift.title}</T>
              {address ? <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }} numberOfLines={1}>{address}</T> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Money value={shift.pay} size="inline" c={cancelled ? 'ink2' : 'ink'} />
              {total > 1 ? <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 11.5, lineHeight: 14 }}>{`${money(shift.pay * total)} BYN всего`}</T> : null}
            </View>
          </View>

          {!cancelled ? (
            <View style={{ marginTop: 12, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: asPeople ? 7 : 6, flexShrink: 1 }}>
                {asPeople ? (
                  <>
                    {people.slice(0, total).map((w) => <PersonMono key={w.id} first={w.firstName} last={w.lastName} uri={w.avatar} size={26} />)}
                    {!past ? Array.from({ length: free }).map((_, i) => <FreeSeatDot key={`f${i}`} />) : null}
                  </>
                ) : (
                  <SeatDots taken={approved} total={total} size={9} />
                )}
                <T v="caption" c="ink2" weight="500" style={{ fontSize: 12.5, lineHeight: 16, flexShrink: 1 }} numberOfLines={1}>{seats(approved, total)}</T>
              </View>
              {action}
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export default function EmployerShiftsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 16 : 20;
  const now = useNow(30000);
  const [tab, setTab] = useState('upcoming');
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);

  // Confirmed people per shift, for the monograms in the card.
  const crew = useMemo(() => {
    const map = {};
    applications.forEach((a) => {
      if (a.status !== 'approved') return;
      const w = workers.find((x) => x.id === a.workerId);
      if (w) (map[a.shiftId] = map[a.shiftId] || []).push(w);
    });
    return map;
  }, [applications, workers]);

  const sections = useMemo(() => {
    const list = tab === 'upcoming' ? snap.upcoming : snap.past;
    const groups = new Map();
    list.forEach((s) => {
      const key = tab === 'upcoming' ? daySection(s.date, now) : capitalize(monthName(parseDay(s.date)));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [snap, tab]);

  const locations = me?.locations || [];
  const addressOf = (id) => locations.find((l) => l.id === id)?.address || '';

  const active = snap.upcoming.length;
  const seatsTotal = snap.upcoming.reduce((n, s) => n + s.spotsTotal, 0);
  const seatsClosed = snap.upcoming.reduce((n, s) => n + Math.min(s.spotsTotal, snap.approvedFor(s.id)), 0);
  const subtitle = active
    ? `${active} ${plural(active, ['активная', 'активных', 'активных'])} · ${seatsClosed} ${plural(seatsClosed, ['место', 'места', 'мест'])} из ${seatsTotal} закрыто`
    : 'Активных смен нет';

  const past = tab === 'past';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: G, paddingBottom: tabSpace }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={(
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="titleLarge" style={{ fontSize: 32, lineHeight: 37, letterSpacing: -0.64 }} accessibilityRole="header">Смены</T>
                <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 13.5, lineHeight: 18 }}>{subtitle}</T>
              </View>
              <CircleButton icon="plus" variant="brand" size={44} onPress={() => navigation.navigate('CreateShift')} accessibilityLabel="Создать смену" />
            </View>
            <Segments
              style={{ marginTop: 14 }}
              items={[{ key: 'upcoming', label: 'Впереди' }, { key: 'past', label: 'Прошедшие' }]}
              value={tab}
              onChange={setTab}
            />
          </View>
        )}
        ListEmptyComponent={past
          ? <EmptyState style={{ marginTop: 24 }} icon="clock" tone="neutral" title="Прошедших смен нет" text="Здесь будет история смен и оценки исполнителей." />
          : <EmptyState style={{ marginTop: 24 }} title="Смен впереди нет" text="Опубликуй смену — она сразу появится в ленте у исполнителей." action="Создать смену" onAction={() => navigation.navigate('CreateShift')} />}
        renderSectionHeader={({ section }) => (
          <SectionTitle
            title={section.title}
            right={smena(section.data.length)}
            style={{ marginTop: section.title === sections[0]?.title ? 18 : 20, marginBottom: 10 }}
          />
        )}
        renderItem={({ item }) => (
          <EmployerShiftCard
            shift={item}
            people={crew[item.id] || []}
            approved={snap.approvedFor(item.id)}
            pending={past ? 0 : snap.pendingFor(item.id)}
            address={addressOf(item.locationId)}
            past={past}
            now={now}
            onOpen={() => navigation.navigate('ShiftManage', { shiftId: item.id })}
            onApplications={() => navigation.navigate('Applications', { shiftId: item.id })}
            onRaise={() => navigation.navigate('ShiftManage', { shiftId: item.id, raise: true })}
          />
        )}
      />
    </View>
  );
}
