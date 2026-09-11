// «Смена и состав» — screen 27. The shift on the sky of its hour with the
// three numbers the employer checks: per seat, total, seats. The crew is
// people plus a dashed free seat that says at once how many are waiting.
// The market reference offers an action («Поднять»), not just a number, and
// at the bottom the shift is shown exactly as workers see it in the feed.
import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import { CircleButton, Card, Button, Press, SectionTitle } from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { StatusBadge } from '../../design/Status';
import { PersonMono } from '../../design/Monogram';
import { FeedCard } from '../../design/ShiftCard';
import Sheet from '../../design/Sheet';
import Slider from '../../design/Slider';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import {
  dayLabel, timeRange, countdown, plural, hours, dative, shiftStart,
} from '../../design/format';
import { showActions } from '../../design/ActionSheet';
import useStore from '../../store/useStore';

const IN_CITY = {
  'Минск': 'в Минске', 'Гомель': 'в Гомеле', 'Гродно': 'в Гродно', 'Брест': 'в Бресте', 'Могилёв': 'в Могилёве', 'Витебск': 'в Витебске',
};

/**
 * Market reference: the median pay of similar shifts in the store (same
 * first word of the title), in the shift's city when there are enough.
 */
function marketFor(shift, shifts, cityByLoc) {
  const key = (shift?.title || '').trim().split(/\s+/)[0]?.toLowerCase();
  if (!key) return null;
  const similar = shifts.filter((s) => s.id !== shift.id && s.status !== 'cancelled' && s.title.toLowerCase().startsWith(key));
  const city = cityByLoc[shift.locationId];
  const local = city ? similar.filter((s) => cityByLoc[s.locationId] === city) : [];
  const pool = local.length >= 2 ? local : similar;
  if (pool.length < 2) return null;
  const pays = pool.map((s) => s.pay).sort((a, b) => a - b);
  return { min: pays[0], median: pays[Math.floor(pays.length / 2)], where: local.length >= 2 ? IN_CITY[city] || null : null };
}
const marketLine = (m) => `Похожие смены${m.where ? ` ${m.where}` : ''} чаще платят`;

/** The rising line of the mockup's market hint. */
function Trend({ size = 21, color, width = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 18 10 11l3.5 3.5L20 7" />
    </Svg>
  );
}

function HeroTile({ sky, label, children, compact }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: compact ? 10 : 12, borderRadius: 14, backgroundColor: c.onSky }}>
      <T v="caption" c={sky.ink2} weight="600" style={{ fontSize: 11.5, lineHeight: 14 }} numberOfLines={1}>{label}</T>
      <View style={{ marginTop: 5 }}>{children}</View>
    </View>
  );
}

function PersonRow({ worker, cancels, onOpen, onChat, onRate }) {
  const { c } = useTheme();
  const n = worker.shiftsCompleted || 0;
  const stats = [
    n ? `${n} ${plural(n, ['смена', 'смены', 'смен'])}` : 'новичок',
    cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен',
  ].join(' · ');
  return (
    <Card
      radius={18}
      onPress={onOpen}
      accessibilityLabel={`${worker.firstName} ${worker.lastName}${worker.rating ? `, рейтинг ${worker.rating.toFixed(1).replace('.', ',')}` : ''}, ${stats}`}
      style={{ paddingVertical: 11, paddingLeft: 14, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }}
    >
      <PersonMono first={worker.firstName} last={worker.lastName} uri={worker.avatar} size={42} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="rowTitle" style={{ fontSize: 15.5, lineHeight: 19 }} numberOfLines={1}>{worker.firstName} {worker.lastName}</T>
        <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {worker.rating ? <Icon name="star.fill" size={11} c={c.star} /> : null}
          {worker.rating ? <T v="caption" c="ink3" weight="600" style={{ fontSize: 12.5, lineHeight: 16 }}>{worker.rating.toFixed(1)}</T> : null}
          <T v="caption" c="ink2" style={{ fontSize: 12.5, lineHeight: 16, flexShrink: 1 }} numberOfLines={1}>{`${worker.rating ? '· ' : ''}${stats}`}</T>
        </View>
      </View>
      {onRate ? (
        <Button title="Оценить" size="sm" variant="secondary" onPress={onRate} />
      ) : (
        <Press onPress={onChat} hitSlop={4} accessibilityLabel={`Написать ${dative(worker.firstName)}`} style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bubble.left" size={19} c="brand" weight="semibold" />
        </Press>
      )}
    </Card>
  );
}

