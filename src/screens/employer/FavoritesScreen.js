// «Свои люди» — screen 32. Workers the employer marked. Opened with
// `inviteShiftId` («Позвать на смену»), the shift is pinned on top on its
// sky and every person gets a state: responded, invited, busy at that time
// on another confirmed shift, or «Позвать». A long name truncates; the
// button never moves.
import React, { useMemo, useState } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Press, Card, EmptyState } from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { PersonMono } from '../../design/Monogram';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, shiftStart, shiftEnd } from '../../design/format';
import useStore from '../../store/useStore';

const seatsLeft = (n) => `${n} ${plural(n, ['место', 'места', 'мест'])}`;

/** Non-interactive state on the right: «Занят», «Позвали», «Откликнулся». */
function StatePill({ label }) {
  const { c } = useTheme();
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 13, borderRadius: 13, backgroundColor: c.surface2 }}>
      <T v="bodyStrong" c="ink2" style={{ fontSize: 13.5, lineHeight: 16 }}>{label}</T>
    </View>
  );
}

export default function FavoritesScreen({ route, navigation }) {
  const inviteShiftId = route?.params?.inviteShiftId;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const favMap = useStore((s) => s.favorites);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const invitations = useStore((s) => s.invitations);
  const blocked = useStore((s) => s.blockedUsers);
  const shift = useStore((s) => (inviteShiftId ? s.getShiftById(inviteShiftId) : null));
  const invite = useStore((s) => s.inviteWorkerToShift);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [sent, setSent] = useState({});

  const people = useMemo(() => {
    const ids = (me && favMap[me.id]) || [];
    return workers.filter((w) => ids.includes(w.id) && !blocked.includes(w.id));
  }, [me, favMap, workers, blocked]);

  // Worked here: approved on this company's shifts that have ended.
  const withUs = useMemo(() => {
    const now = new Date();
    const own = new Map(shifts.filter((s) => s.companyId === me?.id).map((s) => [s.id, s]));
    const n = {};
    applications.forEach((a) => {
      const s = own.get(a.shiftId);
      if (a.status === 'approved' && s && shiftEnd(s) <= now) n[a.workerId] = (n[a.workerId] || 0) + 1;
    });
    return n;
  }, [shifts, applications, me?.id]);

  // Busy: confirmed on another shift that overlaps the one we invite to.
  const busyIds = useMemo(() => {
    if (!shift) return new Set();
    const a0 = shiftStart(shift); const a1 = shiftEnd(shift);
    const byId = new Map(shifts.map((s) => [s.id, s]));
    const ids = new Set();
    applications.forEach((a) => {
      if (a.status !== 'approved' || a.shiftId === shift.id) return;
      const s = byId.get(a.shiftId);
      if (!s || s.status === 'cancelled') return;
      if (shiftStart(s) < a1 && a0 < shiftEnd(s)) ids.add(a.workerId);
    });
    return ids;
  }, [shift, shifts, applications]);

  const cancelsOf = (id) => applications.filter((a) => a.workerId === id && a.status === 'cancelled_by_worker').length;
  const invited = (id) => sent[id] || invitations.some((i) => i.workerId === id && i.shiftId === inviteShiftId);
  const applied = (id) => applications.some((a) => a.workerId === id && a.shiftId === inviteShiftId && a.status !== 'cancelled_by_worker');

  let pinned = null;
  if (inviteShiftId && shift) {
    const s = t.sky(skyKey(shift, { ignoreClosed: true }));
    const d = dayLabel(shift.date);
    const when = d === 'Сегодня' || d === 'Завтра' ? d.toLowerCase() : shortDate(shift.date);
    const approved = applications.filter((a) => a.shiftId === shift.id && a.status === 'approved').length;
    const free = Math.max(0, shift.spotsTotal - approved);
    pinned = (
      <SkyView sky={s} radius={16} style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
        <Icon name="bolt.fill" size={19} c={s.ink} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="bodyStrong" c={s.ink} weight="700" style={{ fontSize: 14.5, lineHeight: 18 }}>Позвать на смену</T>
          <T v="caption" c={s.ink2} numberOfLines={2} style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>
            {`${shift.title} · ${when} ${shift.timeStart} · ${free ? seatsLeft(free) : 'мест нет'}`}
          </T>
        </View>
      </SkyView>
    );
  }

  const sendInvite = (w) => {
    invite(w.id, inviteShiftId);
    setSent((x) => ({ ...x, [w.id]: true }));
    haptic.success();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: g, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} iconSize={20} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="rowTitle" numberOfLines={1} accessibilityRole="header" style={{ fontSize: 17, lineHeight: 21 }}>Свои люди</T>
          <T v="caption" c="ink2" style={{ marginTop: 1, fontSize: 12.5, lineHeight: 15 }}>
            {people.length ? `${people.length} ${plural(people.length, ['человек', 'человека', 'человек'])}` : 'Пока никого'}
          </T>
        </View>
      </View>
      <FlatList
        data={people}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: g, paddingBottom: insets.bottom + 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListHeaderComponent={<View style={{ paddingBottom: 14 }}>{pinned}</View>}
        ListEmptyComponent={(
          <Card style={{ marginTop: pinned ? 0 : 4 }}>
            <EmptyState
              icon="person.2"
              title="Своих людей пока нет"
              text="Отмечай сердцем тех, кто хорошо отработал, — потом их можно позвать на смену в одно касание."
              action="Открыть каталог"
              onAction={() => navigation.navigate('WorkerDirectory')}
            />
          </Card>
        )}
        ListFooterComponent={inviteShiftId && people.length ? (
          <T v="caption" c="ink2" style={{ marginTop: 14, paddingHorizontal: 4, fontSize: 12.5, lineHeight: 18 }}>
            Приглашение придёт уведомлением. Место остаётся в ленте, пока человек не откликнется.
          </T>
        ) : null}
        renderItem={({ item: w }) => {
          const cancels = cancelsOf(w.id);
          const here = withUs[w.id] || 0;
          const shiftsText = here
            ? `${here} ${plural(here, ['смена', 'смены', 'смен'])} у тебя`
            : `${w.shiftsCompleted || 0} ${plural(w.shiftsCompleted || 0, ['смена', 'смены', 'смен'])}`;
          const stats = `★ ${w.rating ? w.rating.toFixed(1) : '—'} · ${shiftsText} · ${cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен'}`;
          let right = <Icon name="chevron.right" size={14} c="ink2" weight="semibold" style={{ opacity: 0.6 }} />;
          if (inviteShiftId) {
            if (applied(w.id)) right = <StatePill label="Откликнулся" />;
            else if (invited(w.id)) right = <StatePill label="Позвали" />;
            else if (busyIds.has(w.id)) right = <StatePill label="Занят" />;
            else {
              right = (
                <Press
                  onPress={() => sendInvite(w)}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                  accessibilityLabel={`Позвать ${w.firstName} на смену`}
                  style={{ paddingVertical: 10, paddingHorizontal: 13, borderRadius: 13, backgroundColor: c.brandTint }}
                >
                  <T v="bodyStrong" c="brand" weight="700" style={{ fontSize: 13.5, lineHeight: 16 }}>Позвать</T>
                </Press>
              );
            }
          }
          return (
            <Card
              radius={18}
              onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}
              onLongPress={() => showActions({ title: `${w.firstName} ${w.lastName}`, options: [{ label: 'Убрать из своих', destructive: true, onPress: () => { toggleFavorite(w.id); haptic.medium(); } }] })}
              accessibilityLabel={`${w.firstName} ${w.lastName}, ${stats.replace('★', 'рейтинг')}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingLeft: 14, paddingRight: 12 }}
            >
              <PersonMono first={w.firstName} last={w.lastName} uri={w.avatar} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="rowTitle" numberOfLines={1} style={{ fontSize: 15.5, lineHeight: 19 }}>{w.firstName} {w.lastName}</T>
                <T v="caption" c="ink2" numberOfLines={1} style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>{stats}</T>
              </View>
              <View style={{ flexShrink: 0 }}>{right}</View>
            </Card>
          );
        }}
      />
    </View>
  );
}
