// Company as workers see it: rating by what matters on a shift, its open
// shifts in the same feed rows, and what other workers wrote.
import React, { useMemo } from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Monogram, StatRow, SectionHeader, LedgerRow, Separator, EmptyState } from '../../design/ui';
import { FeedShiftRow } from '../../design/ShiftRow';
import { useTheme } from '../../design/theme';
import { plural, ago, shiftStart } from '../../design/format';
import ReportMenu from '../../components/ReportMenu';
import useStore from '../../store/useStore';

const CRITERIA = { conditions: 'Условия', descriptionMatch: 'Как в описании', attitude: 'Отношение', paymentSpeed: 'Оплата вовремя' };

export default function PublicCompanyProfileScreen({ route, navigation }) {
  const { companyId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const company = useStore((s) => s.getCompanyById(companyId));
  const shifts = useStore((s) => s.shifts);
  const reviewsAll = useStore((s) => s.reviews);
  const workers = useStore((s) => s.workers);
  const getLocationById = useStore((s) => s.getLocationById);

  const reviews = useMemo(() => reviewsAll.filter((r) => r.targetId === companyId).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviewsAll, companyId]);
  const open = useMemo(() => {
    const now = new Date();
    return shifts.filter((s) => s.companyId === companyId && s.status === 'active' && shiftStart(s) > now).sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));
  }, [shifts, companyId]);
  const cancelled = useMemo(() => shifts.filter((s) => s.companyId === companyId && s.status === 'cancelled').length, [shifts, companyId]);
  const criteria = useMemo(() => {
    const sums = {}; const counts = {};
    reviews.forEach((r) => Object.entries(r.categoryRatings || {}).forEach(([k, v]) => { sums[k] = (sums[k] || 0) + v; counts[k] = (counts[k] || 0) + 1; }));
    return Object.keys(CRITERIA).filter((k) => counts[k]).map((k) => ({ key: k, label: CRITERIA[k], value: sums[k] / counts[k] }));
  }, [reviews]);

  if (!company) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} right={<ReportMenu targetType="user" targetId={companyId} targetName={company.companyName} />} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Monogram name={company.companyName} logo={company.logo} size={56} />
          <View style={{ flex: 1 }}>
            <T v="sheetTitle" accessibilityRole="header">{company.companyName}</T>
            <T v="caption" c="secondary" style={{ marginTop: 2 }}>{[company.businessCategory, company.city].filter(Boolean).join(' · ')}</T>
          </View>
        </View>
        <StatRow
          style={{ marginTop: 22 }}
          items={[
            { label: 'рейтинг', value: company.rating ? company.rating.toFixed(1) : '—' },
            { label: plural(company.reviewsCount || 0, ['отзыв', 'отзыва', 'отзывов']), value: String(company.reviewsCount || 0) },
            { label: plural(company.totalShiftsPublished || 0, ['смена', 'смены', 'смен']), value: String(company.totalShiftsPublished || 0) },
            { label: plural(cancelled, ['отмена', 'отмены', 'отмен']), value: String(cancelled) },
          ]}
        />
        <Separator style={{ marginTop: 20 }} />
        {company.unp ? <LedgerRow label="УНП" value={company.unp} /> : null}
        {company.description ? <LedgerRow label="О компании" value={company.description} valueV="body" /> : null}
        {criteria.map((cr, i) => (
          <LedgerRow
            key={cr.key}
            label={cr.label}
            alignTop={false}
            value={cr.value.toFixed(1)}
            right={<View style={{ flexDirection: 'row', gap: 2 }}>{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star.fill" size={11} c={n <= Math.round(cr.value) ? 'label' : 'tertiary'} />)}</View>}
            last={i === criteria.length - 1}
          />
        ))}

        <SectionHeader title="Открытые смены" right={open.length ? String(open.length) : undefined} />
        {open.length ? open.map((s, i) => (
          <FeedShiftRow key={s.id} shift={s} company={company} location={getLocationById(s.locationId)} last={i === open.length - 1} showRating={false} onPress={() => navigation.push('ShiftDetail', { shiftId: s.id })} />
        )) : <EmptyState title="Сейчас открытых смен нет" text="Новые смены этой компании появятся в ленте." />}

        <SectionHeader title="Отзывы исполнителей" right={reviews.length ? String(reviews.length) : undefined} />
        {reviews.length ? reviews.map((r, i) => {
          const author = workers.find((w) => w.id === r.authorId);
          return (
            <View key={r.id}>
              <View style={{ paddingHorizontal: 22, paddingVertical: 13 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="star.fill" size={11} c="label" />
                  <T v="bodyStrong">{Number(r.overallRating || 0).toFixed(1)}</T>
                  <T v="caption" c="secondary" style={{ flex: 1 }}>· {r.anonymous ? 'Анонимно' : author?.firstName || 'Исполнитель'}</T>
                  <T v="small" c="secondary">{ago(r.createdAt)}</T>
                </View>
                {r.text ? <T v="body" style={{ marginTop: 4 }}>{r.text}</T> : null}
                {r.tags?.length ? <T v="small" c="secondary" style={{ marginTop: 4 }}>{r.tags.join(' · ')}</T> : null}
              </View>
              {i < reviews.length - 1 ? <Separator inset /> : null}
            </View>
          );
        }) : <EmptyState title="Отзывов пока нет" text="Отзывы появляются после смен." />}
        <Separator />
      </ScrollView>
    </View>
  );
}
