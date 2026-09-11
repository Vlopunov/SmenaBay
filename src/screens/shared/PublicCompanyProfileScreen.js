// Company as workers see it (screen 20). Criteria answer the real fears
// of a worker — do they pay on time, is the description honest — and come
// from the averages of real reviews, nothing invented. The УНП is shown as
// the company entered it: nobody checks it against the register, so it is
// not labelled «проверен». Reviews about a company are anonymous.
import React, { useMemo } from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import { CircleButton, Press } from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { SkyBand, seatsWord } from '../../design/ShiftCard';
import { StatusBadge } from '../../design/Status';
import { CompanyMono } from '../../design/Monogram';
import { categoryFromBusiness, CATEGORY_LABEL } from '../../design/category';
import { useTheme } from '../../design/theme';
import { plural, shiftStart, dayLabel, timeRange, longDate } from '../../design/format';
import { openReportMenu } from '../../components/ReportMenu';
import useStore from '../../store/useStore';

// Review keys (RateShift) → what a worker reads. Only criteria people rate.
const CRITERIA = [
  ['paymentSpeed', 'Платят вовремя'],
  ['descriptionMatch', 'Описание честное'],
  ['conditions', 'Условия'],
  ['attitude', 'Отношение'],
];

// The header of this page is a day sky, as in the mockup.
const HEADER_SKY = 'day';

/** A raised surface whose content is clipped to the corners (shadow kept outside). */
function Surface({ children, radius = 18, style, onPress, accessibilityLabel }) {
  const t = useTheme();
  const outer = [{ borderRadius: radius, backgroundColor: t.c.surface }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }, style];
  const inner = <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>;
  return onPress
    ? <Press onPress={onPress} scaleTo={0.975} style={outer} accessibilityLabel={accessibilityLabel}>{inner}</Press>
    : <View style={outer}>{inner}</View>;
}

function Stat({ value, label, flex = 1, valueC = 'ink', small }) {
  const t = useTheme();
  return (
    <View style={[{ flex, backgroundColor: t.c.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 11 }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }]}>
      <T v={small ? 'moneyInline' : 'moneyCard'} c={valueC} style={small ? { fontSize: 15, lineHeight: 21 } : { fontSize: 19, lineHeight: 21, letterSpacing: 0 }} numberOfLines={1}>{value}</T>
      <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 11, lineHeight: 14 }} numberOfLines={2}>{label}</T>
    </View>
  );
}

function SectionHead({ title, right, style }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }, style]}>
      <T v="titleSection" style={{ fontSize: 17, lineHeight: 21 }} accessibilityRole="header">{title}</T>
      {right != null ? <T v="caption" c="ink2">{right}</T> : null}
    </View>
  );
}

