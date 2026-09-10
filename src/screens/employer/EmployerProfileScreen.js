// Employer profile (handoff screen 16). The company's cancellations are
// shown as plainly as a worker's in their profile: symmetric rules matter
// more than one side's comfort.
import React, { useMemo } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { StatRow, FillBanner, SectionHeader, SettingRow, Separator, Monogram } from '../../design/ui';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { plural, monthName, shiftEnd } from '../../design/format';
import { LINKS, openLink } from '../../constants/links';
import DeleteAccountRow from '../../components/DeleteAccountButton';
import { employerSnapshot, PLAN_NAMES, PLAN_LIMITS } from './employerData';
import useStore from '../../store/useStore';

export default function EmployerProfileScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(60000);
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const favorites = useStore((s) => (s.currentUser ? s.favorites[s.currentUser.id] : null));
  const unread = useStore((s) => s.getUnreadCount());
  const logout = useStore((s) => s.logout);
  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);
  if (!me) return null;

  const plan = me.plan || 'free';
  const limit = PLAN_LIMITS[plan];
  const locations = me.locations || [];
  const activeAt = (id) => shifts.filter((s) => s.locationId === id && (s.status === 'active' || s.status === 'filled') && shiftEnd(s) > now).length;

  const confirmLogout = () => Alert.alert('Выйти из аккаунта?', '', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', onPress: logout },
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <T v="screenTitle" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75} accessibilityRole="header">{me.companyName}</T>
            <T v="caption" c="secondary" style={{ marginTop: 2 }}>{[me.businessCategory, me.unp ? `УНП ${me.unp}` : null].filter(Boolean).join(' · ')}</T>
          </View>
          <Monogram name={me.companyName} logo={me.logo} size={48} />
        </View>

        <StatRow
          style={{ marginTop: 22 }}
          items={[
            { label: 'рейтинг точки', value: me.rating ? me.rating.toFixed(1) : '—' },
            { label: plural(me.totalShiftsPublished || 0, ['смена', 'смены', 'смен']), value: String(me.totalShiftsPublished || snap.own.length) },
            { label: 'заполнено', value: `${snap.fillRate}%` },
            { label: plural(snap.cancelledThisMonth, ['отмена', 'отмены', 'отмен']), value: String(snap.cancelledThisMonth) },
          ]}
        />
        {snap.cancelledThisMonth >= 2 ? (
          <FillBanner
            style={{ marginTop: 20 }}
            icon="exclamationmark.circle"
            title={`${snap.cancelledThisMonth} ${plural(snap.cancelledThisMonth, ['отмена', 'отмены', 'отмен'])} за ${monthName()}`}
            text="Исполнители видят число отмен в профиле точки, когда решают, откликаться ли."
          />
        ) : <Separator style={{ marginTop: 20 }} />}

        <SectionHeader title="Тариф" top={snap.cancelledThisMonth >= 2} />
        <SettingRow
          icon="doc.text"
          title={`${PLAN_NAMES[plan]} · ${Number.isFinite(limit) ? `до ${limit} ${plural(limit, ['смены', 'смен', 'смен'])} в месяц` : 'без ограничений'}`}
          sub={`За ${monthName()} опубликовано ${snap.monthCount}${Number.isFinite(limit) ? ` из ${limit}` : ''}`}
          onPress={() => navigation.navigate('Plans')}
          last
        />

        <SectionHeader title="Точки" right="Добавить" onRightPress={() => navigation.navigate('Locations')} />
        {locations.length ? locations.map((l, i) => {
          const n = activeAt(l.id);
          return (
            <SettingRow
              key={l.id}
              icon="mappin.and.ellipse"
              title={l.address}
              sub={n ? `${n} ${plural(n, ['активная смена', 'активные смены', 'активных смен'])}` : 'Смен нет'}
              onPress={() => navigation.navigate('Locations')}
              last={i === locations.length - 1}
            />
          );
        }) : <SettingRow icon="plus" title="Добавить первую точку" sub="Без адреса смену не опубликовать" onPress={() => navigation.navigate('Locations')} last />}

        <SectionHeader title="Команда и свои люди" />
        <SettingRow icon="heart" title="Свои люди" sub={favorites?.length ? `${favorites.length} ${plural(favorites.length, ['человек', 'человека', 'человек'])} — зови их первыми` : 'Добавляй тех, кто хорошо отработал'} onPress={() => navigation.navigate('Favorites')} />
        <SettingRow icon="person.2" title="Каталог исполнителей" sub="Поиск по городу и навыкам" onPress={() => navigation.navigate('WorkerDirectory')} last />

        <SectionHeader title="Аккаунт" />
        <SettingRow icon="building.2" title="Данные компании" sub="Название, УНП, контакт, логотип" onPress={() => navigation.navigate('CompanyData')} />
        <SettingRow icon="bell" title="Уведомления" right={unread ? <T v="caption" c="secondary">{unread} новых</T> : undefined} onPress={() => navigation.navigate('Notifications')} />
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
