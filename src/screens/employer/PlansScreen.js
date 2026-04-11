import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const PLANS = [
  {
    id: 'free',
    name: 'Бесплатный',
    price: 0,
    priceLabel: '0 BYN/мес',
    icon: 'leaf',
    features: [
      'До 3 смен в месяц',
      'Базовый поиск исполнителей',
      'Публикация вакансий',
      'Отклики и чат',
    ],
  },
  {
    id: 'business',
    name: 'Бизнес',
    price: 49,
    priceLabel: '49 BYN/мес',
    icon: 'briefcase',
    popular: true,
    features: [
      'До 15 смен в месяц',
      'Приоритетная поддержка',
      'Аналитика и статистика',
      'Приоритет в поиске',
      'Отклики и чат',
    ],
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: 99,
    priceLabel: '99 BYN/мес',
    icon: 'diamond',
    features: [
      'Безлимитные смены',
      'Персональный менеджер',
      'Расширенная аналитика',
      'Приоритет в поиске',
      'Все функции платформы',
      'Приоритетная поддержка',
    ],
  },
];

export default function PlansScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const changePlan = useStore(s => s.changePlan);

  const currentPlan = currentUser?.plan || 'free';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Тарифы и подписка</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.subtitle}>
          Выберите подходящий тариф для вашего бизнеса
        </Text>

        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;

          return (
            <View
              key={plan.id}
              style={[
                styles.card,
                isCurrent && styles.cardCurrent,
                plan.popular && !isCurrent && styles.cardPopular,
              ]}
            >
              {/* Popular badge */}
              {plan.popular && !isCurrent && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Популярный</Text>
                </View>
              )}

              {/* Current badge */}
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={styles.currentBadgeText}>Текущий</Text>
                </View>
              )}

              {/* Plan header */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, isCurrent && styles.iconWrapCurrent]}>
                  <Ionicons
                    name={plan.icon}
                    size={22}
                    color={isCurrent ? COLORS.white : COLORS.accent}
                  />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                </View>
              </View>

              {/* Features */}
              <View style={styles.featuresList}>
                {plan.features.map((feature) => (
                  <View key={feature} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={COLORS.success}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Action button */}
              {isCurrent ? (
                <View style={styles.currentBtn}>
                  <Text style={styles.currentBtnText}>Текущий тариф</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => changePlan(plan.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectBtnText}>Выбрать</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <View style={{ height: SIZES.tabBarHeight + SIZES['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: SIZES.title,
    ...FONTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  scroll: {
    paddingHorizontal: SIZES.lg,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.xl,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusXl,
    padding: SIZES.lg,
    marginBottom: SIZES.base,
    ...SHADOWS.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardCurrent: {
    borderColor: COLORS.accent,
  },
  cardPopular: {
    borderColor: COLORS.accentLight,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    marginBottom: SIZES.md,
  },
  popularBadgeText: {
    fontSize: SIZES.caption,
    ...FONTS.semibold,
    color: COLORS.accent,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.accentSoft,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusFull,
    gap: 4,
    marginBottom: SIZES.md,
  },
  currentBadgeText: {
    fontSize: SIZES.caption,
    ...FONTS.semibold,
    color: COLORS.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapCurrent: {
    backgroundColor: COLORS.accent,
  },
  cardHeaderText: {
    marginLeft: SIZES.md,
  },
  planName: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.bold,
    color: COLORS.textPrimary,
  },
  planPrice: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featuresList: {
    marginBottom: SIZES.base,
    gap: SIZES.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  featureText: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBtnText: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.semibold,
    color: COLORS.textInverse,
  },
  currentBtn: {
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBtnText: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.medium,
    color: COLORS.textTertiary,
  },
});
