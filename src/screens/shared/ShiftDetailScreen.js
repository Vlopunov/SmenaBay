import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function ShiftDetailScreen({ route, navigation }) {
  const { shiftId } = route.params;
  const insets = useSafeAreaInsets();

  const getShiftById = useStore(s => s.getShiftById);
  const getCompanyById = useStore(s => s.getCompanyById);
  const getLocationById = useStore(s => s.getLocationById);
  const getApplicationForShiftAndWorker = useStore(s => s.getApplicationForShiftAndWorker);
  const getReviewsFor = useStore(s => s.getReviewsFor);
  const shift = getShiftById(shiftId);
  const company = getCompanyById(shift?.companyId);
  const location = getLocationById(shift?.locationId);
  const currentUser = useStore(s => s.currentUser);
  const applyToShift = useStore(s => s.applyToShift);
  const applications = useStore(s => s.applications); // subscribe to trigger re-render
  const shifts = useStore(s => s.shifts); // subscribe for spotsTaken updates
  const existingApp = getApplicationForShiftAndWorker(shiftId);
  const companyReviews = getReviewsFor(shift?.companyId).slice(0, 3);
  const workers = useStore(s => s.workers);

  if (!shift || !company) return null;

  const today = new Date().toISOString().split('T')[0];
  const formatDate = (d) => {
    if (d === today) return 'Сегодня';
    const date = new Date(d);
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const isFilled = shift.spotsTaken >= shift.spotsTotal;
  const isWorker = currentUser?.role === 'worker';
  const canApply = isWorker && !existingApp && !isFilled && shift.status === 'active';
  const hasApplied = !!existingApp;

  const handleApply = () => {
    applyToShift(shiftId);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Детали смены</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Urgent badge */}
        {shift.urgent && (
          <View style={styles.urgentBadge}>
            <Ionicons name="flash" size={14} color={COLORS.white} />
            <Text style={styles.urgentText}>Срочная смена</Text>
          </View>
        )}

        {/* Title & Pay */}
        <Text style={styles.title}>{shift.title}</Text>
        <View style={styles.payRow}>
          <Text style={styles.payAmount}>{shift.pay} BYN</Text>
          <Text style={styles.payHour}>~{shift.payPerHour.toFixed(0)} BYN/ч</Text>
        </View>

        {/* Company */}
        <TouchableOpacity
          style={styles.companyCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('PublicCompanyProfile', { companyId: company.id })}
        >
          <Image source={{ uri: company.logo || 'https://i.pravatar.cc/200?img=60' }} style={styles.companyLogo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.companyName}</Text>
            <View style={styles.companyMeta}>
              <Ionicons name="star" size={14} color={COLORS.star} />
              <Text style={styles.companyRating}>{company.rating.toFixed(1)}</Text>
              <Text style={styles.companyReviews}>({company.reviewsCount} отзывов)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
            <View>
              <Text style={styles.detailLabel}>Дата</Text>
              <Text style={styles.detailValue}>{formatDate(shift.date)}</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={20} color={COLORS.accent} />
            <View>
              <Text style={styles.detailLabel}>Время</Text>
              <Text style={styles.detailValue}>{shift.timeStart} – {shift.timeEnd} ({shift.durationHours}ч)</Text>
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color={COLORS.accent} />
            <View>
              <Text style={styles.detailLabel}>Адрес</Text>
              <Text style={styles.detailValue}>{location?.address || '—'}</Text>
              {location?.name && <Text style={styles.detailSub}>{location.name}</Text>}
            </View>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={20} color={COLORS.accent} />
            <View>
              <Text style={styles.detailLabel}>Мест</Text>
              <Text style={styles.detailValue}>{shift.spotsTaken} / {shift.spotsTotal} занято</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Описание</Text>
          <Text style={styles.description}>{shift.description}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Требования</Text>
          <View style={styles.reqList}>
            <ReqItem label="Без опыта" value={shift.requirements.noExperienceOk} />
            <ReqItem label="Медицинская книжка" value={shift.requirements.medicalBookRequired} required />
            <ReqItem label="Свой смартфон" value={shift.requirements.smartphoneRequired} required />
            <ReqItem label="Своя спецодежда" value={shift.requirements.ownClothes} required />
            {shift.requirements.minAge && (
              <View style={styles.reqItem}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.reqText}>Возраст от {shift.requirements.minAge} лет</Text>
              </View>
            )}
          </View>
          {shift.requirements.other && (
            <Text style={styles.reqOther}>{shift.requirements.other}</Text>
          )}
        </View>

        {/* Reviews */}
        {companyReviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Отзывы о компании</Text>
            {companyReviews.map(r => {
              const author = workers.find(w => w.id === r.authorId);
              return (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>
                      {r.anonymous ? 'Исполнитель' : (author ? `${author.firstName} ${author.lastName[0]}.` : 'Анонимно')}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name={s <= r.overallRating ? 'star' : 'star-outline'} size={14} color={COLORS.star} />
                      ))}
                    </View>
                  </View>
                  {r.text && <Text style={styles.reviewText}>{r.text}</Text>}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {isWorker && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SIZES.md }]}>
          {canApply ? (
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.7}>
              <Text style={styles.applyBtnText}>Откликнуться</Text>
            </TouchableOpacity>
          ) : hasApplied ? (
            <View style={styles.appliedBtn}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
              <Text style={styles.appliedBtnText}>
                {existingApp.status === 'pending' ? 'Отклик отправлен' :
                 existingApp.status === 'approved' ? 'Вы подтверждены' : 'Отклик отправлен'}
              </Text>
            </View>
          ) : isFilled ? (
            <View style={styles.filledBtn}>
              <Text style={styles.filledBtnText}>Смена заполнена</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function ReqItem({ label, value, required }) {
  if (!required && !value) return null;
  return (
    <View style={reqStyles.item}>
      <Ionicons
        name={value ? (required ? 'alert-circle' : 'checkmark-circle') : 'close-circle-outline'}
        size={18}
        color={value ? (required ? '#D97706' : COLORS.success) : COLORS.textTertiary}
      />
      <Text style={reqStyles.text}>{label}</Text>
    </View>
  );
}

const reqStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, paddingVertical: 4 },
  text: { fontSize: SIZES.body, color: COLORS.textPrimary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.lg },

  urgentBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
    backgroundColor: COLORS.error, paddingHorizontal: SIZES.md, paddingVertical: 6,
    borderRadius: SIZES.radiusSm, marginBottom: SIZES.md,
  },
  urgentText: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.white },

  title: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.3 },
  payRow: { flexDirection: 'row', alignItems: 'baseline', gap: SIZES.sm, marginTop: SIZES.sm },
  payAmount: { fontSize: 28, ...FONTS.bold, color: COLORS.success },
  payHour: { fontSize: SIZES.body, color: COLORS.textSecondary },

  companyCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg, padding: SIZES.base, marginTop: SIZES.lg, ...SHADOWS.sm,
  },
  companyLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.skeleton },
  companyInfo: { flex: 1, marginLeft: SIZES.md },
  companyName: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  companyMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  companyRating: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textPrimary },
  companyReviews: { fontSize: SIZES.small, color: COLORS.textSecondary },

  detailsCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: SIZES.base,
    marginTop: SIZES.md, ...SHADOWS.sm, gap: SIZES.base,
  },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.md },
  detailLabel: { fontSize: SIZES.caption, color: COLORS.textTertiary },
  detailValue: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary, marginTop: 1 },
  detailSub: { fontSize: SIZES.caption, color: COLORS.textSecondary, marginTop: 1 },

  section: { marginTop: SIZES.xl },
  sectionTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary, marginBottom: SIZES.md },
  description: { fontSize: SIZES.body, color: COLORS.textSecondary, lineHeight: 22 },
  reqList: { gap: 2 },
  reqOther: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.sm, fontStyle: 'italic' },

  reviewCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.md, marginBottom: SIZES.sm, ...SHADOWS.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewText: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: SIZES.sm, lineHeight: 20 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, paddingHorizontal: SIZES.lg, paddingTop: SIZES.md,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, ...SHADOWS.lg,
  },
  applyBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center',
  },
  applyBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
  appliedBtn: {
    flexDirection: 'row', gap: SIZES.sm, backgroundColor: COLORS.accentSoft,
    borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight, justifyContent: 'center', alignItems: 'center',
  },
  appliedBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.accent },
  filledBtn: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center',
  },
  filledBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.textTertiary },
});
