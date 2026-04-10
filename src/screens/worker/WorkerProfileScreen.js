import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { BADGE_INFO } from '../../data/mockData';
import useStore from '../../store/useStore';

const STATS_CONFIG = [
  { key: 'shiftsCompleted', label: 'Смен' },
  { key: 'rating', label: 'Рейтинг' },
  { key: 'totalEarned', label: 'Заработано' },
];

const MENU = [
  { icon: 'person-outline', label: 'Личные данные', screen: 'Settings' },
  { icon: 'card-outline', label: 'Платёжные реквизиты', screen: 'Settings' },
  { icon: 'document-text-outline', label: 'Документы', screen: 'Settings' },
  { icon: 'notifications-outline', label: 'Уведомления', screen: 'Notifications' },
  { icon: 'star-outline', label: 'Отзывы обо мне', screen: 'MyReviews' },
  { icon: 'help-circle-outline', label: 'Помощь', screen: null },
  { icon: 'information-circle-outline', label: 'О приложении', screen: null },
];

export default function WorkerProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const getReviewsFor = useStore(s => s.getReviewsFor);
  const reviews = getReviewsFor(currentUser?.id);

  if (!currentUser) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профиль</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <Image
              source={{ uri: currentUser.avatar || 'https://i.pravatar.cc/200?img=0' }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{currentUser.firstName} {currentUser.lastName}</Text>
              <Text style={styles.phone}>{currentUser.phone}</Text>
              <View style={styles.cityRow}>
                <Ionicons name="location" size={13} color={COLORS.accent} />
                <Text style={styles.cityText}>{currentUser.city}</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS_CONFIG.map((stat, i) => {
              let value = currentUser[stat.key];
              if (stat.key === 'totalEarned') value = `${value} ₽`;
              if (stat.key === 'rating') value = value > 0 ? value.toFixed(1) : '—';
              return (
                <View key={stat.key} style={styles.statItem}>
                  <Text style={styles.statValue}>{value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  {i < STATS_CONFIG.length - 1 && <View style={styles.statDivider} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Badges */}
        {currentUser.badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>Бейджи</Text>
            <View style={styles.badgesRow}>
              {currentUser.badges.map(badge => {
                const info = BADGE_INFO[badge];
                if (!info) return null;
                return (
                  <View key={badge} style={[styles.badge, { backgroundColor: info.color + '14' }]}>
                    <Ionicons name={info.icon} size={16} color={info.color} />
                    <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Категории</Text>
          <View style={styles.categoriesRow}>
            {currentUser.categories.map(cat => (
              <View key={cat} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{cat}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
              onPress={() => {
                if (item.screen === 'MyReviews') {
                  navigation.navigate('PublicWorkerProfile', { workerId: currentUser.id });
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

        {/* Logout */}
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md,
  },
  headerTitle: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  settingsBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.sm,
  },
  scroll: { paddingHorizontal: SIZES.lg },
  profileCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: SIZES.lg, ...SHADOWS.md },
  profileTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.skeleton },
  profileInfo: { marginLeft: SIZES.base, flex: 1 },
  name: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.3 },
  phone: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: 2 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SIZES.xs },
  cityText: { fontSize: SIZES.small, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', marginTop: SIZES.lg, paddingTop: SIZES.lg, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  statItem: { flex: 1, alignItems: 'center', position: 'relative' },
  statValue: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { position: 'absolute', right: 0, top: 4, bottom: 4, width: 1, backgroundColor: COLORS.borderLight },
  badgesSection: { marginTop: SIZES.xl },
  sectionTitle: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SIZES.sm },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: SIZES.small, ...FONTS.medium },
  categoriesSection: { marginTop: SIZES.xl },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm },
  categoryChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  categoryText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textPrimary },
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
