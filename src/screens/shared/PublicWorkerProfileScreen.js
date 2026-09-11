// A worker as employers see them (screen 21): the same numbers as in their
// own profile — cancellations shown as plainly as shifts — tags, and
// reviews signed by the companies that wrote them. Two actions: «Позвать
// на смену» now, «В свои люди» for later. The phone opens only to an
// employer this person has worked for (an approved or completed shift).
import React, { useMemo } from 'react';
import { View, ScrollView, Linking, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Button, Material, Press } from '../../design/ui';
import { SkyView } from '../../design/Sky';
import { PersonMono, CompanyMono } from '../../design/Monogram';
import { categoryFromBusiness } from '../../design/category';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { showActions } from '../../design/ActionSheet';
import { plural, parseDay, shiftStart, shortDate, timeRange } from '../../design/format';
import { prettyPhone } from '../../design/PhoneField';
import { BADGE_INFO } from '../../data/mockData';
import { openReportMenu } from '../../components/ReportMenu';
import useStore from '../../store/useStore';

const MONTHS_SINCE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// The header of this page is an evening sky, as in the mockup.
const HEADER_SKY = 'evening';

/** A raised surface whose content is clipped to the corners (shadow kept outside). */
function Surface({ children, radius = 18, style }) {
  const t = useTheme();
  return (
    <View style={[{ borderRadius: radius, backgroundColor: t.c.surface }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }, style]}>
      <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Stat({ value, label, flex = 1, valueC = 'ink', small }) {
  const t = useTheme();
  return (
    <View style={[{ flex, backgroundColor: t.c.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 11 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }]}>
      <T v={small ? 'moneyInline' : 'moneyCard'} c={valueC} style={small ? { fontSize: 15, lineHeight: 21 } : { fontSize: 19, lineHeight: 21, letterSpacing: 0 }} numberOfLines={1}>{value}</T>
      <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 11, lineHeight: 14 }} numberOfLines={2}>{label}</T>
    </View>
  );
}

function Pill({ label, tone = 'neutral' }) {
  const { c } = useTheme();
  const [bg, fg] = { success: [c.successTint, c.success], brand: [c.brandTint, c.brand] }[tone] || [c.surface2, c.ink3];
  return (
    <View style={{ paddingVertical: 6, paddingHorizontal: 11, borderRadius: 9, backgroundColor: bg }}>
      <T v="badge" c={fg} style={{ fontSize: 12, lineHeight: 15, letterSpacing: 0 }}>{label}</T>
    </View>
  );
}