function FreeSeat({ waiting, onPick, onInvite }) {
  const { c } = useTheme();
  return (
    <View style={{ backgroundColor: c.surface, borderRadius: 18, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plus" size={18} c="ink2" weight="bold" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="rowTitle" c="ink3" style={{ fontSize: 15.5, lineHeight: 19 }}>Свободное место</T>
        <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>
          {waiting ? `${waiting} ${plural(waiting, ['человек ждёт', 'человека ждут', 'человек ждут'])} ответа` : 'Откликов пока нет'}
        </T>
      </View>
      {waiting
        ? <Button title="Выбрать" size="sm" onPress={onPick} style={{ borderRadius: 13, paddingHorizontal: 13 }} />
        : <Button title="Позвать" size="sm" variant="secondary" onPress={onInvite} accessibilityLabel="Позвать своих людей на смену" style={{ borderRadius: 13, paddingHorizontal: 13 }} />}
    </View>
  );
}

export default function ShiftManageScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 16 : 20;
  const now = useNow(30000);

  const shift = useStore((s) => s.getShiftById(shiftId));
  const company = useStore((s) => s.currentUser);
  const location = useStore((s) => (shift ? s.getLocationById(shift.locationId) : null));
  const allApplications = useStore((s) => s.applications);
  const applications = useMemo(() => allApplications.filter((a) => a.shiftId === shiftId), [allApplications, shiftId]);
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const reviews = useStore((s) => s.reviews);
  const editShift = useStore((s) => s.editShift);
  const cancelShift = useStore((s) => s.cancelShift);
  const completeShift = useStore((s) => s.completeShift);
  const duplicateShift = useStore((s) => s.duplicateShift);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);

  const [raise, setRaise] = useState(false);
  const [newPay, setNewPay] = useState(shift?.pay || 65);

  const cityByLoc = useMemo(() => {
    const m = {};
    companies.forEach((co) => (co.locations || []).forEach((l) => { m[l.id] = l.city; }));
    (company?.locations || []).forEach((l) => { m[l.id] = l.city; });
    return m;
  }, [companies, company]);
  const market = useMemo(() => (shift ? marketFor(shift, shifts, cityByLoc) : null), [shift, shifts, cityByLoc]);

  const raiseMax = shift ? Math.max(140, shift.pay + 20) : 140;
  const openRaise = () => {
    if (!shift) return;
    // From the market plate the sheet starts at the market median.
    const target = market && market.median > shift.pay ? Math.min(raiseMax, market.median) : shift.pay + 5;
    setNewPay(target);
    setRaise(true);
  };

  // «Поднять оплату» from the shifts list or «Отклики» opens the sheet on
  // arrival — after the push has settled, and only for a live shift.
  const raiseParam = !!route.params?.raise;
  useEffect(() => {
    if (!raiseParam || !shift) return undefined;
    const id = setTimeout(() => {
      navigation.setParams({ raise: undefined });
      const cd0 = countdown(shift, new Date());
      if (cd0.phase === 'ended' || shift.status === 'completed' || shift.status === 'cancelled') return;
      openRaise();
    }, 350);
    return () => clearTimeout(id);
  }, [raiseParam]);

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const approved = applications.filter((a) => a.status === 'approved');
  const pending = applications.filter((a) => a.status === 'pending');
  const free = Math.max(0, shift.spotsTotal - approved.length);
  const cd = countdown(shift, now);
  const over = cd.phase === 'ended' || shift.status === 'completed';
  const cancelled = shift.status === 'cancelled';
  const live = !over && !cancelled;
  // Counts what the «Отклики» screen lists: rejected and withdrawn aren't there.
  const responded = applications.filter((a) => a.status === 'pending' || a.status === 'approved' || a.status === 'completed').length;
  const sky = t.sky(live ? skyKey(shift, { now, ignoreClosed: true }) : 'closed');
  const within24 = cd.phase === 'before' && shiftStart(shift) - now < 24 * 3600 * 1000;

  const chatWith = (workerId) => {
    const conv = getOrCreateConversation(shift.id, workerId, shift.companyId);
    navigation.navigate('ChatConversation', { conversationId: conv.id });
  };
  const edit = () => navigation.navigate('CreateShift', { editShiftId: shift.id });
  const invite = () => navigation.navigate('Favorites', { inviteShiftId: shift.id });
  const toApplications = () => navigation.navigate('Applications', { shiftId: shift.id });

  const menu = () => showActions({
    title: shift.title,
    options: [
      live ? { label: 'Изменить', onPress: edit } : null,
      live && free > 0 ? { label: 'Позвать своих', onPress: invite } : null,
      { label: 'Повторить смену', onPress: () => navigation.navigate('CreateShift', { template: duplicateShift(shift.id) }) },
      live && cd.phase === 'running' ? { label: 'Закрыть смену', onPress: () => { completeShift(shift.id); haptic.success(); } } : null,
      live ? {
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

  const onSky = { backgroundColor: c.onSky };
  let badge = null;
  if (cancelled) badge = <StatusBadge state="cancelled" label="Смена отменена" />;
  else if (over) badge = <StatusBadge state="done" label="Смена прошла" style={onSky} />;
  else if (cd.phase === 'running') badge = <StatusBadge state="running" label={cd.text} />;
  else if (shift.urgent) badge = <StatusBadge state="urgent" label={within24 ? `Срочно · до начала ${cd.short}` : 'Срочно'} />;
  else if (!free) badge = <StatusBadge state="confirmed" label="Все места закрыты" style={onSky} />;
  else if (within24) badge = <StatusBadge state="pending" label={`До начала ${cd.short}`} />;

  const total = shift.pay * shift.spotsTotal;
  const below = market && shift.pay < market.median;
  const crew = approved.map((a) => ({ app: a, worker: workers.find((w) => w.id === a.workerId) })).filter((x) => x.worker);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={sky.key === 'night' || t.dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <SkyView sky={sky} style={{ paddingBottom: 16 }}>
          <View style={{ paddingTop: insets.top + 4, paddingHorizontal: G, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CircleButton icon="chevron.left" variant="sky" color={sky.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {live ? (
                <Press onPress={edit} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} accessibilityLabel="Изменить смену" style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, backgroundColor: c.onSky }}>
                  <T v="bodyStrong" c={sky.ink} style={{ fontSize: 14, lineHeight: 17 }}>Изменить</T>
                </Press>
              ) : null}
              <CircleButton icon="ellipsis" variant="sky" color={sky.ink} onPress={menu} accessibilityLabel="Действия со сменой" />
            </View>
          </View>

          <View style={{ paddingTop: 18, paddingHorizontal: G }}>
            {badge}
            <T v="titleScreen" c={sky.ink} style={{ marginTop: badge ? 11 : 0, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 }} accessibilityRole="header">{shift.title}</T>
            <T v="body" c={sky.ink2} weight="500" style={{ marginTop: 7, fontSize: 14, lineHeight: 20 }}>
              {`${dayLabel(shift.date, now)} · ${timeRange(shift)} · ${hours(shift.durationHours)}`}
              {location?.address ? `\n${location.address}` : ''}
            </T>
            <View style={{ marginTop: 14, flexDirection: 'row', gap: compact ? 8 : 9 }}>
              <HeroTile sky={sky} label="За место" compact={compact}>
                <Money value={shift.pay} size="card" fontSize={21} c={sky.ink} suffixC={sky.ink2} />
              </HeroTile>
              <HeroTile sky={sky} label="Всего" compact={compact}>
                <Money value={total} size="card" fontSize={total >= 1000 ? 17 : 21} c={sky.ink} suffixC={sky.ink2} />
              </HeroTile>
              <HeroTile sky={sky} label="Мест" compact={compact}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityLabel={`${approved.length} из ${shift.spotsTotal} мест закрыто`}>
                  <T v="moneyCard" c={sky.ink} style={{ fontSize: 21, lineHeight: 22 }}>{`${approved.length}/${shift.spotsTotal}`}</T>
                  {shift.spotsTotal <= 4 ? (
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {Array.from({ length: shift.spotsTotal }).map((_, i) => (
                        <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sky.ink, opacity: i < approved.length ? 1 : 0.35 }} />
                      ))}
                    </View>
                  ) : null}
                </View>
              </HeroTile>
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: G }}>
          {live || crew.length || over ? (
            <>
              <SectionTitle
                title="Состав"
                size={18}
                right={responded ? `${responded} ${plural(responded, ['отклик', 'отклика', 'откликов'])}` : undefined}
                onRightPress={responded ? toApplications : undefined}
              />
              <View style={{ marginTop: 10, gap: 8 }}>
                {crew.map(({ app, worker: w }) => {
                  const reviewed = reviews.some((r) => r.shiftId === shift.id && r.authorId === company?.id && r.targetId === w.id);
                  return (
                    <PersonRow
                      key={app.id}
                      worker={w}
                      cancels={allApplications.filter((a) => a.workerId === w.id && a.status === 'cancelled_by_worker').length}
                      onOpen={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}
                      onChat={() => chatWith(w.id)}
                      onRate={over && !reviewed ? () => navigation.navigate('RateShift', { shiftId: shift.id, workerId: w.id }) : undefined}
                    />
                  );
                })}
                {live ? Array.from({ length: free }).map((_, i) => (
                  <FreeSeat key={`free${i}`} waiting={pending.length} onPick={toApplications} onInvite={invite} />
                )) : null}
                {!live && !crew.length ? (
                  <Card flat radius={18} style={{ paddingVertical: 14, paddingHorizontal: 14 }}>
                    <T v="bodyStrong" c="ink2">Никого не подтвердили</T>
                  </Card>
                ) : null}
              </View>
            </>
          ) : null}

          {live ? (
            <>
              <Card radius={18} style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {market
                  ? <Trend size={21} color={below ? c.warning : c.success} />
                  : <Icon name="banknote" size={21} c="ink2" />}
                <T v="body" c="ink3" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>
                  {market ? (
                    <>
                      {`${marketLine(market)} `}
                      <T v="body" c="ink" weight="700" style={{ fontSize: 13.5, lineHeight: 19 }}>{`${market.median} BYN`}</T>
                    </>
                  ) : 'Новая оплата сразу появится в ленте у исполнителей'}
                </T>
                <Press onPress={openRaise} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityLabel="Поднять оплату" style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, backgroundColor: c.brandTint }}>
                  <T v="bodyStrong" c="brand" style={{ fontSize: 13.5, lineHeight: 17 }}>Поднять</T>
                </Press>
              </Card>

              <SectionTitle title="Как видят исполнители" size={18} style={{ marginTop: 16 }} />
              <View style={{ marginTop: 10 }}>
                <FeedCard shift={shift} company={company} location={location} now={now} preview />
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <Sheet visible={raise} onClose={() => setRaise(false)} title="Поднять оплату">
        <View style={{ paddingHorizontal: 20, paddingTop: 6 }}>
          <T v="body" c="ink2" style={{ fontSize: 14.5, lineHeight: 21 }}>Новая сумма сразу появится в ленте. Уже подтверждённым исполнителям тоже заплатишь по новой ставке.</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 16 }}>
            <Money value={newPay} size="hero" fontSize={44} />
            <T v="bodyStrong" c="ink2" style={{ fontSize: 14 }}>{`≈${Math.round(newPay / (shift.durationHours || 1))} BYN/ч`}</T>
          </View>
          <View style={{ marginTop: 6 }}>
            <Slider
              min={shift.pay}
              max={raiseMax}
              step={5}
              value={newPay}
              onChange={setNewPay}
              marker={market && market.median > shift.pay && market.median <= raiseMax ? { value: market.median } : undefined}
              accessibilityLabel="Новая оплата за смену"
              formatValue={(v) => `${v} BYN`}
            />
          </View>
          {market ? (
            <View style={{ marginTop: -2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Trend size={13} color={c.ink2} width={2.2} />
              <T v="caption" c="ink2" weight="500" style={{ flex: 1, fontSize: 12.5, lineHeight: 16 }}>{`${marketLine(market)} ${market.median} BYN`}</T>
            </View>
          ) : null}
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
