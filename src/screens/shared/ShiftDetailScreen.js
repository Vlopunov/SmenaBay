// Shift detail (handoff screens 2, 3, 15). One screen, the shift's life:
//  · open → money hero + ledger + «Откликнуться · 65 BYN»;
//  · guest or unverified → the phone sheet, the button stays «pressed»;
//  · applied → the CTA has squeezed into «Ждёт ответа»;
//  · confirmed → warm sheet with the pass: the shift is now a thing in hand;
//  · over → «Оцени смену».
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Share, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import {
  NavBar, RoundButton, LedgerRow, Separator, SeatsBar, Monogram, Note, Button, SectionHeader, Press, Glass, StatusPill,
} from '../../design/ui';
import PassCard, { useNow } from '../../design/PassCard';
import ApplyButton from '../../design/ApplyButton';
import { useTheme, SUPPORTS_GLASS } from '../../design/theme';
import { haptic } from '../../design/haptics';
import {
  money, perHour, dayLabel, shortDate, timeRange, hours, countdown, plural,
} from '../../design/format';
import { openReportMenu } from '../../components/ReportMenu';
import PhoneSheet from '../../components/PhoneSheet';
import CancelShiftSheet from '../../components/CancelShiftSheet';
import { openRoute } from '../../components/openRoute';
import { prettyPhone } from '../../design/PhoneField';
import useStore from '../../store/useStore';

function requirementLines(req = {}) {
  const out = [];
  if (req.noExperienceOk) out.push('Без опыта — научат на месте');
  if (req.medicalBookRequired) out.push('Нужна медкнижка');
  if (req.smartphoneRequired) out.push('Свой смартфон');
  if (req.minAge) out.push(`С ${req.minAge} лет`);
  if (req.ownClothes) out.push('Своя рабочая одежда');
  if (req.other) out.push(req.other);
  return out;
}

