// «Отклики» — screen 26 (§9.1 · 4). The recommendation is shown once and
// goes away after a choice — it never stands in the way of picking someone
// else. «1 из 2 → 2 из 2» fills on the snappy spring; the other candidates
// dim to 55 % but stay tappable. Closing the last seat is the one
// celebration in the app.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import {
  NavBar, Card, Button, Press, SectionTitle, EmptyState, Tag,
} from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { SeatDots } from '../../design/Status';
import { PersonMono } from '../../design/Monogram';
import Celebrate from '../../design/Celebrate';
import { useNow, passClock } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, timeRange } from '../../design/format';
import useStore from '../../store/useStore';

const smena = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;

function StatsLine({ worker, cancels, withMe }) {
  const { c } = useTheme();
  const parts = [];
  if (worker.shiftsCompleted) parts.push(smena(worker.shiftsCompleted));
  else parts.push('без смен на платформе');
  if (withMe) parts.push(`${withMe} у тебя`);
  parts.push(cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен');
  return (
    <View style={{ marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      {worker.rating ? <Icon name="star.fill" size={11} c={c.star} /> : null}
      {worker.rating ? <T v="caption" c="ink3" weight="600" style={{ fontSize: 12.5 }}>{worker.rating.toFixed(1)}</T> : null}
      <T v="caption" c="ink2" style={{ fontSize: 12.5, flexShrink: 1 }} numberOfLines={2}>{`${worker.rating ? '· ' : ''}${parts.join(' · ')}`}</T>
    </View>
  );
}

export default function ManageApplicationsScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const now = useNow(30000);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const allApps = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const favMap = useStore((s) => s.favorites);
  const me = useStore((s) => s.currentUser);
  const approve = useStore((s) => s.approveApplication);
  const reject = useStore((s) => s.rejectApplication);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);
  const [celebrate, setCelebrate] = useState(false);
  const [justFilled, setJustFilled] = useState(false);
  // The candidate whose confirmation is with the server, and the one whose
  // chat is being opened: only their own row's controls go quiet.
  const [approvingId, setApprovingId] = useState(null);
  const [chatFor, setChatFor] = useState(null);

  const apps = useMemo(() => allApps.filter((a) => a.shiftId === shiftId), [allApps, shiftId]);
  const pending = apps.filter((a) => a.status === 'pending');
  const approved = apps.filter((a) => a.status === 'approved');

  const statsOf = (w) => {
    const cancels = allApps.filter((a) => a.workerId === w.id && a.status === 'cancelled_by_worker').length;
    const withMe = allApps.filter((a) => a.workerId === w.id && a.status === 'approved' && a.shiftId !== shiftId).length;
    return { cancels, withMe, score: (w.rating || 0) * 10 + Math.min(w.shiftsCompleted || 0, 100) / 10 - cancels * 5 };
  };

  // Best first: rating and experience; cancellations weigh against.
  const ranked = useMemo(() => pending
    .map((a) => ({ app: a, worker: workers.find((w) => w.id === a.workerId) }))
    .filter((x) => x.worker)
    .map((x) => ({ ...x, stats: statsOf(x.worker) }))
    .sort((a, b) => b.stats.score - a.stats.score), [pending, workers, allApps]);

  const filledAll = approved.length >= (shift?.spotsTotal || 1);
  const dim = useAnimatedStyle(() => ({ opacity: withTiming(filledAll ? 0.55 : 1, { duration: 300 }) }), [filledAll]);

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const free = Math.max(0, shift.spotsTotal - approved.length);
  const clock = passClock(shift, now);
  const sky = t.sky(skyKey(shift, { now, ignoreClosed: true }));
  const d = dayLabel(shift.date, now);
  const when = `${d === 'Сегодня' || d === 'Завтра' ? d.toLowerCase() : shortDate(shift.date)} ${timeRange(shift)}`;
  const favCount = (me && favMap[me.id]?.length) || 0;

  const chat = async (workerId) => {
    if (chatFor) return;
    setChatFor(workerId);
    try {
      const conv = await getOrCreateConversation(shift.id, workerId, shift.companyId);
      navigation.navigate('ChatConversation', { conversationId: conv.id });
    } catch (e) {
      toast.error('Не удалось открыть чат');
    } finally {
      setChatFor(null);
    }
  };

  // The seat is the server's to give: the celebration waits for its answer,
  // because someone else may have taken the last one a second ago.
  const doApprove = async (x) => {
    if (approvingId) return;
    if (!free) { haptic.error(); toast.error('Мест больше нет'); return; }
    let res;
    setApprovingId(x.app.id);
    try {
      res = await approve(x.app.id);
    } catch (e) {
      // The store says its own piece about the errors it returns; only a
      // throw gets past it without a word.
      toast.error('Не удалось подтвердить');
      res = { error: 'unknown' };
    } finally {
      setApprovingId(null);
    }
    if (res?.error === 'shift_full') { haptic.error(); toast.error('Место уже занято'); return; }
    // The store has already rolled the row back and pulled the real state;
    // «already_processed» needs no second word about it.
    if (res?.error) return;
    // Whether that was the last seat is the server's word, not the count
    // this screen was rendered with.
    const closes = !!res?.filled;
    setJustFilled(true);
    if (closes) setCelebrate(true);
    else { haptic.success(); toast.success(`${x.worker.firstName} подтверждён(а) · ${approved.length + 1} из ${shift.spotsTotal}`); }
  };

  const doReject = (x) => showActions({
    title: `Отклонить: ${x.worker.firstName} ${x.worker.lastName}?`,
    message: 'Исполнитель получит вежливый отказ без объяснения причин.',
    options: [{ label: 'Отклонить', destructive: true, onPress: () => { reject(x.app.id); haptic.light(); toast.show({ text: 'Отклик отклонён', kind: 'info' }); } }],
  });

  const top = ranked[0];
  const rest = ranked.slice(1);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <NavBar onBack={() => navigation.goBack()} title="Отклики" subtitle={`${shift.title} · ${when}`} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 110 }}>
        <View style={[{ marginTop: 10, borderRadius: 22, backgroundColor: c.surface }, t.sh.e1]}>
          <SkyView sky={sky} radius={22} style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View>
                <T v="caption" c={sky.ink2} weight="600">Закрыто мест</T>
                <T v="moneyCard" c={sky.ink} style={{ marginTop: 5, fontSize: 32, lineHeight: 34, letterSpacing: -0.64 }} accessibilityLiveRegion="polite">{`${approved.length} из ${shift.spotsTotal}`}</T>
              </View>
              {shift.spotsTotal <= 6 ? <SeatDots taken={approved.length} total={shift.spotsTotal} size={16} color={sky.ink} freeColor={c.onSky} popLast={justFilled} /> : null}
            </View>
            <T v="bodyStrong" c={sky.ink2} style={{ marginTop: 12, fontSize: 13.5 }}>
              {clock.phase === 'before' ? `До начала ${clock.value} · ${shift.pay} BYN за место` : clock.phase === 'running' ? `Смена идёт · ${shift.pay} BYN за место` : `Смена прошла · ${shift.pay} BYN за место`}
            </T>
          </SkyView>
        </View>

        {ranked.length ? (
          <>
            <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <T v="titleSection" style={{ fontSize: 18 }}>Кандидаты</T>
              <T v="caption" c="ink2">{`${ranked.length} ${plural(ranked.length, ['ждёт', 'ждут', 'ждут'])} ответа`}</T>
            </View>

            {top ? (
              <Card style={[{ marginTop: 10, paddingVertical: 13, paddingHorizontal: 14 }, free > 0 && { borderWidth: 1, borderColor: c.brand }]}>
                <Press onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: top.worker.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }} accessibilityLabel={`Профиль: ${top.worker.firstName} ${top.worker.lastName}`}>
                  <PersonMono first={top.worker.firstName} last={top.worker.lastName} uri={top.worker.avatar} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                      <T v="rowTitle" style={{ fontSize: 16 }}>{top.worker.firstName} {top.worker.lastName}</T>
                      {free > 0 ? <Tag label="Подходит лучше всех" tone="brand" style={{ paddingVertical: 3, paddingHorizontal: 7, borderRadius: 6 }} /> : null}
                    </View>
                    <StatsLine worker={top.worker} {...top.stats} />
                  </View>
                </Press>
                <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Button title={free ? 'Подтвердить' : 'Мест нет'} icon={free ? 'checkmark' : undefined} size="md" style={{ flex: 1, minHeight: 44, borderRadius: 14 }} loading={approvingId === top.app.id} disabled={!free || (!!approvingId && approvingId !== top.app.id)} onPress={() => doApprove(top)} />
                  <Press disabled={approvingId === top.app.id || !!chatFor} onPress={() => chat(top.worker.id)} accessibilityLabel={`Написать ${top.worker.firstName}`} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    {chatFor === top.worker.id
                      ? <ActivityIndicator size="small" color={c.ink3} />
                      : <Icon name="bubble.left" size={19} c="ink3" weight="semibold" />}
                  </Press>
                  <Press disabled={approvingId === top.app.id} onPress={() => doReject(top)} accessibilityLabel={`Отклонить ${top.worker.firstName}`} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="xmark" size={17} c="ink2" weight="bold" />
                  </Press>
                </View>
              </Card>
            ) : null}

            <Animated.View style={[{ marginTop: 8, gap: 8 }, dim]}>
              {rest.map((x) => (
                <Card key={x.app.id} flat radius={18} onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: x.worker.id })} onLongPress={approvingId === x.app.id ? undefined : () => doReject(x)} style={{ paddingVertical: 11, paddingLeft: 14, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                  <PersonMono first={x.worker.firstName} last={x.worker.lastName} uri={x.worker.avatar} size={40} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <T v="rowTitle" style={{ fontSize: 15.5 }}>{x.worker.firstName} {x.worker.lastName}</T>
                      {x.worker.badges?.includes('newbie') ? <Tag label="Новичок" /> : null}
                    </View>
                    <StatsLine worker={x.worker} {...x.stats} />
                  </View>
                  <Button title={free ? 'Подтвердить' : 'Мест нет'} size="sm" variant="secondary" loading={approvingId === x.app.id} disabled={!free || (!!approvingId && approvingId !== x.app.id)} onPress={() => doApprove(x)} />
                </Card>
              ))}
            </Animated.View>
          </>
        ) : clock.phase === 'before' && free > 0 ? (
          <Card style={{ marginTop: 18 }}>
            <EmptyState
              icon="person.2"
              title="Откликов пока нет"
              text={`До начала ${clock.value}. Позови своих — они получат приглашение уведомлением.`}
              action={favCount ? `Позвать своих · ${favCount} ${plural(favCount, ['человек', 'человека', 'человек'])}` : 'Позвать своих'}
              onAction={() => navigation.navigate('Favorites', { inviteShiftId: shift.id })}
              secondary="Поднять оплату"
              onSecondary={() => navigation.navigate('ShiftManage', { shiftId: shift.id, raise: true })}
            />
          </Card>
        ) : !approved.length ? (
          <EmptyState title="Откликов не было" text="Смена началась — из ленты она уже пропала." tone="neutral" icon="clock" />
        ) : null}

        {approved.length ? (
          <>
            <SectionTitle title="Уже подтверждены" size={16} style={{ marginTop: 18 }} />
            <View style={{ marginTop: 9, gap: 8 }}>
              {approved.map((a) => {
                const w = workers.find((x) => x.id === a.workerId);
                if (!w) return null;
                const st = statsOf(w);
                return (
                  <Card key={a.id} flat radius={18} onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })} style={{ paddingVertical: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
                    <PersonMono first={w.firstName} last={w.lastName} uri={w.avatar} size={40} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="rowTitle" style={{ fontSize: 15.5 }}>{w.firstName} {w.lastName}</T>
                      <StatsLine worker={w} {...st} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, backgroundColor: c.successTint }}>
                      <Icon name="checkmark" size={13} c="success" weight="heavy" />
                      <T v="badge" c="success" style={{ fontSize: 11.5 }}>Подтверждён</T>
                    </View>
                  </Card>
                );
              })}
            </View>
          </>
        ) : null}

        {ranked.length ? (
          <T v="caption" c="ink2" style={{ marginTop: 16, textAlign: 'center', paddingHorizontal: 12 }}>
            Отклонённым придёт вежливый отказ без причины. Когда места закроются, остальные отклики отклонятся сами.
          </T>
        ) : null}
      </ScrollView>
      <Celebrate visible={celebrate} sky={sky.key} line={`${shift.title} · ${shift.spotsTotal} из ${shift.spotsTotal} · смена в ${shift.timeStart}`} onDone={() => setCelebrate(false)} />
    </View>
  );
}
