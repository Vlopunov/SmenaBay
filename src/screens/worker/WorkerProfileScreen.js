// «Профиль» — screen 14. A sky header with the monogram; four numbers in
// one row, «0 отмен» in green — the worker's main capital. The medical book
// is honestly a mark the worker sets themself and names its payoff in
// shifts («нужна для 5 смен в ленте»), not «complete your profile».
import React, { useMemo } from 'react';
import { View, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import { Card, Group, Row } from '../../design/ui';
import { SkyView } from '../../design/Sky';
import { PersonMono } from '../../design/Monogram';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { plural, parseDay, shiftStart, shiftEnd, monthName } from '../../design/format';
import { showActions } from '../../design/ActionSheet';
import { haptic } from '../../design/haptics';
import { LINKS, openLink } from '../../constants/links';
import DeleteAccountRow from '../../components/DeleteAccountButton';
import useStore from '../../store/useStore';

const MONTHS_SINCE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

// One of the four numbers: display 19 over an 11 pt label.
function Stat({ value, label, valueC = 'ink', flex = 1, children }) {
  return (
    <Card radius={14} style={{ flex, paddingVertical: 10, paddingHorizontal: 11 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {children || (
          <T v="moneyCard" c={valueC} numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 19, lineHeight: 22, letterSpacing: 0 }}>{value}</T>
        )}
      </View>
      <T v="caption" c="ink2" numberOfLines={1} style={{ marginTop: 3, fontSize: 11, lineHeight: 13 }}>{label}</T>
    </Card>
  );
}

export default function WorkerProfileScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const applications = useStore((s) => s.applications);
  const shifts = useStore((s) => s.shifts);
  const reviews = useStore((s) => s.reviews);
  const savedMap = useStore((s) => s.savedShifts);
  const logout = useStore((s) => s.logout);
  const updateProfile = useStore((s) => s.updateProfile);
  const unread = useStore((s) => s.getUnreadCount());

  const stats = useMemo(() => {
    if (!me) return null;
    const mine = applications.filter((a) => a.workerId === me.id);
    const cancels = mine.filter((a) => a.status === 'cancelled_by_worker').length;
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const earned = mine
      .filter((a) => a.status === 'approved' || a.status === 'completed')
      .map((a) => shifts.find((s) => s.id === a.shiftId))
      .filter((s) => s && s.status !== 'cancelled' && shiftEnd(s) <= now && parseDay(s.date) >= month)
      .reduce((sum, s) => sum + s.pay, 0);
    const medNeeded = shifts.filter((s) => s.status === 'active' && s.requirements?.medicalBookRequired && s.spotsTaken < s.spotsTotal && shiftEnd(s) > now).length;
    const savedIds = savedMap[me.id] || [];
    const saved = shifts.filter((s) => savedIds.includes(s.id) && s.status !== 'cancelled' && shiftStart(s) > now).length;
    const aboutMe = reviews.filter((r) => r.targetId === me.id).length;
    return { cancels, earned, medNeeded, saved, aboutMe };
  }, [me, applications, shifts, reviews, savedMap]);

  if (!me) return null;

  const since = me.registeredAt ? (() => { const d = parseDay(me.registeredAt); return `с ${MONTHS_SINCE[d.getMonth()]} ${d.getFullYear()}`; })() : '';
  const reliable = me.badges?.includes('no_cancels') && stats.cancels === 0;
  const done = me.shiftsCompleted || 0;
  const hasMed = !!me.documents?.medicalBook;
  const sky = t.sky('day');

  const confirmLogout = () => Alert.alert('Выйти из аккаунта?', 'Смены можно будет смотреть и без входа.', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', onPress: logout },
  ]);

  // Self-declared: the app doesn't check documents, so the card says what
  // the worker told us and the employer checks it on site.
  const markMed = () => showActions({
    title: 'Медкнижка',
    message: 'Это твоя отметка — документы в приложении не проверяются. Смены, где медкнижка нужна, помечены в требованиях.',
    options: [
      { label: 'У меня есть медкнижка', onPress: () => { updateProfile({ documents: { ...me.documents, medicalBook: true } }); haptic.success(); } },
      { label: 'Медкнижки нет', onPress: () => { updateProfile({ documents: { ...me.documents, medicalBook: false } }); haptic.selection(); } },
    ],
  });

  const legal = () => showActions({
    title: 'Условия и политика',
    options: [
      { label: 'Условия использования', onPress: () => openLink(LINKS.terms) },
      { label: 'Политика конфиденциальности', onPress: () => openLink(LINKS.privacy) },
    ],
  });

  const medSub = hasMed
    ? 'Твоя отметка. Возьми с собой — на входе могут попросить'
    : stats.medNeeded
      ? `Нужна для ${stats.medNeeded} ${plural(stats.medNeeded, ['смены', 'смен', 'смен'])} в ленте`
      : 'Смены, где она нужна, помечены в требованиях';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        <SkyView sky={sky} style={{ paddingBottom: 18 }}>
          <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <PersonMono first={me.firstName} last={me.lastName} uri={me.avatar} size={72} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="titleScreen" c={sky.ink} style={{ fontSize: 22, lineHeight: 26, letterSpacing: -0.22 }} numberOfLines={2} accessibilityRole="header">
                {`${me.firstName || ''} ${me.lastName || ''}`.trim()}
              </T>
              <T v="caption" c={sky.ink2} weight="500" style={{ marginTop: 3, fontSize: 13.5, lineHeight: 18 }}>
                {[me.city || 'Минск', since].filter(Boolean).join(' · ')}
              </T>
              {reliable ? (
                <View style={{ marginTop: 7, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingLeft: 7, paddingRight: 9, borderRadius: 8, backgroundColor: c.onSky }}>
                  <Icon name="checkmark" size={12} c="success" weight="heavy" />
                  <T v="badge" c="success" style={{ fontSize: 11.5, lineHeight: 14, letterSpacing: 0 }}>Надёжный исполнитель</T>
                </View>
              ) : null}
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: gutter }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Stat label="рейтинг">
              {me.rating ? <Icon name="star.fill" size={14} c={c.star} /> : null}
              <T v="moneyCard" numberOfLines={1} style={{ fontSize: 19, lineHeight: 22, letterSpacing: 0 }}>{me.rating ? me.rating.toFixed(1) : '—'}</T>
            </Stat>
            <Stat value={String(done)} label={plural(done, ['смена', 'смены', 'смен'])} />
            <Stat value={String(stats.cancels)} valueC={stats.cancels === 0 ? 'success' : 'ink'} label={plural(stats.cancels, ['отмена', 'отмены', 'отмен'])} />
            <Stat label={`за ${monthName()}`} flex={1.4}>
              <Money value={stats.earned} size="card" fontSize={19} style={{ letterSpacing: 0 }} />
            </Stat>
          </View>

          <Card
            radius={18}
            onPress={markMed}
            accessibilityLabel={`${hasMed ? 'Медкнижка есть' : 'Медкнижки нет'}. ${medSub}. ${hasMed ? 'Изменить' : 'Отметить'}`}
            style={{ marginTop: 12, paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: hasMed ? c.successTint : c.urgentTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="doc.text" size={21} c={hasMed ? c.success : c.urgentInk} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong" weight="700" style={{ fontSize: 15, lineHeight: 19 }}>{hasMed ? 'Медкнижка есть' : 'Медкнижки нет'}</T>
              <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 17 }}>{medSub}</T>
            </View>
            <View style={{ paddingVertical: 9, paddingHorizontal: 13, borderRadius: 12, backgroundColor: c.brandTint }}>
              <T v="bodyStrong" c="brand" style={{ fontSize: 13.5, lineHeight: 16 }}>{hasMed ? 'Изменить' : 'Отметить'}</T>
            </View>
          </Card>

          <Group style={[{ marginTop: 18, borderRadius: 18 }, t.sh.e1]}>
            <Row icon="person" title="Личные данные" onPress={() => navigation.navigate('PersonalData')} />
            <Row icon="star" title="Отзывы обо мне" value={stats.aboutMe ? String(stats.aboutMe) : undefined} onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: me.id })} />
            <Row icon="bookmark" title="Сохранённые смены" value={stats.saved ? String(stats.saved) : undefined} onPress={() => navigation.navigate('SavedShifts')} />
            <Row icon="bell" title="Уведомления" badge={unread || undefined} onPress={() => navigation.navigate('Notifications')} last />
          </Group>

          <Group style={[{ marginTop: 12, borderRadius: 18 }, t.sh.e1]}>
            <Row icon="questionmark.circle" title="Помощь и поддержка" onPress={() => navigation.navigate('FAQ')} />
            <Row icon="doc.text" title="Условия и политика" onPress={legal} last />
          </Group>

          <Group style={[{ marginTop: 12, borderRadius: 18 }, t.sh.e1]}>
            <Row icon="rectangle.portrait.and.arrow.right" iconC="ink3" title="Выйти" chevron={false} onPress={confirmLogout} />
            <DeleteAccountRow last />
          </Group>

          <T v="caption" c="ink2" style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>СменаБел 1.0.0</T>
        </View>
      </ScrollView>
    </View>
  );
}