export default function ShiftDetailScreen({ route, navigation }) {
  const { shiftId, applyResult } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow(30000);

  const currentUser = useStore((s) => s.currentUser);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const company = useStore((s) => (shift ? s.getCompanyById(shift.companyId) : null));
  const location = useStore((s) => (shift ? s.getLocationById(shift.locationId) : null));
  const application = useStore((s) => s.applications.find((a) => a.shiftId === shiftId && a.workerId === s.currentUser?.id && a.status !== 'cancelled_by_worker'));
  // Select raw arrays and derive below: a selector that returns a fresh
  // array on every call loops useSyncExternalStore (zustand v5).
  const allReviews = useStore((s) => s.reviews);
  const reviews = useMemo(() => (shift ? allReviews.filter((r) => r.targetId === shift.companyId) : []), [allReviews, shift?.companyId]);
  const myReview = useStore((s) => (shift && s.currentUser ? s.getReviewForShift(shiftId, s.currentUser.id, shift.companyId) : null));
  const cancellations = useStore((s) => s.applications.filter((a) => a.workerId === s.currentUser?.id && a.status === 'cancelled_by_worker').length);
  const saved = useStore((s) => s.isSavedShift(shiftId));
  const workers = useStore((s) => s.workers);
  const applyToShift = useStore((s) => s.applyToShift);
  const cancelApplication = useStore((s) => s.cancelApplication);
  const toggleSavedShift = useStore((s) => s.toggleSavedShift);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);

  const [phoneSheet, setPhoneSheet] = useState(false);
  const [cancelSheet, setCancelSheet] = useState(false);
  const [error, setError] = useState(null);
  const [shownState, setShownState] = useState(null);

  const isOwner = currentUser?.role === 'employer' && shift?.companyId === currentUser.id;
  useEffect(() => { if (isOwner) navigation.replace('ShiftManage', { shiftId }); }, [isOwner]);

  const full = shift ? (shift.status === 'filled' || shift.spotsTaken >= shift.spotsTotal) : false;
  const cd = shift ? countdown(shift, now) : null;
  const status = application?.status;

  // What the apply button should show, derived from the store…
  const derived = error ? 'error'
    : status === 'pending' ? 'sent'
      : full ? 'full' : 'idle';
  // …but only committed while this screen is on top, so the morph and its
  // haptic happen in front of the person — not behind the SMS-code screen.
  useFocusEffect(useCallback(() => { setShownState(derived); }, [derived]));
  useEffect(() => { if (shownState === null) setShownState(derived); }, []);

  useEffect(() => {
    if (applyResult === 'shift_full') setError('Места только что закончились');
    if (applyResult === 'shift_not_active') setError('Смена больше не принимает отклики');
  }, [applyResult]);
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 2600);
    return () => clearTimeout(id);
  }, [error]);

  if (!shift || isOwner) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;

  const openChat = () => {
    if (!currentUser) return;
    const conv = getOrCreateConversation(shift.id, currentUser.id, shift.companyId);
    navigation.navigate('ChatConversation', { conversationId: conv.id });
  };

  const apply = () => {
    if (!currentUser) { setPhoneSheet(true); return; }
    if (currentUser.role !== 'worker') return;
    if (!currentUser.phoneVerified) { setPhoneSheet(true); return; }
    const res = applyToShift(shift.id);
    if (res?.error === 'shift_full') { setError('Места только что закончились'); return; }
    if (res?.error === 'shift_not_active') { setError('Смена больше не принимает отклики'); return; }
    if (res?.error === 'phone_not_verified') { setPhoneSheet(true); }
  };

  const share = () => Share.share({
    message: `${shift.title} — ${shift.pay} BYN за смену, ${dayLabel(shift.date).toLowerCase()} ${timeRange(shift)}. ${company?.companyName || ''}, ${location?.address || ''}. СменаБел`,
  });

  const menu = () => {
    const extra = [];
    if (currentUser?.role === 'worker') {
      extra.push({ label: saved ? 'Убрать из сохранённых' : 'Сохранить', onPress: () => { haptic.selection(); toggleSavedShift(shift.id); } });
    }
    extra.push({ label: 'Поделиться', onPress: share });
    if (status === 'pending') {
      extra.push({ label: 'Отозвать отклик', destructive: true, onPress: () => { haptic.medium(); cancelApplication(application.id); } });
    }
    if (status === 'approved' && cd.phase === 'before') {
      extra.push({ label: 'Отменить смену', destructive: true, onPress: () => setCancelSheet(true) });
    }
    openReportMenu({ targetType: 'shift', targetId: shift.id, targetName: shift.title, blockUserId: shift.companyId, extra, store: useStore.getState() });
  };

  const reqs = requirementLines(shift.requirements);
  const dateLine = `${dayLabel(shift.date) === 'Сегодня' ? 'Сегодня' : dayLabel(shift.date) === 'Завтра' ? 'Завтра' : shortDate(shift.date)}, ${timeRange(shift)}`;

  // ── Confirmed: the pass ─────────────────────────────────────
  if (status === 'approved' && cd.phase !== 'ended') {
    return (
      <View style={{ flex: 1, backgroundColor: c.warmBg }}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <NavBar onBack={() => navigation.goBack()} right={<RoundButton icon="ellipsis" onPress={menu} accessibilityLabel="Ещё" />} />
          <View style={{ paddingHorizontal: 22, paddingTop: 22 }}>
            <PassCard shift={shift} company={company} location={location} variant="hero" />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingTop: 16 }}>
            <Button title="Маршрут" icon="location.fill" size="md" style={{ flex: 1 }} onPress={() => openRoute(location)} />
            <Button title="Написать" icon="bubble.left" size="md" variant="secondary" style={{ flex: 1 }} onPress={openChat} />
          </View>
          <Separator warm style={{ marginTop: 26 }} />
          <LedgerRow warm label="Где" value={location?.address || '—'} sub={location?.name} />
          {company?.contactPerson ? (
            <LedgerRow warm label="На входе" value={`Спроси: ${company.contactPerson}`} sub={company.phoneVisible !== false ? prettyPhone(company.phone) : undefined} />
          ) : null}
          {reqs.length ? <LedgerRow warm label="Возьми" value={reqs.filter((r) => !r.startsWith('Без опыта') && !r.startsWith('С ')).join(', ') || 'Ничего особенного'} sub={shift.requirements?.other || undefined} /> : null}
          <LedgerRow warm label="Оплата" value={`${money(shift.pay)} BYN после смены`} sub="Напрямую от заказчика" last />
          <Note style={{ marginTop: 26 }}>
            Отменить смену можно в меню «···». Денежного штрафа нет, но отмена будет видна заказчикам.
          </Note>
        </ScrollView>
        <CancelShiftSheet
          visible={cancelSheet}
          onClose={() => setCancelSheet(false)}
          shift={shift}
          company={company}
          cancellations={cancellations}
          hasNoCancelBadge={currentUser?.badges?.includes('no_cancels')}
          onWrite={() => { setCancelSheet(false); openChat(); }}
          onConfirm={() => { setCancelSheet(false); haptic.medium(); cancelApplication(application.id); }}
        />
      </View>
    );
  }

  const over = cd.phase === 'ended' || shift.status === 'completed' || status === 'completed';
  const worked = over && (status === 'approved' || status === 'completed');

  // ── Open / applied / over ───────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <NavBar onBack={() => navigation.goBack()} variant="fill" right={<RoundButton icon="ellipsis" variant="fill" onPress={menu} accessibilityLabel="Ещё" />} />
        <View style={{ paddingHorizontal: 22, paddingTop: 26 }}>
          {status === 'rejected' ? <StatusPill status="rejected" /> : shift.urgent && !full && !over ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="bolt.fill" size={12} c="label" />
              <T v="label" style={{ fontSize: 12, fontWeight: '600' }}>Срочно</T>
            </View>
          ) : null}
          <T v="title" style={{ marginTop: 9 }} accessibilityRole="header">{shift.title}</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
            <T v="moneyHero">{money(shift.pay)}</T>
            <T v="rowTitle" c="secondary" style={{ fontSize: 19, letterSpacing: 0 }}>BYN</T>
            <T v="body" c="secondary" style={{ marginLeft: 4 }}>{perHour(shift)}</T>
          </View>
        </View>

        <Separator style={{ marginTop: 26 }} />
        <LedgerRow label="Когда" value={dateLine} sub={`${shortDate(shift.date)} · ${hours(shift.durationHours)}`} />
        <LedgerRow
          label="Мест"
          alignTop={false}
          value={`${shift.spotsTaken} из ${shift.spotsTotal} занято`}
          right={<SeatsBar taken={shift.spotsTaken} total={shift.spotsTotal} width={shift.spotsTotal > 2 ? 60 : 47} />}
        />
        <Press feedback="highlight" onPress={() => navigation.navigate('PublicCompanyProfile', { companyId: shift.companyId })} accessibilityLabel={`Компания ${company?.companyName}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 11, paddingBottom: 12 }}>
            <T v="caption" c="secondary" style={{ width: 84 }}>Компания</T>
            <Monogram name={company?.companyName} logo={company?.logo} size={30} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="value" numberOfLines={1}>{company?.companyName}</T>
              {company?.rating ? (
                <T v="caption" c="secondary" style={{ lineHeight: 17 }}>
                  ★ {company.rating.toFixed(1)} · {company.reviewsCount} {plural(company.reviewsCount, ['отзыв', 'отзыва', 'отзывов'])}
                </T>
              ) : null}
            </View>
            <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" />
          </View>
        </Press>
        <Separator inset />
        {reqs.length ? <LedgerRow label="Требования" value={reqs.join('\n')} /> : null}
        <LedgerRow
          label="Где"
          value={location?.address || '—'}
          sub={location?.name}
          right={location ? (
            <Press feedback="none" onPress={() => openRoute(location)} hitSlop={10} accessibilityLabel="Маршрут">
              <T v="bodyStrong" c="accent">Маршрут</T>
            </Press>
          ) : null}
        />
        <LedgerRow label="Задачи" value={shift.description} valueV="body" last />

        {reviews.length ? (
          <>
            <SectionHeader title="Отзывы о компании" right={reviews.length > 2 ? `Все ${reviews.length}` : undefined} onRightPress={() => navigation.navigate('PublicCompanyProfile', { companyId: shift.companyId })} />
            {reviews.slice(0, 2).map((r, i) => (
              <View key={r.id}>
                <View style={{ paddingHorizontal: 22, paddingVertical: 13 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="star.fill" size={11} c="label" />
                    <T v="bodyStrong">{Number(r.overallRating || 0).toFixed(1)}</T>
                    <T v="caption" c="secondary">· {r.anonymous ? 'Анонимно' : (workers.find((w) => w.id === r.authorId)?.firstName || 'Исполнитель')}</T>
                  </View>
                  {r.text ? <T v="body" style={{ marginTop: 4 }} numberOfLines={3}>{r.text}</T> : null}
                </View>
                {i < Math.min(2, reviews.length) - 1 ? <Separator inset /> : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      {/* Bottom panel — glass, the one action of this screen */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <View style={[
          { paddingHorizontal: 16, paddingTop: 30, paddingBottom: insets.bottom + 10 },
          { backgroundColor: SUPPORTS_GLASS ? 'transparent' : c.glassFallback, borderTopWidth: SUPPORTS_GLASS ? 0 : StyleSheet.hairlineWidth * 2, borderTopColor: c.glassFallbackBorder },
        ]}>
          {SUPPORTS_GLASS ? <Glass radius={0} border={false} style={StyleSheet.absoluteFill} /> : null}
          {worked ? (
            myReview ? (
              <View style={{ alignItems: 'center', gap: 4 }}>
                <StatusPill status="done" label="Смена закрыта, оценка отправлена" size="lg" style={{ alignSelf: 'center' }} />
              </View>
            ) : (
              <Button title="Оценить смену" onPress={() => navigation.navigate('RateShift', { shiftId: shift.id })} />
            )
          ) : over ? (
            <View style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}><T v="bodyStrong" c="secondary">Смена уже прошла</T></View>
          ) : currentUser?.role === 'employer' ? (
            <View style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}><T v="body" c="secondary">Так смену видят исполнители</T></View>
          ) : status === 'rejected' ? (
            <Button title="Найти похожую смену" variant="secondary" onPress={() => navigation.navigate('Tabs', { screen: 'Shifts' })} />
          ) : (
            <>
              <ApplyButton state={phoneSheet ? 'idle' : shownState || derived} amount={shift.pay} onPress={apply} errorText={error || undefined} />
              {derived === 'sent' ? (
                <T v="small" c="secondary" style={{ textAlign: 'center', marginTop: 8 }}>
                  Ответ заказчика появится в уведомлениях
                </T>
              ) : null}
            </>
          )}
        </View>
      </View>

      <PhoneSheet
        visible={phoneSheet}
        onClose={() => setPhoneSheet(false)}
        navigation={navigation}
        spotsLeft={shift.spotsTotal - shift.spotsTaken}
        intent={currentUser ? { type: 'verify-phone', then: { type: 'apply', shiftId: shift.id } } : { type: 'apply', shiftId: shift.id }}
      />
    </View>
  );
}
