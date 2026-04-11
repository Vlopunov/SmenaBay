import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const PLAN_LABELS = { free: 'Старт (бесплатно)', business: 'Бизнес', premium: 'Премиум' };

const MENU = [
  { icon: 'business-outline', label: 'Данные компании', screen: 'Settings' },
  { icon: 'location-outline', label: 'Управление локациями', screen: 'Locations' },
  { icon: 'card-outline', label: 'Тарифы и подписка', screen: 'Plans' },
  { icon: 'people-outline', label: 'Избранные исполнители', screen: 'Favorites' },
  { icon: 'notifications-outline', label: 'Уведомления', screen: 'Notifications' },
  { icon: 'star-outline', label: 'Отзывы о компании', screen: 'CompanyReviews' },
  { icon: 'help-circle-outline', label: 'Помощь', screen: null },
];

export default function EmployerProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const getReviewsFor = useStore(s => s.getReviewsFor);
  const reviews = getReviewsFor(currentUser?.id);

  if (!currentUser) return null;
  const monthsOnPlatform = Math.max(1, Math.floor((new Date() - new Date(currentUser.registeredAt)) / (30*24*60*60*1000)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Company Card */}
        <View style={styles.profileCard}>
          <Image source={{ uri: currentUser.logo || 'https://i.pravatar.cc/200?img=60' }} style={styles.logo} />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{currentUser.companyName}</Text>
            <Text style={styles.category}>{currentUser.businessCategory}</Text>
            <View style={styles.planBadge}>
              <Ionicons name={currentUser.plan === 'premium' ? 'diamond' : currentUser.plan === 'business' ? 'briefcase' : 'leaf'} size={14} color={COLORS.accent} />
              <Text style={styles.planText}>{PLAN_LABELS[currentUser.plan]}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser.rating > 0 ? currentUser.rating.toFixed(1) : '—'}</Text>
            <Text style={styles.statLabel}>Рейтинг</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{currentUser.totalShiftsPublished}</Text>
            <Text style={styles.statLabel}>Смен</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{monthsOnPlatform}</Text>
            <Text style={styles.statLabel}>Мес.</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
              onPress={() => {
                if (item.screen === 'CompanyReviews') {
                  navigation.navigate('PublicCompanyProfile', { companyId: currentUser.id });
                } else if (item.screen) {
                  navigation.navigate(item.screen);
                }
              }}
              activeOpacity={0.6}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconWrap}>
                  <Ionicons name={item.icon} size={20} color={COLORS.textSecondary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <Text style={styles.version}>СменаБай v1.0.0</Text>
        <View style={{ height: SIZES.tabBarHeight + SIZES['2xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  headerTitle: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  scroll: { paddingHorizontal: SIZES.lg },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: SIZES.lg, ...SHADOWS.md },
  logo: { width: 64, height: 64, borderRadius: 18, backgroundColor: COLORS.skeleton },
  profileInfo: { flex: 1, marginLeft: SIZES.md },
  name: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  category: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.sm },
  planText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },
  statsRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.lg, marginTop: SIZES.md, ...SHADOWS.sm },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.borderLight },
  menuCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, ...SHADOWS.sm, marginTop: SIZES.xl, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SIZES.md, paddingHorizontal: SIZES.base },
  menuBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: SIZES.md },
  menuIconWrap: { width: 32, height: 32, borderRadius: SIZES.radiusSm, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: SIZES.bodyLarge, color: COLORS.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm, marginTop: SIZES['2xl'], padding: SIZES.md },
  logoutText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.error },
  version: { fontSize: SIZES.caption, color: COLORS.textTertiary, textAlign: 'center', marginTop: SIZES.md },
});
