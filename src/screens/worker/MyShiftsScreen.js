// «Мои смены» (handoff screen 6) on the warm sheet. On top — one pass, the
// nearest confirmed shift. Then «Ждут ответа» with how long ago the
// application went out, then history by month. The month's earnings live in
// the subtitle, not in a tile: it is a reference, not a KPI.
import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { TextTabs, Separator, EmptyState, StatusText, Press } from '../../design/ui';
import ShiftRow from '../../design/ShiftRow';
import PassCard, { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { money, monthName, capitalize, dayLabel, shortDate, timeRange, countdown, ago, plural, parseDay, shiftEnd } from '../../design/format';
import { openRoute } from '../../components/openRoute';
import useStore from '../../store/useStore';

function WarmSection({ title }) {
  return (
    <View>
      <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10 }}>{title}</T>
      <Separator warm />
    </View>
  );
}

function when(shift) {
  const d = dayLabel(shift.date);
  return `${d === 'Сегодня' || d === 'Завтра' || d === 'Вчера' ? d : shortDate(shift.date).split(', ')[1]}, ${timeRange(shift)}`;
}

export default function MyShiftsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(30000);
  const [tab, setTab] = useState('active');

  const me = useStore((s) => s.currentUser);
  const applications = useStore((s) => s.applications);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const reviews = useStore((s) => s.reviews);
  const getLocationById = useStore((s) => s.getLocationById);
  const markSeen = useStore((s) => s.markMyShiftsSeen);

  useFocusEffect(useCallback(() => { markSeen(); }, []));

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
  const earned = history.filter((x) => worked(x) && parseDay(x.shift.date) >= month).reduce((sum, x) => sum + x.shift.pay, 0);

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

  const noExpToday = useStore((s) => s.shifts.filter((sh) => sh.status === 'active' && sh.requirements?.noExperienceOk && sh.spotsTaken < sh.spotsTotal).length);

  const open = (id) => navigation.navigate('ShiftDetail', { shiftId: id });

  const historyRow = (x, i, arr) => {
    const w = worked(x);
    const cancelled = x.app.status === 'cancelled_by_worker' || x.shift.status === 'cancelled';
    const rejected = x.app.status === 'rejected' && !cancelled;
    const myReview = reviews.find((r) => r.shiftId === x.shift.id && r.authorId === me?.id);
    let right; let line3 = x.company?.companyName;
    if (w) {
      right = <StatusText status="done" label="Выполнена" />;
      line3 = `${x.company?.companyName}${myReview ? ` · твоя оценка ${myReview.overallRating.toFixed(1).replace('.', ',')}` : ' · оцени смену'}`;
    } else if (cancelled) {
      right = <StatusText status="cancelled" />;
      line3 = x.app.status === 'cancelled_by_worker' ? 'Ты отменил · без штрафа' : 'Отменил заказчик';
    } else if (rejected) {
      right = <StatusText status="rejected" />;
    } else {
      right = <StatusText status="done" label="Прошла" />;
    }
    return (
      <ShiftRow
        key={x.app.id}
        warm
        amount={x.shift.pay}
        title={x.shift.title}
        line2={when(x.shift)}
        line2Right={right}
        line3={line3}
        muted={cancelled || rejected}
        last={i === arr.length - 1}
        onPress={() => open(x.shift.id)}
      />
    );
  };

  const header = (
    <View>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22 }}>
        <T v="screenTitle" accessibilityRole="header">Мои смены</T>
        <T v="caption" c="secondary" style={{ marginTop: 2 }}>
          {earned ? `За ${monthName(now)} заработано ${money(earned)} BYN` : me ? 'Отклики, подтверждённые смены и история' : 'Здесь появятся твои отклики и смены'}
        </T>
      </View>
      {me ? (
        <TextTabs style={{ paddingTop: 18 }} items={[{ key: 'active', label: 'Активные' }, { key: 'history', label: 'История' }]} value={tab} onChange={setTab} />
      ) : null}
      <Separator warm style={{ marginTop: me ? 9 : 18 }} />
    </View>
  );

  if (!me || mine.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: c.warmBg }}>
        {header}
        <EmptyState
          title="Пока ни одной смены"
          text={`Первую можно взять без опыта и документов — таких сейчас ${noExpToday} ${plural(noExpToday, ['смена', 'смены', 'смен'])}.`}
          action="Посмотреть смены"
          onAction={() => navigation.navigate('Shifts')}
        />
        {!me ? (
          <Press feedback="none" onPress={() => navigation.navigate('Profile')} style={{ paddingHorizontal: 22 }}>
            <T v="body" c="accent">Уже есть аккаунт? Войти</T>
          </Press>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.warmBg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        {header}
        {tab === 'active' ? (
          <>
            {confirmed[0] ? (
              <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
                <PassCard
                  variant="compact"
                  shift={confirmed[0].shift}
                  company={confirmed[0].company}
                  location={confirmed[0].location}
                  onPress={() => open(confirmed[0].shift.id)}
                  onRoute={() => openRoute(confirmed[0].location)}
                />
              </View>
            ) : null}
            {confirmed.length > 1 ? (
              <>
                <WarmSection title="Ещё подтверждены" />
                {confirmed.slice(1).map((x, i, arr) => (
                  <ShiftRow
                    key={x.app.id}
                    warm
                    amount={x.shift.pay}
                    title={x.shift.title}
                    line2={when(x.shift)}
                    line2Right={<StatusText status="confirmed" label={countdown(x.shift, now).short} />}
                    line3={x.company?.companyName}
                    last={i === arr.length - 1}
                    onPress={() => open(x.shift.id)}
                  />
                ))}
              </>
            ) : null}
            {waiting.length ? (
              <>
                <WarmSection title="Ждут ответа" />
                {waiting.map((x, i, arr) => (
                  <ShiftRow
                    key={x.app.id}
                    warm
                    amount={x.shift.pay}
                    title={x.shift.title}
                    urgent={x.shift.urgent}
                    line2={when(x.shift)}
                    line2Right={(
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Icon name="clock" size={12} c="secondary" />
                        <T v="smallStrong" c="secondary">{ago(x.app.appliedAt, now)}</T>
                      </View>
                    )}
                    line3={x.company?.companyName}
                    last={i === arr.length - 1}
                    onPress={() => open(x.shift.id)}
                  />
                ))}
              </>
            ) : null}
            {!confirmed.length && !waiting.length ? (
              <EmptyState
                title="Активных смен нет"
                text={`Сейчас без опыта можно взять ${noExpToday} ${plural(noExpToday, ['смену', 'смены', 'смен'])}.`}
                action="Посмотреть смены"
                onAction={() => navigation.navigate('Shifts')}
              />
            ) : null}
          </>
        ) : byMonth.length ? (
          byMonth.map((g) => (
            <View key={g.title}>
              <WarmSection title={g.title} />
              {g.items.map(historyRow)}
            </View>
          ))
        ) : (
          <EmptyState title="История пока пустая" text="Здесь будут прошедшие смены и оценки." />
        )}
      </ScrollView>
    </View>
  );
}
