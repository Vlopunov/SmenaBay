// «Тариф и лимиты» — screen 30. Answers one question: how many shifts are
// left this month and when the limit resets. On iOS this is information
// only — no prices, no purchase or switch control, and no pointer to paying
// elsewhere: selling a digital subscription in-app would require In-App
// Purchase (Guideline 3.1.1). During the free launch Android shows the same:
// there is nothing to buy, and the server ignores a plan sent by a client.
import React, { useMemo } from 'react';
import { View, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Button, SectionTitle } from '../../design/ui';
import { SkyView } from '../../design/Sky';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { plural, longDate } from '../../design/format';
import { PLAN_NAMES, PLAN_LIMITS } from './employerData';
import useStore from '../../store/useStore';

const PURCHASABLE_IN_APP = false;
const MONO = Platform.select({ ios: 'ui-monospace', default: 'monospace' });
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

const PLANS = [
  { id: 'free', price: 0, features: ['Отклики и чат', 'Каталог исполнителей'] },
  { id: 'business', price: 49, features: ['Отклики и чат', 'Каталог исполнителей', 'Приоритетная поддержка'] },
  { id: 'premium', price: 99, features: ['Отклики и чат', 'Каталог исполнителей', 'Приоритетная поддержка', 'Персональный менеджер'] },
];

const limitLine = (limit) => (Number.isFinite(limit) ? `${limit} ${plural(limit, ['смена', 'смены', 'смен'])} в месяц` : 'Смены без ограничений');

function CardBox({ children, style }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.c.surface, borderRadius: 18, padding: 14 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }, style]}>{children}</View>;
}

