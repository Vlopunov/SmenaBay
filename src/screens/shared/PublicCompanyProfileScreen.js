import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { BADGE_INFO } from '../../data/mockData';
import useStore from '../../store/useStore';

const RATING_LABELS = {
  conditions: 'Условия', descriptionMatch: 'Описание',
  attitude: 'Отношение', paymentSpeed: 'Оплата',
};

export default function PublicCompanyProfileScreen({ route, navigation }) {
  const { companyId } = route.params;
  const insets = useSafeAreaInsets();
  const getCompanyById = useStore(s => s.getCompanyById);
  const getReviewsFor = useStore(s => s.getReviewsFor);
  const company = getCompanyById(companyId);
  const reviews = getReviewsFor(companyId);
  const allShifts = useStore(s => s.shifts);
  const shifts = allShifts.filter(sh => sh.companyId === companyId && sh.status === 'active');
  const workers = useStore(s => s.workers);
  const [filterRating, setFilterRating] = useState(null);

  if (!company) return null;

  // Average category ratings
  const workerReviews = reviews.filter(r => r.type === 'worker_about_company');
  const avgCat = {};
  Object.keys(RATING_LABELS).forEach(key => {
    const vals = workerReviews.filter(r => r.categoryRatings[key]).map(r => r.categoryRatings[key]);
    avgCat[key] = vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : '—';
  });

  const filtered = filterRating
    ? workerReviews.filter(r => Math.floor(r.overallRating) === filterRating)
    : workerReviews;

  const monthsOnPlatform = Math.max(1, Math.floor((new Date() - new Date(company.registeredAt)) / (30*24*60*60*1000)));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Профиль компании</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.profileCard}>
          <Image source={{ uri: company.logo || 'https://i.pravatar.cc/200?img=60' }} style={styles.logo} />
          <Text style={styles.name}>{company.companyName}</Text>
          <Text style={styles.category}>{company.businessCategory} · {company.city}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color={COLORS.star} />
            <Text style={styles.ratingValue}>{company.rating.toFixed(1)}</Text>
            <Text style={styles.ratingCount}>({company.reviewsCount} отзывов)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>На платформе {monthsOnPlatform} мес</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{company.totalShiftsPublished} смен</Text>
          </View>
        </View>

        {/* Category Ratings */}
        <View style={styles.catRatings}>
          {Object.entries(RATING_LABELS).map(([key, label]) => (
            <View key={key} style={styles.catRow}>
              <Text style={styles.catLabel}>{label}</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBar, { width: `${(avgCat[key] / 5) * 100}%` }]} />
              </View>
              <Text style={styles.catValue}>{avgCat[key]}</Text>
            </View>
          ))}
        </View>

        {/* Active Shifts */}
        {shifts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Активные смены ({shifts.length})</Text>
            {shifts.slice(0, 3).map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.shiftMini}
                onPress={() => navigation.navigate('ShiftDetail', { shiftId: s.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.shiftMiniTitle}>{s.title}</Text>
                  <Text style={styles.shiftMiniDate}>{s.date}, {s.timeStart}–{s.timeEnd}</Text>
                </View>
                <Text style={styles.shiftMiniPay}>{s.pay} BYN</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Отзывы ({workerReviews.length})</Text>

          {/* Filter */}
          <View style={styles.reviewFilters}>
            <TouchableOpacity
              style={[styles.rFilterChip, !filterRating && styles.rFilterActive]}
              onPress={() => setFilterRating(null)}
            >
              <Text style={[styles.rFilterText, !filterRating && styles.rFilterTextActive]}>Все</Text>
            </TouchableOpacity>
            {[5,4,3].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.rFilterChip, filterRating === r && styles.rFilterActive]}
                onPress={() => setFilterRating(filterRating === r ? null : r)}
              >
                <Ionicons name="star" size={12} color={filterRating === r ? COLORS.white : COLORS.star} />
                <Text style={[styles.rFilterText, filterRating === r && styles.rFilterTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.map(r => {
            const author = workers.find(w => w.id === r.authorId);
            return (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>
                    {r.anonymous ? 'Исполнитель' : (author ? `${author.firstName} ${author.lastName[0]}.` : '—')}
                  </Text>
                  <View style={styles.reviewStars}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= r.overallRating ? 'star' : 'star-outline'} size={14} color={COLORS.star} />
                    ))}
                  </View>
                </View>
                {r.text && <Text style={styles.reviewText}>{r.text}</Text>}
                <Text style={styles.reviewDate}>{r.createdAt}</Text>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <Text style={styles.noReviews}>Нет отзывов с такой оценкой</Text>
          )}
        </View>

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
  scroll: { paddingHorizontal: SIZES.lg },

  profileCard: { alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: SIZES.xl, ...SHADOWS.md },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: COLORS.skeleton },
  name: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, marginTop: SIZES.md, textAlign: 'center' },
  category: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs, marginTop: SIZES.md },
  ratingValue: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  ratingCount: { fontSize: SIZES.body, color: COLORS.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginTop: SIZES.sm },
  metaText: { fontSize: SIZES.small, color: COLORS.textTertiary },
  metaDot: { color: COLORS.textTertiary },

  catRatings: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base, marginTop: SIZES.md, ...SHADOWS.sm, gap: SIZES.md },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  catLabel: { fontSize: SIZES.small, color: COLORS.textSecondary, width: 80 },
  catBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.surface },
  catBar: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  catValue: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textPrimary, width: 28, textAlign: 'right' },

  section: { marginTop: SIZES.xl },
  sectionTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary, marginBottom: SIZES.md },

  shiftMini: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  shiftMiniTitle: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  shiftMiniDate: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 2 },
  shiftMiniPay: { fontSize: SIZES.bodyLarge, ...FONTS.bold, color: COLORS.success },

  reviewFilters: { flexDirection: 'row', gap: SIZES.sm, marginBottom: SIZES.md },
  rFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  rFilterActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  rFilterText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  rFilterTextActive: { color: COLORS.white },

  reviewCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: SIZES.sm, lineHeight: 20 },
  reviewDate: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: SIZES.sm },
  noReviews: { fontSize: SIZES.body, color: COLORS.textTertiary, textAlign: 'center', paddingVertical: SIZES.xl },
});
