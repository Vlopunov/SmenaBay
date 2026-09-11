// «Профиль компании» — screen 28. The company on a day sky, four numbers,
// then a plate about cancellations: praise when there are none, an honest
// count when there are. Workers see the same number in the company profile,
// so the rules are symmetric. The plan limit sits in its row as a number.
import React, { useMemo } from 'react';
import { View, ScrollView, Alert, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Row, Press } from '../../design/ui';
import { SkyView } from '../../design/Sky';
import { CompanyMono, companyLetters } from '../../design/Monogram';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { plural } from '../../design/format';
import { LINKS, openLink } from '../../constants/links';
import DeleteAccountRow from '../../components/DeleteAccountButton';
import { employerSnapshot, PLAN_NAMES, PLAN_LIMITS } from './employerData';
import useStore from '../../store/useStore';

const MONO = Platform.select({ ios: 'ui-monospace', default: 'monospace' });

/** Surface card that keeps its shadow on iOS and still clips the row wash. */
function Panel({ children, style }) {
  const t = useTheme();
  return (
    <View style={[{ backgroundColor: t.c.surface, borderRadius: 18 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }, style]}>
      <View style={{ borderRadius: 17, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

/** One of the four numbers: display 18 over a 10.5 label. */
function Stat({ value, label, valueC = 'ink', star, flex = 1 }) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[{ flex, backgroundColor: t.c.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 11 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
        {star ? <Icon name="star.fill" size={13} c="star" /> : null}
        <T v="moneyInline" display weight="800" c={valueC} numberOfLines={1} style={{ fontSize: 18, lineHeight: 21 }}>{value}</T>
      </View>
      <T v="caption" c="ink2" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ marginTop: 3, fontSize: 10.5, lineHeight: 13 }}>{label}</T>
    </View>
  );
}

/** Letters on the page ground (on the sky) or the real logo. */
function CompanyTile({ name, logo, size = 64 }) {
  const { c } = useTheme();
  if (logo) return <CompanyMono name={name} logo={logo} size={size} style={{ borderRadius: Math.round(size / 3) }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
      <T v="body" display weight="800" c="brand" maxFontSizeMultiplier={1.2} style={{ fontSize: Math.round(size * 0.34), lineHeight: Math.round(size * 0.42) }}>{companyLetters(name)}</T>
    </View>
  );
}

export default function EmployerProfileScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
  const tabSpace = useTabBarSpace();
  const now = useNow(60000);
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const favorites = useStore((s) => (s.currentUser ? s.favorites[s.currentUser.id] : null));
  const blocked = useStore((s) => s.blockedUsers);
  const unread = useStore((s) => s.getUnreadCount());
  const logout = useStore((s) => s.logout);
  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);
  // Counted exactly as createShift counts it against the limit.
  const used = useMemo(() => {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return shifts.filter((s) => s.companyId === me?.id && s.createdAt >= monthStart && s.status !== 'cancelled').length;
  }, [shifts, me?.id, now]);
  if (!me) return null;

  const plan = me.plan || 'free';
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const locations = me.locations || [];
  // Counted the way «Свои люди» lists them: existing, not blocked.
  const people = workers.filter((w) => (favorites || []).includes(w.id) && !blocked.includes(w.id)).length;
  // The same number workers see in the public company profile.
  const cancels = snap.own.filter((s) => s.status === 'cancelled').length;
  const published = me.totalShiftsPublished || snap.own.length;
  const s = t.sky('day');

  const confirmLogout = () => Alert.alert('Выйти из аккаунта?', '', [
    { text: 'Отмена', style: 'cancel' },
    { text: 'Выйти', onPress: logout },
  ]);

  let plate;
  if (cancels === 0) {
    plate = { bg: c.successTint, fg: c.success, icon: 'checkmark', text: 'Ни одной отмены со стороны компании. Исполнители видят это в профиле и охотнее откликаются.' };
  } else {
    const n = `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}`;
    plate = cancels >= 2
      ? { bg: c.urgentTint, fg: c.urgentInk, icon: 'exclamationmark.circle', text: `${n} со стороны компании. Исполнители видят это число в профиле, когда решают, откликаться ли.` }
      : { bg: c.surface2, fg: c.ink3, icon: 'info.circle', text: `${n} со стороны компании. Исполнители видят это число в профиле, когда решают, откликаться ли.` };
  }

  const link = (title, url) => (
    <Press onPress={() => openLink(url)} hitSlop={6} accessibilityRole="link" style={{ paddingVertical: 8, paddingHorizontal: 8 }}>
      <T v="body" c="brand" style={{ fontSize: 14, lineHeight: 18 }}>{title}</T>
    </Press>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: tabSpace }}>
        <SkyView sky={s} style={{ paddingTop: insets.top + 8, paddingBottom: 16, paddingHorizontal: g }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <CompanyTile name={me.companyName} logo={me.logo} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="titleSection" display weight="800" c={s.ink} numberOfLines={2} accessibilityRole="header" style={{ fontSize: 21, lineHeight: 25, letterSpacing: -0.21 }}>{me.companyName}</T>
              {me.unp || me.contactPerson ? (
                <T v="caption" c={s.ink2} weight="500" numberOfLines={2} style={{ marginTop: 4, fontSize: 13, lineHeight: 17 }}>
                  {[me.unp ? `УНП ${me.unp}` : null, me.contactPerson || null].filter(Boolean).join(' · ')}
                </T>
              ) : null}
              <View style={{ marginTop: 7, alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: c.urgentTint }}>
                <T v="badge" c={s.ink} style={{ fontSize: 11.5, lineHeight: 14, letterSpacing: 0 }}>{`Тариф «${PLAN_NAMES[plan] || PLAN_NAMES.free}»`}</T>
              </View>
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: g }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Stat star value={me.rating ? me.rating.toFixed(1) : '—'} label="рейтинг" />
            <Stat value={String(published)} label={plural(published, ['смена', 'смены', 'смен'])} />
            <Stat value={String(cancels)} valueC={cancels ? 'ink' : 'success'} label={plural(cancels, ['отмена', 'отмены', 'отмен'])} />
            <Stat value={`${snap.fillRate}%`} label="заполняемость" flex={1.2} />
          </View>

          <View style={{ marginTop: 12, backgroundColor: plate.bg, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 11 }}>
            <Icon name={plate.icon} size={19} c={plate.fg} weight="bold" style={{ marginTop: 1 }} />
            <T v="body" c={plate.fg} weight="500" style={{ flex: 1, fontSize: 13.5, lineHeight: 19.5 }}>{plate.text}</T>
          </View>

          <Panel style={{ marginTop: 16 }}>
            <Row
              icon="chart.bar"
              title="Тариф и лимиты"
              value={Number.isFinite(limit) ? `${used} из ${limit}` : 'без ограничений'}
              onPress={() => navigation.navigate('Plans')}
            />
            <Row icon="mappin.and.ellipse" title="Точки" value={String(locations.length)} onPress={() => navigation.navigate('Locations')} />
            <Row icon="person.crop.circle.badge.checkmark" title="Свои люди" value={String(people)} onPress={() => navigation.navigate('Favorites')} />
            <Row icon="magnifyingglass" title="Каталог исполнителей" onPress={() => navigation.navigate('WorkerDirectory')} last />
          </Panel>

          <Panel style={{ marginTop: 12 }}>
            <Row icon="building.2" title="Данные компании" onPress={() => navigation.navigate('CompanyData')} />
            <Row icon="bell" title="Уведомления" badge={unread} onPress={() => navigation.navigate('Notifications')} />
            <Row icon="questionmark.circle" title="Помощь и поддержка" onPress={() => navigation.navigate('FAQ')} last />
          </Panel>

          <Panel style={{ marginTop: 16 }}>
            <Row icon="rectangle.portrait.and.arrow.right" iconC="ink2" title="Выйти" chevron={false} onPress={confirmLogout} />
            <DeleteAccountRow last />
          </Panel>

          <View style={{ marginTop: 18, alignItems: 'center', gap: 1 }}>
            {link('Условия использования', LINKS.terms)}
            {link('Политика конфиденциальности', LINKS.privacy)}
            <T v="caption" c="ink2" style={{ marginTop: 6, fontSize: 12, lineHeight: 15, fontFamily: MONO }}>СменаБел 1.0.0</T>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
