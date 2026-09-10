// Worker profile (handoff screen 8). Four numbers in one line; the
// «Надёжный исполнитель» plaque; the medical book row names the price of not
// having one in shifts («нужна для 9 смен в ленте»), not «complete your profile».
import React, { useMemo } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { StatRow, FillBanner, SectionHeader, LedgerRow, SettingRow, Separator } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { money, plural, parseDay, shiftEnd, monthName } from '../../design/format';
import { prettyPhone } from '../../design/PhoneField';
import { showActions } from '../../design/ActionSheet';
import { haptic } from '../../design/haptics';
import { LINKS, openLink } from '../../constants/links';
import DeleteAccountRow from '../../components/DeleteAccountButton';
import useStore from '../../store/useStore';

const MONTHS_SINCE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export default function WorkerProfileScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const me = useStore((s) => s.currentUser);
  const applications = useStore((s) => s.applications);
  const shifts = useStore((s) => s.shifts);
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
    return { cancels, earned, medNeeded };
  }, [me, applications, shifts]);

  if (!me) return null;

  const since = me.registeredAt ? (() => { const d = parseDay(me.registeredAt); return `с ${MONTHS_SINCE[d.getMonth()]} ${d.getFullYear()}`; })() : '';
  const reliable = me.badges?.includes('no_cancels') && stats.cancels === 0;

  const confirmLogout = () => Alert.alert('Выйти из аккаунта?', 'Смены можно будет смотреть и без входа.', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', onPress: logout },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22 }}>
          <T v="screenTitle" accessibilityRole="header" numberOfLines={2}>{me.firstName} {me.lastName}</T>
          <T v="caption" c="secondary" style={{ marginTop: 2 }}>{[me.phone ? prettyPhone(me.phone) : null, since].filter(Boolean).join(' · ')}</T>
        </View>

        <StatRow
          style={{ marginTop: 22 }}
          items={[
            { label: 'рейтинг', value: me.rating ? me.rating.toFixed(1) : '—' },
            { label: plural(me.shiftsCompleted || 0, ['смена', 'смены', 'смен']), value: String(me.shiftsCompleted || 0) },
            { label: plural(stats.cancels, ['отмена', 'отмены', 'отмен']), value: String(stats.cancels) },
            { label: `BYN за ${monthName()}`, value: money(stats.earned) },
          ]}
        />

        {reliable ? (
          <FillBanner
            style={{ marginTop: 20 }}
            icon="checkmark.shield"
            title="Надёжный исполнитель"
            text={`${me.shiftsCompleted} ${plural(me.shiftsCompleted, ['смена', 'смены', 'смен'])} без отмен — заказчики видят метку в отклике`}
          />
        ) : <Separator style={{ marginTop: 20 }} />}

        {/* Self-declared: the app doesn't check documents, so the row says what
            the worker told us and the employer checks it on site. */}
        <SectionHeader title="Документы" top={!reliable ? false : true} />
        <LedgerRow
          label="Медкнижка"
          value={me.documents?.medicalBook ? 'Есть' : 'Нет'}
          sub={me.documents?.medicalBook
            ? 'Возьми с собой — на входе могут попросить'
            : stats.medNeeded ? `Нужна для ${stats.medNeeded} ${plural(stats.medNeeded, ['смены', 'смен', 'смен'])} в ленте` : undefined}
          onPress={() => showActions({
            title: 'Медкнижка',
            message: 'Смены, где она нужна, помечены в требованиях.',
            options: [
              { label: 'У меня есть медкнижка', onPress: () => { updateProfile({ documents: { ...me.documents, medicalBook: true } }); haptic.success(); } },
              { label: 'Медкнижки нет', onPress: () => { updateProfile({ documents: { ...me.documents, medicalBook: false } }); haptic.selection(); } },
            ],
          })}
          chevron
          last
        />

        <SectionHeader title="Аккаунт" />
        <SettingRow icon="person" title="Личные данные" sub={[me.city, me.categories?.length ? `${me.categories.length} ${plural(me.categories.length, ['категория', 'категории', 'категорий'])}` : null].filter(Boolean).join(' · ') || 'Имя, город, что умеешь'} onPress={() => navigation.navigate('PersonalData')} />
        <SettingRow icon="bookmark" title="Сохранённые смены" onPress={() => navigation.navigate('SavedShifts')} />
        <SettingRow icon="star" title="Отзывы обо мне" onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: me.id })} />
        <SettingRow icon="bell" title="Уведомления" right={unread ? <T v="caption" c="secondary">{unread} новых</T> : undefined} onPress={() => navigation.navigate('Notifications')} last />

        <SectionHeader title="Поддержка" />
        <SettingRow icon="questionmark.circle" title="Помощь и контакты" onPress={() => navigation.navigate('FAQ')} />
        <SettingRow icon="doc.text" title="Условия использования" right={<Icon name="arrow.up.right" size={13} c="tertiary" />} onPress={() => openLink(LINKS.terms)} />
        <SettingRow icon="lock.shield" title="Политика конфиденциальности" right={<Icon name="arrow.up.right" size={13} c="tertiary" />} onPress={() => openLink(LINKS.privacy)} last />

        <Separator style={{ marginTop: 26 }} />
        <SettingRow icon="rectangle.portrait.and.arrow.right" title="Выйти" destructive onPress={confirmLogout} />
        <DeleteAccountRow />
        <Separator />
        <T v="small" c="secondary" style={{ textAlign: 'center', marginTop: 18 }}>СменаБел 1.0.0</T>
      </ScrollView>
    </View>
  );
}
