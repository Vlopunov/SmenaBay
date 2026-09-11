// «Сводка» — screen 23. Not a report: one problem of the day, large, on the
// sky of that shift; numbers in support; then the shifts at a point and the
// people who show up most.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import {
  CircleButton, Card, Chip, SectionTitle, StatTile, Progress, Button, Press, EmptyState,
} from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { SeatDots } from '../../design/Status';
import { PersonMono } from '../../design/Monogram';
import { SkyBand } from '../../design/ShiftCard';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, timeRange, hours, shiftStart, money } from '../../design/format';
import { employerSnapshot, PLAN_NAMES } from './employerData';
import useStore from '../../store/useStore';

const people = (n) => (n === 1 ? 'человека' : `${n} ${plural(n, ['человека', 'человек', 'человек'])}`);
const responsesWord = (n) => `${n} ${plural(n, ['отклик', 'отклика', 'откликов'])}`;

function marketFor(shift, all) {
  const key = (shift?.title || '').split(' ')[0].toLowerCase();
  const pays = all.filter((s) => s.id !== shift?.id && s.title.toLowerCase().startsWith(key)).map((s) => s.pay).sort((a, b) => a - b);
  return pays.length >= 2 ? pays[Math.floor(pays.length / 2)] : null;
}

export default function DashboardScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(30000);
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const unread = useStore((s) => s.getUnreadCount());
  const invite = useStore((s) => s.inviteWorkerToShift);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);
  const [point, setPoint] = useState(null);

  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);
  if (!me) return null;

  const locations = me.locations || [];
  const addressOf = (id) => locations.find((l) => l.id === id)?.address || '';
  const openShifts = snap.upcoming.filter((s) => s.status === 'active' && snap.approvedFor(s.id) < s.spotsTotal);

  const inviteTo = (w) => {
    if (!openShifts.length) {
      Alert.alert('Нет открытых смен', 'Создай смену — и сможешь позвать на неё своих людей.', [
        { text: 'Не сейчас', style: 'cancel' },
        { text: 'Создать смену', onPress: () => navigation.navigate('CreateShift') },
      ]);
      return;
    }
    showActions({
      title: `Позвать ${w.firstName}`,
      options: openShifts.map((s) => ({
        label: `${s.title} · ${dayLabel(s.date) === 'Сегодня' || dayLabel(s.date) === 'Завтра' ? dayLabel(s.date) : shortDate(s.date)}, ${timeRange(s)}`,
        onPress: () => {
          const r = invite(w.id, s.id);
          if (r?.error === 'already_invited') { toast.show({ text: `${w.firstName} уже получил(а) приглашение`, kind: 'info' }); return; }
          toast.success(`Приглашение отправлено · ${w.firstName}`);
        },
      })),
    });
  };

  // ── The one problem of the day ───────────────────────────────
  const within24 = snap.upcoming.filter((s) => shiftStart(s) > now && shiftStart(s) - now < 24 * 3600 * 1000);
  const soon = snap.soon;
  const calm = !soon ? within24[0] || snap.upcoming[0] : null;
  const heroShift = soon?.shift || calm;
  const heroSky = heroShift ? skyKey(heroShift, { now, ignoreClosed: true }) : 'day';
  const s = t.sky(heroSky);

  let hero;
  if (heroShift) {
    const approved = snap.approvedFor(heroShift.id);
    const pending = snap.pendingFor(heroShift.id);
    const d = dayLabel(heroShift.date, now);
    const dayWord = d === 'Сегодня' || d === 'Завтра' ? d : shortDate(heroShift.date);
    const title = soon ? `${dayWord} в ${heroShift.timeStart} не хватает ${people(soon.free)}` : `${dayWord} в ${heroShift.timeStart} люди придут`;
    const chat = () => {
      const a = applications.find((x) => x.shiftId === heroShift.id && x.status === 'approved');
      if (!a) { navigation.navigate('ShiftManage', { shiftId: heroShift.id }); return; }
      const conv = getOrCreateConversation(heroShift.id, a.workerId, heroShift.companyId);
      navigation.navigate('ChatConversation', { conversationId: conv.id });
    };
    hero = (
      <View style={[{ marginTop: 16, borderRadius: 24, backgroundColor: c.surface }, t.sh.e2]}>
        <SkyView sky={s} radius={24} style={{ paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={soon ? 'bolt.fill' : 'checkmark'} size={14} c={soon ? c.urgentInk : c.success} weight="bold" />
            <T v="badge" c={soon ? c.urgentInk : c.success} style={{ fontSize: 12, letterSpacing: 0.24 }}>{soon ? 'ГЛАВНОЕ СЕЙЧАС' : 'ВСЁ ПОД КОНТРОЛЕМ'}</T>
          </View>
          <T v="titleScreen" c={s.ink} style={{ marginTop: 10, fontSize: 23, lineHeight: 29, letterSpacing: -0.23 }}>{title}</T>
          <T v="body" c={s.ink2} weight="500" style={{ marginTop: 8, fontSize: 14, lineHeight: 20 }}>
            {`${heroShift.title} · ${heroShift.pay} BYN · ${approved} из ${heroShift.spotsTotal} мест`}{addressOf(heroShift.locationId) ? `\n${addressOf(heroShift.locationId)}` : ''}
          </T>
          <View style={{ marginTop: 14, flexDirection: 'row', gap: 9 }}>
            {soon ? (
              <Button
                style={{ flex: 1, minHeight: 48, borderRadius: 15 }}
                title={pending ? `Разобрать ${responsesWord(pending)}` : 'Позвать своих'}
                onPress={() => (pending ? navigation.navigate('Applications', { shiftId: heroShift.id }) : navigation.navigate('Favorites', { inviteShiftId: heroShift.id }))}
              />
            ) : (
              <Button style={{ flex: 1, minHeight: 48, borderRadius: 15 }} variant="onSky" color={s.ink} title="Смена и состав" onPress={() => navigation.navigate('ShiftManage', { shiftId: heroShift.id })} />
            )}
            <Press onPress={chat} accessibilityLabel="Написать исполнителю" style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: c.onSky, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bubble.left" size={21} c="brand" weight="semibold" />
            </Press>
          </View>
        </SkyView>
      </View>
    );
  } else {
    const market = marketFor({ title: 'Оператор' }, shifts);
    hero = (
      <Card style={{ marginTop: 16 }}>
        <EmptyState
          title="Смен нет — и это нормально"
          text={market ? `Опубликуй первую смену: похожие в городе чаще платят ${market} BYN за 8 часов.` : 'Опубликуй смену — она сразу появится в ленте у исполнителей.'}
          action="Создать смену"
          onAction={() => navigation.navigate('CreateShift')}
          secondary={snap.regulars.length ? 'Позвать своих людей' : undefined}
          onSecondary={() => navigation.navigate('Favorites')}
        />
      </Card>
    );
  }

  const list = snap.upcoming.filter((x) => !point || x.locationId === point);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: 20, paddingBottom: tabSpace }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="titleScreen" accessibilityRole="header">Сводка</T>
            <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 13.5 }} numberOfLines={2}>
              {`${me.companyName} · «${PLAN_NAMES[me.plan] || PLAN_NAMES.free}» · ${me.totalShiftsPublished || snap.own.length} ${plural(me.totalShiftsPublished || snap.own.length, ['смена', 'смены', 'смен'])}`}
            </T>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <CircleButton icon="bell" badge={unread} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Уведомления" />
            <CircleButton icon="plus" variant="brand" size={44} onPress={() => navigation.navigate('CreateShift')} accessibilityLabel="Создать смену" />
          </View>
        </View>

        {hero}

        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          <StatTile value={String(snap.pending)} label={'ждут\nответа'} />
          <StatTile value={String(snap.upcoming.length)} label={`${plural(snap.upcoming.length, ['активная', 'активных', 'активных'])}\n${plural(snap.upcoming.length, ['смена', 'смены', 'смен'])}`} />
          <StatTile value={`${snap.fillRate}%`} label="заполнено за месяц" flex={1.4}>
            <Progress value={snap.fillRate} style={{ marginTop: 6 }} />
          </StatTile>
        </View>

        <SectionTitle title="Смены на точке" size={18} right="Все смены" onRightPress={() => navigation.navigate('EmpShifts')} style={{ marginTop: 18 }} />
        {locations.length > 1 ? (
          <View style={{ marginTop: 9, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {locations.map((l) => (
              <Chip key={l.id} size="sm" label={l.address.replace(/^(ул\.|пр\.|пр-т|просп\.)\s*/i, '')} selected={point === l.id} onPress={() => { haptic.selection(); setPoint(point === l.id ? null : l.id); }} />
            ))}
          </View>
        ) : null}
        <View style={{ marginTop: 10, gap: 8 }}>
          {list.length ? list.slice(0, 5).map((x) => {
            const approved = snap.approvedFor(x.id);
            const d = dayLabel(x.date, now);
            return (
              <Card key={x.id} onPress={() => navigation.navigate('ShiftManage', { shiftId: x.id })} clip accessibilityLabel={`${x.title}, ${approved} из ${x.spotsTotal} мест`}>
                <SkyBand sky={skyKey(x, { now, ignoreClosed: true })} text={`${d === 'Сегодня' || d === 'Завтра' ? d : shortDate(x.date)} · ${timeRange(x)} · ${hours(x.durationHours)}`} height={34} fontSize={13.5} />
                <View style={{ paddingTop: 11, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="rowTitle" style={{ fontSize: 16 }} numberOfLines={2}>{x.title}</T>
                    <T v="caption" c="ink2" style={{ marginTop: 3 }}>{`${money(x.pay)} BYN за место · ${money(x.pay * x.spotsTotal)} BYN всего`}</T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="moneyInline" style={{ fontSize: 15 }}>{`${approved} из ${x.spotsTotal}`}</T>
                    {x.spotsTotal <= 8 ? <View style={{ marginTop: 5 }}><SeatDots taken={approved} total={x.spotsTotal} size={9} /></View> : null}
                  </View>
                </View>
              </Card>
            );
          }) : (
            <Card flat style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
              <T v="bodyStrong" c="ink2">{point ? 'На этой точке смен нет' : 'Активных смен нет'}</T>
            </Card>
          )}
        </View>

        {snap.regulars.length ? (
          <>
            <SectionTitle title="Кто чаще всех выходит" size={18} style={{ marginTop: 18 }} />
            <View style={{ marginTop: 9, gap: 8 }}>
              {snap.regulars.slice(0, 3).map(({ worker: w, count }) => {
                const cancels = snap.cancelsOf(w.id);
                return (
                  <Card key={w.id} flat onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })} style={{ paddingVertical: 11, paddingLeft: 14, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <PersonMono first={w.firstName} last={w.lastName} uri={w.avatar} size={42} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="rowTitle" style={{ fontSize: 15.5 }} numberOfLines={1}>{w.firstName} {w.lastName}</T>
                      <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Icon name="star.fill" size={11} c={c.star} />
                        <T v="caption" c="ink3" weight="600" style={{ fontSize: 12.5 }}>{w.rating ? w.rating.toFixed(1) : '—'}</T>
                        <T v="caption" c="ink2" style={{ fontSize: 12.5, flexShrink: 1 }} numberOfLines={1}>{`· ${count} ${plural(count, ['смена', 'смены', 'смен'])} у тебя · ${cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен'}`}</T>
                      </View>
                    </View>
                    <Button title="Позвать" size="sm" variant="secondary" onPress={() => inviteTo(w)} />
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