function Stars({ value, size = 13 }) {
  const { c } = useTheme();
  const n = Math.round(Number(value) || 0);
  return (
    <View style={{ flexDirection: 'row', gap: 1 }} accessible accessibilityLabel={`Оценка ${n} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star.fill" size={size} c={i <= n ? c.star : c.lineStrong} />)}
    </View>
  );
}

function OpenShift({ shift, location, now, onPress }) {
  const sky = skyKey(shift, { now });
  const where = [location?.address, seatsWord(shift.spotsTaken, shift.spotsTotal)].filter(Boolean).join(' · ');
  return (
    <Surface onPress={onPress} accessibilityLabel={`${shift.title}, ${dayLabel(shift.date, now)} ${timeRange(shift)}, ${shift.pay} BYN. ${where}. Открыть смену`}>
      <SkyBand
        sky={sky}
        text={`${dayLabel(shift.date, now)} · ${timeRange(shift)}`}
        height={30}
        fontSize={12}
        right={shift.urgent && sky !== 'closed' ? <StatusBadge state="urgent" size="sm" /> : null}
      />
      <View style={{ paddingVertical: 10, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="rowTitle" style={{ fontSize: 15, lineHeight: 19 }} numberOfLines={2}>{shift.title}</T>
          <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12, lineHeight: 16 }} numberOfLines={2}>{where}</T>
        </View>
        <Money value={shift.pay} size="card" fontSize={20} />
      </View>
    </Surface>
  );
}

export default function PublicCompanyProfileScreen({ route, navigation }) {
  const { companyId } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const company = useStore((s) => s.getCompanyById(companyId));
  const shifts = useStore((s) => s.shifts);
  const reviewsAll = useStore((s) => s.reviews);
  const blockedUsers = useStore((s) => s.blockedUsers);
  const getLocationById = useStore((s) => s.getLocationById);
  const now = new Date();

  // Reviews by people this viewer blocked disappear, as the block promises.
  const reviews = useMemo(() => reviewsAll
    .filter((r) => r.targetId === companyId && !blockedUsers.includes(r.authorId))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))), [reviewsAll, companyId, blockedUsers]);
  const open = useMemo(() => {
    const at = new Date();
    return shifts.filter((s) => s.companyId === companyId && s.status === 'active' && shiftStart(s) > at).sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));
  }, [shifts, companyId]);
  const cancelled = useMemo(() => shifts.filter((s) => s.companyId === companyId && s.status === 'cancelled').length, [shifts, companyId]);
  const criteria = useMemo(() => {
    const sums = {}; const counts = {};
    reviews.forEach((r) => Object.entries(r.categoryRatings || {}).forEach(([k, v]) => {
      if (typeof v !== 'number') return;
      sums[k] = (sums[k] || 0) + v; counts[k] = (counts[k] || 0) + 1;
    }));
    return CRITERIA.filter(([k]) => counts[k]).map(([k, label]) => ({ key: k, label, value: sums[k] / counts[k] }));
  }, [reviews]);

  if (!company) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const sky = t.sky(HEADER_SKY);
  const kind = categoryFromBusiness(company.businessCategory);
  const categoryLabel = (kind && CATEGORY_LABEL[kind]) || company.businessCategory;
  const reviewsCount = company.reviewsCount || reviews.length;
  const published = company.totalShiftsPublished || 0;
  const canReport = !!me && me.id !== companyId;
  const report = () => openReportMenu({ targetType: 'user', targetId: companyId, targetName: company.companyName, store: useStore.getState() });
  const barColor = (v) => (v >= 4.5 ? c.success : v >= 3.5 ? c.brand : c.urgent);
  const meta = [
    reviewsCount ? `${reviewsCount} ${plural(reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}` : 'пока без отзывов',
    categoryLabel,
  ].filter(Boolean).join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={sky.key === 'night' || t.dark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <SkyView sky={sky} style={{ paddingBottom: 18 }}>
          <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CircleButton icon="chevron.left" variant="sky" color={sky.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
            {canReport ? <CircleButton icon="ellipsis" variant="sky" color={sky.ink} onPress={report} accessibilityLabel="Ещё: пожаловаться или заблокировать" /> : null}
          </View>
          <View style={{ paddingTop: 16, paddingHorizontal: gutter, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <CompanyMono name={company.companyName} logo={company.logo} size={64} category={kind || undefined} style={{ borderRadius: 21, backgroundColor: c.bg }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="titleScreen" c={sky.ink} style={{ fontSize: 21, lineHeight: 25, letterSpacing: -0.2 }} accessibilityRole="header">{company.companyName}</T>
              <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {company.rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }} accessible accessibilityLabel={`Рейтинг ${String(company.rating.toFixed(1)).replace('.', ',')}`}>
                    <Icon name="star.fill" size={13} c={c.star} />
                    <T v="bodyStrong" c={sky.ink} weight="700" style={{ fontSize: 13, lineHeight: 17 }}>{company.rating.toFixed(1)}</T>
                  </View>
                ) : null}
                <T v="bodyStrong" c={sky.ink2} weight="500" style={{ fontSize: 13, lineHeight: 17, flexShrink: 1 }}>{company.rating ? `· ${meta}` : meta}</T>
              </View>
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: gutter }}>
          <View style={{ flexDirection: 'row', gap: 7 }}>
            <Stat value={String(published)} label={plural(published, ['смена', 'смены', 'смен'])} />
            <Stat value={String(cancelled)} label={plural(cancelled, ['отмена', 'отмены', 'отмен'])} valueC={cancelled === 0 ? 'success' : 'ink'} />
            {company.unp ? <Stat value={company.unp} label="УНП" flex={1.6} small /> : null}
          </View>

          {company.description ? (
            <Surface style={{ marginTop: 10 }}>
              <View style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }}>О компании</T>
                <T v="body" c="ink3" style={{ marginTop: 5, fontSize: 14, lineHeight: 20 }}>{company.description}</T>
              </View>
            </Surface>
          ) : null}

          {criteria.length ? (
            <>
              <SectionHead title="Как оценивают исполнители" style={{ marginTop: 18 }} />
              <Surface style={{ marginTop: 10 }}>
                <View style={{ paddingVertical: 13, paddingHorizontal: 14, gap: 10 }}>
                  {criteria.map((cr) => (
                    <View key={cr.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessible accessibilityLabel={`${cr.label}: ${String(cr.value.toFixed(1)).replace('.', ',')} из 5`}>
                      <T v="caption" c="ink3" style={{ width: 118, fontSize: 13.5, lineHeight: 17 }}>{cr.label}</T>
                      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: c.line, overflow: 'hidden' }}>
                        <View style={{ width: `${Math.max(0, Math.min(100, (cr.value / 5) * 100))}%`, height: 6, borderRadius: 3, backgroundColor: barColor(cr.value) }} />
                      </View>
                      <T v="moneyInline" style={{ fontSize: 13, lineHeight: 16, minWidth: 22, textAlign: 'right' }}>{cr.value.toFixed(1)}</T>
                    </View>
                  ))}
                </View>
              </Surface>
            </>
          ) : null}

          <SectionHead title="Открытые смены" right={open.length ? String(open.length) : undefined} style={{ marginTop: 18 }} />
          {open.length ? (
            <View style={{ marginTop: 9, gap: 8 }}>
              {open.map((s) => (
                <OpenShift key={s.id} shift={s} location={getLocationById(s.locationId)} now={now} onPress={() => navigation.push('ShiftDetail', { shiftId: s.id })} />
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 9, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surface2 }}>
              <T v="caption" c="ink3" weight="500" style={{ fontSize: 13.5, lineHeight: 19 }}>Сейчас открытых смен нет. Новые смены этой компании появятся в ленте.</T>
            </View>
          )}

          <SectionHead title="Отзывы" right={reviews.length ? String(reviews.length) : undefined} style={{ marginTop: 18 }} />
          {reviews.length ? (
            <View style={{ marginTop: 9, gap: 8 }}>
              {reviews.map((r) => (
                <Surface key={r.id}>
                  <View style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Stars value={r.overallRating} />
                      <T v="caption" c="ink2" style={{ fontSize: 12, lineHeight: 15 }}>{longDate(String(r.createdAt).slice(0, 10))}</T>
                    </View>
                    {r.text ? <T v="body" c="ink3" style={{ marginTop: 7, fontSize: 14, lineHeight: 20 }}>{r.text}</T> : null}
                    {r.tags?.length ? <T v="caption" c="ink2" style={{ marginTop: 6, fontSize: 12.5 }}>{r.tags.join(' · ')}</T> : null}
                  </View>
                </Surface>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 9, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surface2 }}>
              <T v="caption" c="ink3" weight="500" style={{ fontSize: 13.5, lineHeight: 19 }}>Отзывов пока нет. Они появляются после смен.</T>
            </View>
          )}

          {canReport ? (
            <Press feedback="none" onPress={report} accessibilityLabel="Пожаловаться на компанию" style={{ alignSelf: 'center', marginTop: 8, minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' }}>
              <T v="body" c="error" style={{ fontSize: 14, lineHeight: 18 }}>Пожаловаться на компанию</T>
            </Press>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