export default function PlansScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const changePlan = useStore((s) => s.changePlan);
  const current = me?.plan || 'free';
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  // Counted exactly as createShift counts it against the limit.
  const used = shifts.filter((s) => s.companyId === me?.id && s.createdAt >= monthStart && s.status !== 'cancelled').length;
  const limit = PLAN_LIMITS[current] ?? PLAN_LIMITS.free;
  const limited = Number.isFinite(limit);
  const resets = longDate(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const plan = PLANS.find((p) => p.id === current) || PLANS[0];
  const s = t.sky('day');

  // Shifts published per month, the last six months (cancelled ones do not
  // count, as with the limit).
  const history = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTHS_SHORT[d.getMonth()], count: 0 });
    }
    shifts.forEach((x) => {
      if (x.companyId !== me?.id || x.status === 'cancelled' || !x.createdAt) return;
      const m = months.find((mm) => mm.key === String(x.createdAt).slice(0, 7));
      if (m) m.count += 1;
    });
    return months;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shifts, me?.id, now.getMonth()]);
  const peak = Math.max(1, ...history.map((m) => m.count));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: g, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} iconSize={20} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontSize: 17, lineHeight: 21 }}>Тариф и лимиты</T>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: g, paddingBottom: insets.bottom + 30 }}>
        <View style={[{ marginTop: 14, borderRadius: 22 }, t.sh.e2]}>
          <SkyView sky={s} radius={22} style={{ paddingTop: 16, paddingHorizontal: 18, paddingBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <T v="badge" c={s.ink2} style={{ fontSize: 12, lineHeight: 15, letterSpacing: 0.24 }}>ТЕКУЩИЙ ТАРИФ</T>
              <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8, backgroundColor: c.urgentTint }}>
                <T v="badge" c={s.ink} style={{ fontSize: 11.5, lineHeight: 14, letterSpacing: 0 }}>активен</T>
              </View>
            </View>
            <T v="titleScreen" c={s.ink} style={{ marginTop: 9, fontSize: 26, lineHeight: 30, letterSpacing: -0.52 }} accessibilityRole="header">{PLAN_NAMES[current] || PLAN_NAMES.free}</T>
            <T v="caption" c={s.ink2} weight="600" style={{ marginTop: 14, fontSize: 12.5, lineHeight: 15 }}>Смен в этом месяце</T>
            <View
              accessible
              accessibilityLabel={limited ? `Опубликовано ${used} из ${limit}` : `Опубликовано ${used}, без ограничений`}
              style={{ marginTop: 6, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}
            >
              <T v="moneyCard" c={s.ink} style={{ fontSize: 34, lineHeight: 38, letterSpacing: -0.34 }}>{used}</T>
              <T v="moneyInline" display weight="600" c={s.ink2} style={{ fontSize: 16, lineHeight: 19 }}>{limited ? `из ${limit}` : 'без ограничений'}</T>
            </View>
            {limited ? (
              <>
                <View style={{ marginTop: 11, height: 8, borderRadius: 4, backgroundColor: c.urgentTint, overflow: 'hidden' }}>
                  <View style={{ width: `${Math.min(100, Math.round((used / limit) * 100))}%`, height: 8, borderRadius: 4, backgroundColor: s.ink }} />
                </View>
                <T v="caption" c={s.ink2} weight="500" style={{ marginTop: 7, fontSize: 12.5, lineHeight: 15 }}>
                  {used >= limit ? `Лимит исчерпан · обновится ${resets}` : `Лимит обновится ${resets}`}
                </T>
              </>
            ) : null}
          </SkyView>
        </View>

        <CardBox style={{ marginTop: 14 }}>
          <T v="titleSection" style={{ fontSize: 15, lineHeight: 18 }} accessibilityRole="header">Что входит</T>
          <View style={{ marginTop: 11, gap: 9 }}>
            {[limitLine(limit), ...plan.features].map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="checkmark" size={16} c="success" weight="bold" />
                <T v="body" c="ink3" style={{ flex: 1, fontSize: 14.5, lineHeight: 19.5 }}>{f}</T>
              </View>
            ))}
          </View>
        </CardBox>

        <CardBox style={{ marginTop: 14 }}>
          <T v="titleSection" style={{ fontSize: 15, lineHeight: 18 }} accessibilityRole="header">История месяца</T>
          <View
            accessible
            accessibilityLabel={`Смен по месяцам: ${history.map((m) => `${m.label} — ${m.count}`).join(', ')}`}
            style={{ marginTop: 12, height: 64, flexDirection: 'row', alignItems: 'flex-end', gap: 5 }}
          >
            {history.map((m, i) => (
              <View
                key={m.key}
                style={{
                  flex: 1, height: `${Math.max(5, Math.round((m.count / peak) * 100))}%`, borderTopLeftRadius: 3, borderTopRightRadius: 3,
                  backgroundColor: i === history.length - 1 ? c.brand : c.surface3,
                }}
              />
            ))}
          </View>
          <View style={{ marginTop: 7, flexDirection: 'row', gap: 5 }}>
            {history.map((m) => (
              <T key={m.key} v="caption" c="ink2" style={{ flex: 1, textAlign: 'center', fontSize: 11, lineHeight: 13, fontFamily: MONO }}>{m.label}</T>
            ))}
          </View>
        </CardBox>

        {PURCHASABLE_IN_APP ? (
          <>
            <SectionTitle title="Другие тарифы" size={17} style={{ marginTop: 20 }} />
            <View style={{ marginTop: 9, gap: 9 }}>
              {PLANS.filter((p) => p.id !== current).map((p) => (
                <CardBox key={p.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <T v="rowTitle" style={{ flex: 1, fontSize: 16 }}>{PLAN_NAMES[p.id]}</T>
                    <T v="moneyInline">{p.price ? `${p.price} BYN/мес` : 'Бесплатно'}</T>
                  </View>
                  <T v="caption" c="ink2" style={{ marginTop: 3 }}>{[limitLine(PLAN_LIMITS[p.id]), ...p.features].join(' · ')}</T>
                  <Button title="Выбрать" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 12 }} onPress={() => { haptic.success(); changePlan(p.id); }} />
                </CardBox>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
