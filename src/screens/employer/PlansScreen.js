// Tariff. On iOS this is information only — no prices, no purchase control:
// selling a digital subscription in-app would require In-App Purchase
// (Guideline 3.1.1), and employer billing is handled off the app. Android
// keeps the selector.
import React from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Separator, StatusPill, Button } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { plural, monthName } from '../../design/format';
import { PLAN_NAMES, PLAN_LIMITS } from './employerData';
import useStore from '../../store/useStore';

const PURCHASABLE_IN_APP = Platform.OS !== 'ios';

const PLANS = [
  { id: 'free', price: 0, features: ['Отклики и чат', 'Каталог исполнителей'] },
  { id: 'business', price: 49, features: ['Отклики и чат', 'Каталог исполнителей', 'Приоритетная поддержка'] },
  { id: 'premium', price: 99, features: ['Отклики и чат', 'Каталог исполнителей', 'Приоритетная поддержка', 'Персональный менеджер'] },
];

export default function PlansScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const changePlan = useStore((s) => s.changePlan);
  const current = me?.plan || 'free';
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const used = shifts.filter((s) => s.companyId === me?.id && s.createdAt >= monthStart && s.status !== 'cancelled').length;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 }}>
          <T v="title" accessibilityRole="header">{PURCHASABLE_IN_APP ? 'Тариф' : 'Твой тариф'}</T>
          <T v="caption" c="secondary" style={{ marginTop: 2 }}>
            {`За ${monthName()} опубликовано ${used}${Number.isFinite(PLAN_LIMITS[current]) ? ` из ${PLAN_LIMITS[current]}` : ''} ${plural(used, ['смена', 'смены', 'смен'])}`}
          </T>
        </View>
        <Separator />
        {PLANS.map((p, i) => {
          const on = p.id === current;
          const limit = PLAN_LIMITS[p.id];
          return (
            <View key={p.id}>
              <View style={{ paddingHorizontal: 22, paddingVertical: 16, backgroundColor: on ? c.fill : 'transparent' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <T v="rowTitle" style={{ flex: 1 }}>{PLAN_NAMES[p.id]}</T>
                  {on ? <StatusPill status="confirmed" label="Текущий" /> : PURCHASABLE_IN_APP && p.price ? <T v="bodyStrong">{p.price} BYN/мес</T> : null}
                </View>
                <T v="value" style={{ marginTop: 4 }}>{Number.isFinite(limit) ? `До ${limit} ${plural(limit, ['смены', 'смен', 'смен'])} в месяц` : 'Без ограничений по сменам'}</T>
                <View style={{ marginTop: 8, gap: 4 }}>
                  {p.features.map((f) => (
                    <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="checkmark" size={12} c="secondary" weight="semibold" />
                      <T v="caption" c="secondary">{f}</T>
                    </View>
                  ))}
                </View>
                {PURCHASABLE_IN_APP && !on ? (
                  <Button title="Выбрать" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: 12 }} onPress={() => { haptic.success(); changePlan(p.id); }} />
                ) : null}
              </View>
              {i < PLANS.length - 1 ? <Separator inset={!on} /> : null}
            </View>
          );
        })}
        <Separator />
      </ScrollView>
    </View>
  );
}