export default function PublicWorkerProfileScreen({ route, navigation }) {
  const { workerId } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const worker = useStore((s) => s.getWorkerById(workerId));
  const applications = useStore((s) => s.applications);
  const reviewsAll = useStore((s) => s.reviews);
  const companies = useStore((s) => s.companies);
  const shifts = useStore((s) => s.shifts);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const favorite = useStore((s) => s.isFavorite(workerId));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const invite = useStore((s) => s.inviteWorkerToShift);

  const isEmployer = me?.role === 'employer';
  // Reviews by companies this viewer blocked disappear, as the block promises.
  const reviews = useMemo(() => reviewsAll
    .filter((r) => r.targetId === workerId && !blockedUsers.includes(r.authorId))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviewsAll, workerId, blockedUsers]);
  const cancels = useMemo(() => applications.filter((a) => a.workerId === workerId && a.status === 'cancelled_by_worker').length, [applications, workerId]);
  // Has this person been confirmed on (or finished) one of my shifts?
  const workedWithMe = useMemo(() => {
    if (!isEmployer) return false;
    const mine = new Set(shifts.filter((s) => s.companyId === me.id).map((s) => s.id));
    return applications.some((a) => a.workerId === workerId && (a.status === 'approved' || a.status === 'completed') && mine.has(a.shiftId));
  }, [applications, shifts, workerId, isEmployer, me?.id]);
  const myOpenShifts = useMemo(() => {
    if (!isEmployer) return [];
    const now = new Date();
    return shifts.filter((s) => s.companyId === me.id && s.status === 'active' && shiftStart(s) > now && s.spotsTaken < s.spotsTotal);
  }, [shifts, isEmployer, me?.id]);

  if (!worker) return <View style={{ flex: 1, backgroundColor: c.bg }} />;
  const self = me?.id === workerId;
  const fullName = `${worker.firstName || ''} ${worker.lastName || ''}`.trim();
  const sinceDate = worker.registeredAt ? parseDay(worker.registeredAt) : null;
  const since = sinceDate && !Number.isNaN(sinceDate.getTime()) ? `с ${MONTHS_SINCE[sinceDate.getMonth()]} ${sinceDate.getFullYear()}` : '';
  const done = worker.shiftsCompleted || 0;
  const reliable = worker.badges?.includes('no_cancels') && cancels === 0;
  const phoneOpen = isEmployer && !self && worker.phoneVisible !== false && !!worker.phone && workedWithMe;
  const phoneLater = isEmployer && !self && worker.phoneVisible !== false && !!worker.phone && !workedWithMe;
  const canReport = !!me && !self;
  const withPanel = isEmployer && !self;

  const tags = [];
  if (reliable) tags.push({ label: BADGE_INFO.no_cancels?.label || 'Без отмен', tone: 'success' });
  if (done >= 50) tags.push({ label: '50+ смен', tone: 'brand' });
  else if (done >= 10) tags.push({ label: `${Math.floor(done / 10) * 10}+ смен`, tone: 'brand' });
  if (worker.badges?.includes('top10') && BADGE_INFO.top10) tags.push({ label: BADGE_INFO.top10.label, tone: 'brand' });
  if (worker.badges?.includes('newbie') && BADGE_INFO.newbie) tags.push({ label: BADGE_INFO.newbie.label, tone: 'neutral' });
  if (worker.categories?.length) tags.push({ label: worker.categories.join(' · '), tone: 'neutral' });
  // The medical book is the worker's own mark, never «подтверждено».
  if (worker.documents?.medicalBook) tags.push({ label: 'Медкнижка · отметка исполнителя', tone: 'neutral' });

  const report = () => openReportMenu({ targetType: 'user', targetId: workerId, targetName: fullName, store: useStore.getState() });

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
          Alert.alert('Приглашение отправлено', 'Приглашение придёт уведомлением. Место остаётся в ленте, пока человек не откликнется.');
        },
      })),
    });
  };

  const toggleFav = () => {
    haptic.selection();
    toggleFavorite(workerId);
    toast.success(favorite ? 'Убрано из своих людей' : 'Добавлено в свои люди');
  };

  const sky = t.sky(HEADER_SKY);
  const panelH = 12 + 54 + insets.bottom + 10;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={sky.key === 'night' || t.dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: withPanel ? panelH + 20 : insets.bottom + 30 }}>
        <SkyView sky={sky} style={{ paddingBottom: 18 }}>
          <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CircleButton icon="chevron.left" variant="sky" color={sky.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            {canReport ? <CircleButton icon="ellipsis" variant="sky" color={sky.ink} onPress={report} accessibilityLabel="Ещё: пожаловаться или заблокировать" /> : null}
          </View>
          <View style={{ paddingTop: 16, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PersonMono first={worker.firstName} last={worker.lastName} uri={worker.avatar} size={64} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="titleScreen" c={sky.ink} style={{ fontSize: 21, lineHeight: 25, letterSpacing: -0.2 }} accessibilityRole="header">{fullName}</T>
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {worker.rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} accessible accessibilityLabel={`Рейтинг ${String(worker.rating.toFixed(1)).replace('.', ',')}`}>
                    <Icon name="star.fill" size={13} c={c.star} />
                    <T v="bodyStrong" c={sky.ink} weight="700" style={{ fontSize: 13, lineHeight: 17 }}>{worker.rating.toFixed(1)}</T>
                  </View>
                ) : null}
                {worker.city ? <T v="bodyStrong" c={sky.ink2} weight="500" style={{ fontSize: 13, lineHeight: 17 }}>{worker.rating ? `· ${worker.city}` : worker.city}</T> : null}
              </View>
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: gutter }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Stat value={String(done)} label={plural(done, ['смена', 'смены', 'смен'])} />
            <Stat value={String(cancels)} label={plural(cancels, ['отмена', 'отмены', 'отмен'])} valueC={cancels === 0 ? 'success' : 'ink'} />
            {since ? <Stat value={since} label="на платформе" flex={1.4} small /> : null}
          </View>

          {tags.length ? (
            <View style={{ marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {tags.map((tg) => <Pill key={tg.label} label={tg.label} tone={tg.tone} />)}
            </View>
          ) : null}

          {phoneOpen ? (
            <Surface style={{ marginTop: 12 }}>
              <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }}>Телефон</T>
                  <T v="rowTitle" style={{ marginTop: 3, fontSize: 16 }}>{prettyPhone(worker.phone)}</T>
                </View>
                <Button title="Позвонить" size="sm" variant="secondary" icon="phone" onPress={() => Linking.openURL(`tel:${worker.phone}`)} />
              </View>
            </Surface>
          ) : phoneLater ? (
            <T v="caption" c="ink2" style={{ marginTop: 12, paddingHorizontal: 4, fontSize: 12.5, lineHeight: 18 }}>
              Телефон откроется, когда подтвердишь этого человека на свою смену.
            </T>
          ) : null}

          <T v="titleSection" style={{ marginTop: 18, fontSize: 17, lineHeight: 21 }} accessibilityRole="header">Отзывы заказчиков</T>
          {reviews.length ? (
            <View style={{ marginTop: 9, gap: 8 }}>
              {reviews.map((r) => {
                const author = companies.find((co) => co.id === r.authorId);
                const name = author?.companyName || 'Заказчик';
                const rating = Number(r.overallRating || 0).toFixed(1);
                return (
                  <Surface key={r.id}>
                    <View style={{ paddingVertical: 12, paddingHorizontal: 14 }} accessible accessibilityLabel={`${name}, оценка ${rating.replace('.', ',')}${r.text ? `. ${r.text}` : ''}`}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                        <CompanyMono name={name} logo={author?.logo} size={28} category={categoryFromBusiness(author?.businessCategory) || undefined} />
                        <T v="bodyStrong" style={{ flex: 1, fontSize: 13.5, lineHeight: 17 }} numberOfLines={1}>{name}</T>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Icon name="star.fill" size={12} c={c.star} />
                          <T v="bodyStrong" weight="700" style={{ fontSize: 13, lineHeight: 16 }}>{rating}</T>
                        </View>
                      </View>
                      {r.text ? <T v="body" c="ink3" style={{ marginTop: 8, fontSize: 14, lineHeight: 20 }}>{r.text}</T> : null}
                      {r.tags?.length ? <T v="caption" c="ink2" style={{ marginTop: 6, fontSize: 12.5 }}>{r.tags.join(' · ')}</T> : null}
                    </View>
                  </Surface>
                );
              })}
            </View>
          ) : (
            <View style={{ marginTop: 9, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surface2 }}>
              <T v="caption" c="ink3" weight="500" style={{ fontSize: 13.5, lineHeight: 19 }}>
                {self ? 'Отзывов пока нет. Они появятся после первых смен.' : 'Отзывов пока нет. Они появляются после смен.'}
              </T>
            </View>
          )}

          {canReport ? (
            <Press feedback="none" onPress={report} accessibilityLabel="Пожаловаться" style={{ alignSelf: 'center', marginTop: 8, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}>
              <T v="body" c="error" style={{ fontSize: 14, lineHeight: 18 }}>Пожаловаться</T>
            </Press>
          ) : null}
        </View>
      </ScrollView>

      {withPanel ? (
        <Material style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: gutter, paddingBottom: insets.bottom + 10, flexDirection: 'row', gap: 9 }}>
          <Button title="Позвать на смену" onPress={callOrInvite} style={{ flex: 1 }} />
          <Press
            onPress={toggleFav}
            accessibilityLabel={favorite ? 'Убрать из своих людей' : 'В свои люди'}
            accessibilityState={{ selected: favorite }}
            style={{ width: 54, height: 54, borderRadius: 17, backgroundColor: favorite ? c.brand : c.brandTint, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name={favorite ? 'person.fill.checkmark' : 'person.badge.plus'} size={24} c={favorite ? 'onBrand' : 'brand'} />
          </Press>
        </Material>
      ) : null}
    </View>
  );
}
