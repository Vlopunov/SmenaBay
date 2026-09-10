// Employer dashboard (handoff screen 9). The first number — «ждут ответа» —
// is the only accent one: it is the only thing that needs action now, and it
// rolls when a new application arrives. Under the numbers, the single most
// urgent problem with a button; then the shifts at the point; then regulars.
import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { RoundButton, StatRow, FillBanner, SectionHeader, Separator, PersonAvatar, Press, EmptyState } from '../../design/ui';
import Odometer from '../../design/Odometer';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, timeRange } from '../../design/format';
import ShiftTimeRow from './ShiftTimeRow';
import { employerSnapshot, PLAN_NAMES } from './employerData';
import useStore from '../../store/useStore';
import { Alert } from 'react-native';

function span(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h} ч ${m % 60} мин` : `${m} мин`;
}

export default function DashboardScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(30000);
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const unread = useStore((s) => s.getUnreadCount());
  const invite = useStore((s) => s.inviteWorkerToShift);

  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);
  if (!me) return null;

  const openShifts = snap.upcoming.filter((s) => s.status === 'active' && s.spotsTaken < s.spotsTotal);
  const inviteTo = (w) => {
    if (!openShifts.length) { navigation.navigate('CreateShift'); return; }
    showActions({
      title: `Позвать ${w.firstName}`,
      options: openShifts.map((s) => ({
        label: `${s.title} · ${dayLabel(s.date) === 'Сегодня' || dayLabel(s.date) === 'Завтра' ? dayLabel(s.date) : shortDate(s.date)}, ${timeRange(s)}`,
        onPress: () => {
          const r = invite(w.id, s.id);
          if (r?.error === 'already_invited') { Alert.alert('Уже позвали', `${w.firstName} уже получил(а) приглашение на эту смену.`); return; }
          haptic.success();
        },
      })),
    });
  };

  const soon = snap.soon;
  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <T v="screenTitle" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75} accessibilityRole="header">{me.companyName}</T>
            <T v="caption" c="secondary" style={{ marginTop: 2 }}>
              Тариф «{PLAN_NAMES[me.plan] || PLAN_NAMES.free}» · {me.totalShiftsPublished || snap.own.length} {plural(me.totalShiftsPublished || snap.own.length, ['смена', 'смены', 'смен'])} на платформе
            </T>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, paddingTop: 4 }}>
            <RoundButton icon="bell" variant="fill" badge={unread} onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Уведомления" />
            <RoundButton icon="plus" variant="accent" iconSize={18} onPress={() => navigation.navigate('CreateShift')} accessibilityLabel="Создать смену" />
          </View>
        </View>

        <StatRow
          style={{ marginTop: 22 }}
          items={[
            { label: 'ждут ответа', node: <Odometer value={snap.pending} v="title" c={snap.pending ? 'accent' : 'label'} style={{ marginBottom: 0 }} /> },
            { label: plural(snap.upcoming.length, ['активная', 'активных', 'активных']), value: String(snap.upcoming.length) },
            { label: 'за месяц', value: String(snap.monthCount) },
            { label: 'заполнено', value: `${snap.fillRate}%` },
          ]}
        />

        {soon ? (
          <FillBanner
            style={{ marginTop: 20 }}
            title={`${dayLabel(soon.shift.date)} в ${soon.shift.timeStart} не хватает ${soon.free === 1 ? 'человека' : `${soon.free} человек`}`}
            text={`${soon.pending ? `${soon.pending} ${plural(soon.pending, ['отклик', 'отклика', 'откликов'])}` : 'Откликов пока нет'} на ${soon.free === 1 ? 'одно место' : `${soon.free} ${plural(soon.free, ['место', 'места', 'мест'])}`} · до начала ${span(soon.msLeft)}`}
            action={soon.pending ? 'Открыть' : 'Позвать'}
            onAction={() => (soon.pending ? navigation.navigate('Applications', { shiftId: soon.shift.id }) : navigation.navigate('Favorites', { inviteShiftId: soon.shift.id }))}
          />
        ) : <Separator style={{ marginTop: 20 }} />}

        <SectionHeader title="Смены на точке" top={!!soon} right={snap.upcoming.length > 5 ? 'Все' : undefined} onRightPress={() => navigation.navigate('EmpShifts')} />
        {snap.upcoming.length ? snap.upcoming.slice(0, 5).map((s, i, arr) => (
          <ShiftTimeRow key={s.id} shift={s} approved={snap.approvedFor(s.id)} pending={snap.pendingFor(s.id)} last={i === arr.length - 1} onPress={() => navigation.navigate('ShiftManage', { shiftId: s.id })} />
        )) : (
          <EmptyState
            title="На точке нет активных смен"
            text={snap.regulars.length ? `${snap.regulars.length} ${plural(snap.regulars.length, ['исполнитель уже работал', 'исполнителя уже работали', 'исполнителей уже работали'])} у тебя — их можно позвать сразу после публикации.` : 'Опубликуй смену — отклики обычно приходят в первые часы.'}
            action="Создать смену"
            onAction={() => navigation.navigate('CreateShift')}
          />
        )}

        {snap.regulars.length ? (
          <>
            <SectionHeader title="Кто чаще всех выходит" />
            {snap.regulars.map(({ worker: w, count }, i) => {
              const cancels = snap.cancelsOf(w.id);
              return (
                <View key={w.id}>
                  <Press feedback="highlight" onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                      <PersonAvatar first={w.firstName} last={w.lastName} uri={w.avatar} size={36} />
                      <View style={{ flex: 1 }}>
                        <T v="value" style={{ fontWeight: '600' }}>{w.firstName} {w.lastName}</T>
                        <T v="caption" c="secondary" numberOfLines={1}>★ {w.rating ? w.rating.toFixed(1) : '—'} · {count} {plural(count, ['смена', 'смены', 'смен'])} у тебя · {cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен'}</T>
                      </View>
                      <Press feedback="none" onPress={() => inviteTo(w)} hitSlop={10} accessibilityLabel={`Позвать ${w.firstName}`}>
                        <T v="bodyStrong" c="accent">Позвать</T>
                      </Press>
                    </View>
                  </Press>
                  {i < snap.regulars.length - 1 ? <Separator inset /> : null}
                </View>
              );
            })}
          </>
        ) : null}
        <Separator />
      </ScrollView>
    </View>
  );
}
