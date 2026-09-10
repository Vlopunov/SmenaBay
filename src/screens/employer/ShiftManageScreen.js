// «Смена и состав» (handoff screen 12). The free seat is a row with a dashed
// outline and a «Выбрать» button — not an absence. At the bottom the shift is
// shown exactly as workers see it in the feed: if the pay is below market,
// it shows on the employer's own screen.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import {
  NavBar, RoundButton, LedgerRow, Separator, SeatsBar, SectionHeader, PersonAvatar, Button, Press, StatusPill, Note,
} from '../../design/ui';
import { FeedShiftRow } from '../../design/ShiftRow';
import Sheet from '../../design/Sheet';
import Slider from '../../design/Slider';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { money, dayLabel, shortDate, timeRange, countdown, plural, hours } from '../../design/format';
import { showActions } from '../../design/ActionSheet';
import useStore from '../../store/useStore';

function FreeSeat({ waiting, onPick }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
      <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.labelTertiary, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="person" size={15} c="tertiary" />
      </View>
      <View style={{ flex: 1 }}>
        <T v="value">Место свободно</T>
        <T v="caption" c="secondary">{waiting ? `${waiting} ${plural(waiting, ['человек ждёт', 'человека ждут', 'человек ждут'])} ответа` : 'Откликов пока нет'}</T>
      </View>
      {waiting ? <Button title="Выбрать" size="sm" onPress={onPick} /> : null}
    </View>
  );
}

