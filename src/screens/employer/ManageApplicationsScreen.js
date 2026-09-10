// Applications for a shift (handoff screen 11). The first one is marked not
// by a background but by a filled «Подтвердить»: the system suggests once
// whom to pick and doesn't stand in the way of picking someone else.
import React, { useMemo } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, PersonAvatar, Button, RoundButton, Separator, SectionHeader, Note, EmptyState, StatusPill, Press } from '../../design/ui';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, timeRange, countdown } from '../../design/format';
import useStore from '../../store/useStore';

function Candidate({ app, worker, stats, primary, onApprove, onReject, onChat, onOpen, last }) {
  return (
    <View>
      <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 }}>
        <Press feedback="none" onPress={onOpen} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityLabel={`Профиль: ${worker.firstName} ${worker.lastName}`}>
          <PersonAvatar first={worker.firstName} last={worker.lastName} uri={worker.avatar} size={44} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <T v="rowTitle">{worker.firstName} {worker.lastName}</T>
              {stats.reliable ? <Icon name="checkmark.shield" size={14} c="secondary" /> : null}
            </View>
            <T v="caption" c="secondary">{stats.line}</T>
          </View>
        </Press>
        {worker.categories?.length ? <T v="body" c="secondary" style={{ marginTop: 10 }}>Умеет: {worker.categories.join(', ').toLowerCase()}</T> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <Button title="Подтвердить" icon="checkmark" size="md" variant={primary ? 'primary' : 'secondary'} style={{ flex: 1 }} onPress={onApprove} />
          <RoundButton icon="bubble.left" variant="fill" size={44} iconSize={16} onPress={onChat} accessibilityLabel={`Написать ${worker.firstName}`} />
          <RoundButton icon="xmark.circle" variant="fill" size={44} iconSize={17} onPress={onReject} accessibilityLabel={`Отклонить ${worker.firstName}`} />
        </View>
      </View>
      {!last ? <Separator inset /> : null}
    </View>
  );
}

export default function ManageApplicationsScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow(30000);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const allApps = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const approve = useStore((s) => s.approveApplication);
  const reject = useStore((s) => s.rejectApplication);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);

  const apps = useMemo(() => allApps.filter((a) => a.shiftId === shiftId), [allApps, shiftId]);
  const pending = apps.filter((a) => a.status === 'pending');
  const approved = apps.filter((a) => a.status === 'approved');

  const statsOf = (w) => {
    const cancels = allApps.filter((a) => a.workerId === w.id && a.status === 'cancelled_by_worker').length;
    const withMe = allApps.filter((a) => a.workerId === w.id && a.status === 'approved' && a.shiftId !== shiftId).length;
    const parts = [];
    if (w.shiftsCompleted) {
      parts.push(`★ ${w.rating ? w.rating.toFixed(1) : '—'}`, `${w.shiftsCompleted} ${plural(w.shiftsCompleted, ['смена', 'смены', 'смен'])}`);
      if (withMe) parts.push(`${withMe} у тебя`);
      parts.push(cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен');
    } else {
      parts.push('Новый на платформе', 'без смен');
    }
    return { line: parts.join(' · '), reliable: w.badges?.includes('no_cancels') && !cancels, score: (w.rating || 0) * 10 + Math.min(w.shiftsCompleted || 0, 100) / 10 - cancels * 5 };
  };

  // Best first: rating and experience, cancellations weigh against.
  const ranked = useMemo(() => pending
    .map((a) => ({ app: a, worker: workers.find((w) => w.id === a.workerId) }))
    .filter((x) => x.worker)
    .map((x) => ({ ...x, stats: statsOf(x.worker) }))
    .sort((a, b) => b.stats.score - a.stats.score), [pending, workers, allApps]);

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;
  const free = Math.max(0, shift.spotsTotal - approved.length);
  const cd = countdown(shift, now);
  const d = dayLabel(shift.date);
  const when = `${d === 'Сегодня' || d === 'Завтра' ? d.toLowerCase() : shortDate(shift.date)}, ${timeRange(shift)}`;

  const chat = (workerId) => {
    const conv = getOrCreateConversation(shift.id, workerId, shift.companyId);
    navigation.navigate('ChatConversation', { conversationId: conv.id });
  };

  const doApprove = (x) => {
    approve(x.app.id);
    haptic.success();
  };

  const doReject = (x) => showActions({
    title: `Отклонить отклик: ${x.worker.firstName} ${x.worker.lastName}?`,
    message: 'Исполнитель получит вежливый отказ без объяснения причин.',
    options: [{ label: 'Отклонить', destructive: true, onPress: () => { reject(x.app.id); haptic.medium(); } }],
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
          <T v="title" accessibilityRole="header">{pending.length ? `${pending.length} ${plural(pending.length, ['отклик', 'отклика', 'откликов'])}` : 'Отклики'}</T>
          <T v="body" c="secondary" style={{ marginTop: 6 }}>
            {shift.title} · {when} · {free ? `${free === 1 ? 'осталось одно место' : `осталось ${free} ${plural(free, ['место', 'места', 'мест'])}`}` : 'все места закрыты'}
          </T>
        </View>
        {cd.phase === 'before' && free > 0 ? (
          <View style={{ marginHorizontal: 22, marginTop: 16, borderRadius: 14, backgroundColor: c.fill, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="timer" size={16} c="label" />
            <T v="bodyStrong" style={{ flex: 1 }}>{cd.text.replace('Начало через', 'До начала')}</T>
          </View>
        ) : null}

        <Separator style={{ marginTop: 18 }} />
        {ranked.length ? ranked.map((x, i) => (
          <Candidate
            key={x.app.id}
            {...x}
            primary={i === 0 && free > 0}
            last={i === ranked.length - 1}
            onApprove={() => doApprove(x)}
            onReject={() => doReject(x)}
            onChat={() => chat(x.worker.id)}
            onOpen={() => navigation.navigate('PublicWorkerProfile', { workerId: x.worker.id })}
          />
        )) : cd.phase === 'before' && free > 0 ? (
          <EmptyState
            title="Откликов пока нет"
            text="Смена уже в ленте. Можно не ждать и позвать тех, кто у тебя работал."
            action="Позвать своих"
            onAction={() => navigation.navigate('Favorites', { inviteShiftId: shift.id })}
          />
        ) : !approved.length ? (
          <EmptyState title="Откликов не было" text="Смена началась — из ленты она уже пропала." />
        ) : null}

        {approved.length ? (
          <>
            <SectionHeader title="Подтверждены" right={`${approved.length} из ${shift.spotsTotal}`} />
            {approved.map((a, i) => {
              const w = workers.find((x) => x.id === a.workerId);
              if (!w) return null;
              return (
                <View key={a.id}>
                  <Press feedback="highlight" onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                      <PersonAvatar first={w.firstName} last={w.lastName} uri={w.avatar} size={36} />
                      <T v="value" style={{ flex: 1, fontWeight: '600' }}>{w.firstName} {w.lastName}</T>
                      <StatusPill status="confirmed" />
                    </View>
                  </Press>
                  {i < approved.length - 1 ? <Separator inset /> : null}
                </View>
              );
            })}
          </>
        ) : null}
        <Separator style={{ marginTop: ranked.length ? 0 : 0 }} />
        {ranked.length ? (
          <Note icon="info.circle" style={{ marginTop: 16 }}>
            Отклонённым придёт вежливый отказ без причины. Когда места закроются, остальные отклики отклонятся сами.
          </Note>
        ) : null}
      </ScrollView>
    </View>
  );
}
