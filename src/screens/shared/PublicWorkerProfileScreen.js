// A worker as employers see them: the same four numbers as in their own
// profile — cancellations shown as plainly as the rating — plus reviews.
import React, { useMemo } from 'react';
import { View, ScrollView, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, PersonAvatar, StatRow, FillBanner, SectionHeader, LedgerRow, Separator, EmptyState, Button, RoundButton } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, ago, presence, parseDay, shiftStart, shortDate, timeRange } from '../../design/format';
import { prettyPhone } from '../../design/PhoneField';
import { BADGE_INFO } from '../../data/mockData';
import ReportMenu from '../../components/ReportMenu';
import useStore from '../../store/useStore';

const MONTHS_SINCE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export default function PublicWorkerProfileScreen({ route, navigation }) {
  const { workerId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const worker = useStore((s) => s.getWorkerById(workerId));
  const applications = useStore((s) => s.applications);
  const reviewsAll = useStore((s) => s.reviews);
  const companies = useStore((s) => s.companies);
  const shifts = useStore((s) => s.shifts);
  const favorite = useStore((s) => s.isFavorite(workerId));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const invite = useStore((s) => s.inviteWorkerToShift);

  const isEmployer = me?.role === 'employer';
  const reviews = useMemo(() => reviewsAll.filter((r) => r.targetId === workerId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviewsAll, workerId]);
  const cancels = useMemo(() => applications.filter((a) => a.workerId === workerId && a.status === 'cancelled_by_worker').length, [applications, workerId]);
  const withMe = useMemo(() => (isEmployer ? applications.filter((a) => a.workerId === workerId && a.status === 'approved' && shifts.find((s) => s.id === a.shiftId)?.companyId === me.id).length : 0), [applications, shifts, workerId, isEmployer, me?.id]);
  const myOpenShifts = useMemo(() => {
    if (!isEmployer) return [];
    const now = new Date();
    return shifts.filter((s) => s.companyId === me.id && s.status === 'active' && shiftStart(s) > now && s.spotsTaken < s.spotsTotal);
  }, [shifts, isEmployer, me?.id]);

  if (!worker) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;
  const self = me?.id === workerId;
  const since = worker.registeredAt ? (() => { const d = parseDay(worker.registeredAt); return `с ${MONTHS_SINCE[d.getMonth()]} ${d.getFullYear()}`; })() : '';
  const badges = (worker.badges || []).map((b) => BADGE_INFO[b]?.label).filter(Boolean);
  const reliable = worker.badges?.includes('no_cancels') && cancels === 0;

  const callOrInvite = () => {
    if (!myOpenShifts.length) {
      Alert.alert('Нет открытых смен', 'Создай смену — и сможешь позвать на неё исполнителя.', [
        { text: 'Не сейчас', style: 'cancel' },
        { text: 'Создать смену', onPress: () => navigation.navigate('CreateShift') },
      ]);
      return;
    }
    showActions({
      title: `Позвать ${worker.firstName} на смену`,
      options: myOpenShifts.map((s) => ({
        label: `${s.title} · ${shortDate(s.date)}, ${timeRange(s)}`,
        onPress: () => {
          const r = invite(workerId, s.id);
          if (r?.error === 'already_invited') { Alert.alert('Уже позвали', `${worker.firstName} уже получил(а) приглашение на эту смену.`); return; }
          haptic.success();
          Alert.alert('Приглашение отправлено', `${worker.firstName} увидит его в уведомлениях.`);
        },
      })),
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar
        variant="fill"
        onBack={() => navigation.goBack()}
        right={!self ? (
          <>
            {isEmployer ? <RoundButton icon={favorite ? 'heart.fill' : 'heart'} variant="fill" onPress={() => { haptic.selection(); toggleFavorite(workerId); }} accessibilityLabel={favorite ? 'Убрать из своих людей' : 'Добавить в свои люди'} /> : null}
            <ReportMenu targetType="user" targetId={workerId} targetName={`${worker.firstName} ${worker.lastName}`} />
          </>
        ) : null}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (isEmployer && !self ? 110 : 30) }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <PersonAvatar first={worker.firstName} last={worker.lastName} uri={worker.avatar} size={60} />
          <View style={{ flex: 1 }}>
            <T v="sheetTitle" accessibilityRole="header">{worker.firstName} {worker.lastName}</T>
            <T v="caption" c="secondary" style={{ marginTop: 2 }}>{[worker.city, since, presence(worker.lastSeen)].filter(Boolean).join(' · ')}</T>
          </View>
        </View>
        <StatRow
          style={{ marginTop: 22 }}
          items={[
            { label: 'рейтинг', value: worker.rating ? worker.rating.toFixed(1) : '—' },
            { label: plural(worker.shiftsCompleted || 0, ['смена', 'смены', 'смен']), value: String(worker.shiftsCompleted || 0) },
            { label: plural(cancels, ['отмена', 'отмены', 'отмен']), value: String(cancels) },
            isEmployer ? { label: 'у тебя', value: String(withMe) } : { label: plural(reviews.length, ['отзыв', 'отзыва', 'отзывов']), value: String(reviews.length) },
          ]}
        />
        {reliable ? (
          <FillBanner style={{ marginTop: 20 }} icon="checkmark.shield" title="Надёжный исполнитель" text={`${worker.shiftsCompleted} ${plural(worker.shiftsCompleted, ['смена', 'смены', 'смен'])} и ни одной отмены`} />
        ) : <Separator style={{ marginTop: 20 }} />}
        {worker.categories?.length ? <LedgerRow label="Умеет" value={worker.categories.join(', ')} /> : null}
        {badges.length ? <LedgerRow label="Метки" value={badges.join(', ')} /> : null}
        <LedgerRow label="Документы" value={[worker.documents?.passport ? 'паспорт' : null, worker.documents?.medicalBook ? 'медкнижка' : null].filter(Boolean).join(', ') || 'не указаны'} valueC={worker.documents?.passport || worker.documents?.medicalBook ? 'label' : 'secondary'} />
        {isEmployer && worker.phoneVisible !== false && worker.phone ? (
          <LedgerRow label="Телефон" value={prettyPhone(worker.phone)} alignTop={false} right={<Button title="Позвонить" size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL(`tel:${worker.phone}`)} />} last />
        ) : null}

        <SectionHeader title="Отзывы заказчиков" right={reviews.length ? String(reviews.length) : undefined} />
        {reviews.length ? reviews.map((r, i) => {
          const author = companies.find((co) => co.id === r.authorId);
          return (
            <View key={r.id}>
              <View style={{ paddingHorizontal: 22, paddingVertical: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="star.fill" size={11} c="label" />
                  <T v="bodyStrong">{Number(r.overallRating || 0).toFixed(1)}</T>
                  <T v="caption" c="secondary" style={{ flex: 1 }} numberOfLines={1}>· {author?.companyName || 'Заказчик'}</T>
                  <T v="small" c="secondary">{ago(r.createdAt)}</T>
                </View>
                {r.text ? <T v="body" style={{ marginTop: 4 }}>{r.text}</T> : null}
                {r.tags?.length ? <T v="small" c="secondary" style={{ marginTop: 4 }}>{r.tags.join(' · ')}</T> : null}
              </View>
              {i < reviews.length - 1 ? <Separator inset /> : null}
            </View>
          );
        }) : <EmptyState title="Отзывов пока нет" text={self ? 'Они появятся после первых смен.' : 'Отзывы появляются после смен.'} />}
        <Separator />
      </ScrollView>

      {isEmployer && !self ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 10, backgroundColor: c.glassFallback, borderTopWidth: 1, borderTopColor: c.glassFallbackBorder }}>
          <Button title="Позвать на смену" onPress={callOrInvite} />
        </View>
      ) : null}
    </View>
  );
}