export default function ShiftManageScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow(30000);

  const shift = useStore((s) => s.getShiftById(shiftId));
  const company = useStore((s) => s.currentUser);
  const location = useStore((s) => (shift ? s.getLocationById(shift.locationId) : null));
  const allApplications = useStore((s) => s.applications);
  const applications = useMemo(() => allApplications.filter((a) => a.shiftId === shiftId), [allApplications, shiftId]);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const reviews = useStore((s) => s.reviews);
  const editShift = useStore((s) => s.editShift);
  const cancelShift = useStore((s) => s.cancelShift);
  const completeShift = useStore((s) => s.completeShift);
  const duplicateShift = useStore((s) => s.duplicateShift);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);

  const [raise, setRaise] = useState(false);
  const [newPay, setNewPay] = useState(shift?.pay || 65);

  const market = useMemo(() => {
    if (!shift) return null;
    const key = shift.title.split(' ')[0].toLowerCase();
    const similar = shifts.filter((s) => s.id !== shift.id && s.title.toLowerCase().startsWith(key));
    if (similar.length < 2) return null;
    const pays = similar.map((s) => s.pay).sort((a, b) => a - b);
    return { min: pays[0], median: pays[Math.floor(pays.length / 2)], n: similar.length };
  }, [shift, shifts]);

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;

  const approved = applications.filter((a) => a.status === 'approved');
  const pending = applications.filter((a) => a.status === 'pending');
  const free = Math.max(0, shift.spotsTotal - approved.length);
  const cd = countdown(shift, now);
  const over = cd.phase === 'ended' || shift.status === 'completed';
  const cancelled = shift.status === 'cancelled';

  const chatWith = (workerId) => {
    const conv = getOrCreateConversation(shift.id, workerId, shift.companyId);
    navigation.navigate('ChatConversation', { conversationId: conv.id });
  };

  const menu = () => showActions({
    title: shift.title,
    options: [
      !over && !cancelled ? { label: 'Изменить', onPress: () => navigation.navigate('CreateShift', { editShiftId: shift.id }) } : null,
      { label: 'Повторить смену', onPress: () => navigation.navigate('CreateShift', { template: duplicateShift(shift.id) }) },
      !over && !cancelled && cd.phase === 'running' ? { label: 'Закрыть смену', onPress: () => { completeShift(shift.id); haptic.success(); } } : null,
      !over && !cancelled ? {
        label: 'Отменить смену', destructive: true,
        onPress: () => Alert.alert(
          'Отменить смену?',
          approved.length || pending.length
            ? `${approved.length + pending.length} ${plural(approved.length + pending.length, ['человек получит', 'человека получат', 'человек получат'])} уведомление об отмене. Частые отмены видны исполнителям в профиле точки.`
            : 'Смена пропадёт из ленты.',
          [{ text: 'Не отменять', style: 'cancel' }, { text: 'Отменить смену', style: 'destructive', onPress: () => { cancelShift(shift.id); haptic.medium(); } }],
        ),
      } : null,
    ].filter(Boolean),
  });

  const when = `${dayLabel(shift.date) === 'Сегодня' || dayLabel(shift.date) === 'Завтра' ? dayLabel(shift.date) : shortDate(shift.date)}, ${timeRange(shift)}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <ScrollView contentContainerStyle={{ paddingBottom: (over || cancelled ? 24 : 110) + insets.bottom }}>
        <NavBar onBack={() => navigation.goBack()} variant="fill" right={<RoundButton icon="ellipsis" variant="fill" onPress={menu} accessibilityLabel="Действия со сменой" />} />
        <View style={{ paddingHorizontal: 22, paddingTop: 26 }}>
          {cancelled ? <StatusPill status="cancelled" style={{ marginBottom: 10 }} /> : over ? <StatusPill status="done" style={{ marginBottom: 10 }} /> : null}
          <T v="title" accessibilityRole="header">{shift.title}</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
            <T v="moneyHero" style={{ fontSize: 34, lineHeight: 38, letterSpacing: -1.6 }}>{money(shift.pay)}</T>
            <T v="rowTitle" c="secondary" style={{ letterSpacing: 0 }}>BYN</T>
            <T v="body" c="secondary" style={{ marginLeft: 6 }}>за место · {money(shift.pay * shift.spotsTotal)} всего</T>
          </View>
        </View>

        <Separator style={{ marginTop: 22 }} />
        <LedgerRow label="Когда" value={when} sub={cancelled ? 'Смена отменена' : cd.phase === 'before' ? cd.text.replace('Начало', 'начало') : cd.phase === 'running' ? cd.text : `${hours(shift.durationHours)}, закончилась`} />
        <LedgerRow label="Мест" alignTop={false} value={`${approved.length} из ${shift.spotsTotal} закрыто`} right={<SeatsBar taken={approved.length} total={shift.spotsTotal} width={shift.spotsTotal > 2 ? 60 : 47} />} />
        <LedgerRow
          label="Отклики"
          value={`${applications.filter((a) => a.status !== 'cancelled_by_worker').length} ${plural(applications.length, ['отклик', 'отклика', 'откликов'])}${pending.length ? ` · ${pending.length} ждут ответа` : ''}`}
          sub={market && shift.pay < market.median ? `Похожие смены в городе платят от ${market.min} BYN, чаще — ${market.median}` : undefined}
          onPress={() => navigation.navigate('Applications', { shiftId: shift.id })}
          chevron
          last
        />

        <SectionHeader
          title="Состав смены"
          right={!over && !cancelled && free > 0 ? 'Позвать своих' : undefined}
          onRightPress={() => navigation.navigate('Favorites', { inviteShiftId: shift.id })}
        />
        {approved.map((a) => {
          const w = workers.find((x) => x.id === a.workerId);
          if (!w) return null;
          const reviewed = reviews.some((r) => r.shiftId === shift.id && r.authorId === company?.id && r.targetId === w.id);
          return (
            <View key={a.id}>
              <Press feedback="highlight" onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                  <PersonAvatar first={w.firstName} last={w.lastName} uri={w.avatar} size={36} />
                  <View style={{ flex: 1 }}>
                    <T v="value" style={{ fontWeight: '600' }}>{w.firstName} {w.lastName}</T>
                    <T v="caption" c="secondary">★ {w.rating ? w.rating.toFixed(1) : '—'} · {w.shiftsCompleted} {plural(w.shiftsCompleted, ['смена', 'смены', 'смен'])} · подтверждён</T>
                  </View>
                  {over && !reviewed ? (
                    <Button title="Оценить" size="sm" variant="secondary" onPress={() => navigation.navigate('RateShift', { shiftId: shift.id, workerId: w.id })} />
                  ) : (
                    <RoundButton icon="bubble.left" variant="fill" size={32} iconSize={14} onPress={() => chatWith(w.id)} accessibilityLabel={`Написать ${w.firstName}`} />
                  )}
                </View>
              </Press>
              <Separator inset />
            </View>
          );
        })}
        {!over && !cancelled
          ? Array.from({ length: free }).map((_, i) => (
            <View key={`free${i}`}>
              <FreeSeat waiting={pending.length} onPick={() => navigation.navigate('Applications', { shiftId: shift.id })} />
              <Separator />
            </View>
          ))
          : null}

        <SectionHeader title="Как видят исполнители" />
        <FeedShiftRow shift={shift} company={company} location={location} last />
        <Separator />
        {market && shift.pay < market.median && !over && !cancelled ? (
          <Note icon="chart.bar" style={{ marginTop: 14 }}>
            {`У тебя ${shift.pay} BYN, а похожие смены чаще платят ${market.median}. Смены с оплатой ниже рынка закрываются дольше.`}
          </Note>
        ) : null}
      </ScrollView>

      {!over && !cancelled ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 10, backgroundColor: c.glassFallback, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.glassFallbackBorder }}>
          <Button title="Изменить" variant="secondary" style={{ flex: 1 }} onPress={() => navigation.navigate('CreateShift', { editShiftId: shift.id })} />
          <Button title="Поднять оплату" style={{ flex: 1 }} onPress={() => { setNewPay(Math.min(140, shift.pay + 5)); setRaise(true); }} />
        </View>
      ) : null}

      <Sheet visible={raise} onClose={() => setRaise(false)} title="Поднять оплату">
        <View style={{ paddingHorizontal: 22, paddingTop: 8 }}>
          <T v="body" c="secondary">Новая сумма сразу появится в ленте. Уже подтверждённым исполнителям тоже заплатишь по новой ставке.</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 18 }}>
            <T v="moneyHero">{money(newPay)}</T>
            <T v="rowTitle" c="secondary" style={{ fontSize: 19, letterSpacing: 0 }}>BYN</T>
            <T v="body" c="secondary" style={{ marginLeft: 4 }}>≈{Math.round(newPay / (shift.durationHours || 1))} BYN/ч</T>
          </View>
          <Slider min={shift.pay} max={Math.max(140, shift.pay + 20)} step={5} value={newPay} onChange={setNewPay} accessibilityLabel="Новая оплата за смену" formatValue={(v) => `${v} BYN`} />
          {market ? <T v="small" c="secondary" style={{ marginTop: 4 }}>{`Похожие смены: от ${market.min} BYN, чаще ${market.median} BYN`}</T> : null}
          <Button
            title={newPay > shift.pay ? `Поднять до ${newPay} BYN` : 'Выбери новую сумму'}
            disabled={newPay <= shift.pay}
            style={{ marginTop: 18 }}
            onPress={() => {
              editShift(shift.id, { pay: newPay, payPerHour: +(newPay / (shift.durationHours || 1)).toFixed(2) });
              haptic.success();
              setRaise(false);
            }}
          />
        </View>
      </Sheet>
    </View>
  );
}
