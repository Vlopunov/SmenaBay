import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { BADGE_INFO } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function PublicWorkerProfileScreen({ route, navigation }) {
  const { workerId } = route.params;
  const insets = useSafeAreaInsets();
  const getWorkerById = useStore(s => s.getWorkerById);
  const getReviewsFor = useStore(s => s.getReviewsFor);
  const isFavoriteFn = useStore(s => s.isFavorite);
  const worker = getWorkerById(workerId);
  const reviews = getReviewsFor(workerId);
  const companies = useStore(s => s.companies);
  const currentUser = useStore(s => s.currentUser);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const isFavorite = isFavoriteFn(workerId);

  if (!worker) return null;
  const isEmployer = currentUser?.role === 'employer';
  const companyReviews = reviews.filter(r => r.type === 'company_about_worker');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Профиль</Text>
        {isEmployer && (
          <TouchableOpacity style={styles.favBtn} onPress={() => toggleFavorite(workerId)}>
            <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? COLORS.error : COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        {!isEmployer && <View style={{ width: 44 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <Image source={{ uri: worker.avatar || 'https://i.pravatar.cc/200' }} style={styles.avatar} />
          <Text style={styles.name}>{worker.firstName} {worker.lastName}</Text>
          <Text style={styles.city}>{worker.city} · На платформе с {new Date(worker.registeredAt).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{worker.rating > 0 ? worker.rating.toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>Рейтинг</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{worker.shiftsCompleted}</Text>
              <Text style={styles.statLabel}>Смен</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        {worker.badges.length > 0 && (
          <View style={styles.badgesRow}>
            {worker.badges.map(b => {
              const info = BADGE_INFO[b];
              if (!info) return null;
              return (
                <View key={b} style={[styles.badge, { backgroundColor: info.color + '14' }]}>
                  <Ionicons name={info.icon} size={14} color={info.color} />
                  <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Categories */}
        <View style={styles.categoriesRow}>
          {worker.categories.map(c => (
            <View key={c} style={styles.catChip}>
              <Text style={styles.catText}>{c}</Text>
            </View>
          ))}
        </View>

        {/* Reviews */}
        <Text style={styles.sectionTitle}>Отзывы ({companyReviews.length})</Text>
        {companyReviews.map(r => {
          const company = companies.find(c => c.id === r.authorId);
          return (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{company?.companyName || '—'}</Text>
                <View style={styles.reviewStars}>
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name={s <= r.overallRating ? 'star' : 'star-outline'} size={14} color={COLORS.star} />
                  ))}
                </View>
              </View>
              {r.text && <Text style={styles.reviewText}>{r.text}</Text>}
              {r.recommendAgain !== null && (
                <View style={[styles.recBadge, { backgroundColor: r.recommendAgain ? '#D1FAE5' : '#FEE2E2' }]}>
                  <Ionicons name={r.recommendAgain ? 'thumbs-up' : 'thumbs-down'} size={12} color={r.recommendAgain ? '#059669' : '#EF4444'} />
                  <Text style={[styles.recText, { color: r.recommendAgain ? '#059669' : '#EF4444' }]}>
                    {r.recommendAgain ? 'Рекомендует' : 'Не рекомендует'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {companyReviews.length === 0 && (
          <Text style={styles.noReviews}>Пока нет отзывов</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  favBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: SIZES.lg },
  profileCard: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: SIZES.xl, ...SHADOWS.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.skeleton },
  name: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, marginTop: SIZES.md },
  city: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.lg, gap: SIZES.xl },
  stat: { alignItems: 'center' },
  statValue: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  statLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.borderLight },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.lg },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull },
  badgeText: { fontSize: SIZES.small, ...FONTS.medium },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.sm, marginTop: SIZES.md },
  catChip: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  catText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textPrimary },
  sectionTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.xl, marginBottom: SIZES.md },
  reviewCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: SIZES.sm, lineHeight: 20 },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: SIZES.sm, paddingVertical: 3, borderRadius: SIZES.radiusSm, marginTop: SIZES.sm },
  recText: { fontSize: 11, ...FONTS.medium },
  noReviews: { fontSize: SIZES.body, color: COLORS.textTertiary, textAlign: 'center', paddingVertical: SIZES.xl },
});
