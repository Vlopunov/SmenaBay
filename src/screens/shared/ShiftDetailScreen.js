// Shift details — screens 4 and 10. One screen, the shift's life:
//  · open → the sky of its hour, money hero, company, place, seats;
//  · guest → «Нужен номер» sheet at the moment of applying;
//  · applied → the button has morphed into «Отклик отправлен»;
//  · confirmed → the pass: countdown, where to go, whom to ask;
//  · over → «Оцени смену».
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Share, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import Money from '../../design/Money';
import {
  CircleButton, Card, Button, Material, Divider, SectionTitle, InfoPlate, Tag, Press, Progress,
} from '../../design/ui';
import { SkyView, Sheen, skyKey } from '../../design/Sky';
import { StatusBadge, SeatDots } from '../../design/Status';
import { CompanyMono, PersonMono } from '../../design/Monogram';
import { useNow, passClock, Ticking } from '../../design/PassCard';
import ApplyButton from '../../design/ApplyButton';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import {
  perHour, dayLabel, timeRange, hours, plural, accusative, waitedFor, longDate,
} from '../../design/format';
import { seatsWord } from '../../design/ShiftCard';
import { openReportMenu } from '../../components/ReportMenu';
import PhoneSheet from '../../components/PhoneSheet';
import CancelShiftSheet from '../../components/CancelShiftSheet';
import MiniMap from '../../components/MiniMap';
import { openRoute } from '../../components/openRoute';
import useStore from '../../store/useStore';

function requirementTags(req = {}) {
  const out = [];
  if (req.noExperienceOk) out.push({ label: 'Без опыта', tone: 'success' });
  if (req.medicalBookRequired) out.push({ label: 'Медкнижка', tone: 'neutral' });
  if (req.smartphoneRequired) out.push({ label: 'Смартфон', tone: 'neutral' });
  if (req.ownClothes) out.push({ label: 'Своя одежда', tone: 'neutral' });
  if (req.minAge) out.push({ label: `${req.minAge}+`, tone: 'neutral' });
  return out;
}

const reviewsWord = (n) => `${n} ${plural(n, ['отзыв', 'отзыва', 'отзывов'])}`;
const cancelsWord = (n) => `${n} ${plural(n, ['отмена', 'отмены', 'отмен'])}`;

export default function ShiftDetailScreen({ route, navigation }) {
  const { shiftId, applyResult } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const now = useNow(1000);
  // iPhone SE: money.hero 52 → 44, the mini-map 104 → 74.
  const compact = useWindowDimensions().width < 380;

  const currentUser = useStore((s) => s.currentUser);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const company = useStore((s) => (shift ? s.getCompanyById(shift.companyId) : null));
  const location = useStore((s) => (shift ? s.getLocationById(shift.locationId) : null));
  const application = useStore((s) => s.applications.find((a) => a.shiftId === shiftId && a.workerId === s.currentUser?.id && a.status !== 'cancelled_by_worker'));
  const allReviews = useStore((s) => s.reviews);
  const allShifts = useStore((s) => s.shifts);
  const reviews = useMemo(() => (shift ? allReviews.filter((r) => r.targetId === shift.companyId && r.type === 'worker_about_company') : []), [allReviews, shift?.companyId]);
  const companyCancels = useMemo(() => (shift ? allShifts.filter((x) => x.companyId === shift.companyId && x.status === 'cancelled').length : 0), [allShifts, shift?.companyId]);
  const myReview = useStore((s) => (shift && s.currentUser ? s.getReviewForShift(shiftId, s.currentUser.id, shift.companyId) : null));
  const cancellations = useStore((s) => s.applications.filter((a) => a.workerId === s.currentUser?.id && a.status === 'cancelled_by_worker').length);
  const saved = useStore((s) => s.isSavedShift(shiftId));
  const applyToShift = useStore((s) => s.applyToShift);
  const cancelApplication = useStore((s) => s.cancelApplication);
  const toggleSavedShift = useStore((s) => s.toggleSavedShift);
  const getOrCreateConversation = useStore((s) => s.getOrCreateConversation);
  const seenAt = useStore((s) => s.myShiftsSeenAt);

  const [phoneSheet, setPhoneSheet] = useState(false);
  const [cancelSheet, setCancelSheet] = useState(false);
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [shownState, setShownState] = useState(null);

  const isOwner = currentUser?.role === 'employer' && shift?.companyId === currentUser.id;
  useEffect(() => { if (isOwner) navigation.replace('ShiftManage', { shiftId }); }, [isOwner]);

  const full = shift ? (shift.status === 'filled' || shift.spotsTaken >= shift.spotsTotal) : false;
  const status = application?.status;
  // The round-trip owns the button while it lasts: «Отправляем…» first, the
  // morph (or the shake) only once the server has answered.
  const derived = sending ? 'sending' : error ? 'error' : status === 'pending' ? 'sent' : full ? 'full' : 'idle';
  // The morph and its haptic happen in front of the person — committed only
  // while this screen is on top, not behind the SMS-code screen.
  useFocusEffect(useCallback(() => { setShownState(derived); }, [derived]));
  useEffect(() => { if (shownState === null) setShownState(derived); }, []);

  const refuse = (text) => { setError(true); toast.error(text); setTimeout(() => setError(false), 1000); };
  useEffect(() => {
    if (applyResult === 'shift_full') refuse('Места только что закончились');
    if (applyResult === 'shift_not_active') refuse('Смена больше не принимает отклики');
  }, [applyResult]);

  if (!shift || isOwner) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const clock = passClock(shift, now);
  const over = clock.phase === 'ended' || shift.status === 'completed' || status === 'completed';
  const confirmed = status === 'approved' && !over;
  const worked = over && (status === 'approved' || status === 'completed');
  const sky = t.sky(skyKey(shift, { now, ignoreClosed: confirmed }));

  // The server hands back the conversation id both sides will use, so the
  // chat opens only after it answers — a second tap meanwhile does nothing.
  const openChat = async () => {
    if (!currentUser || openingChat) return;
    setOpeningChat(true);
    try {
      const conv = await getOrCreateConversation(shift.id, currentUser.id, shift.companyId);
      navigation.navigate('ChatConversation', { conversationId: conv.id });
    } catch (e) {
      toast.error('Не удалось открыть чат');
    } finally {
      setOpeningChat(false);
    }
  };

  const apply = async () => {
    if (sending) return;
    if (full) { refuse('Места только что закончились'); return; }
    if (!currentUser) { setPhoneSheet(true); return; }
    if (currentUser.role !== 'worker') return;
    if (!currentUser.phoneVerified) { setPhoneSheet(true); return; }
    let res;
    setSending(true);
    try {
      res = await applyToShift(shift.id);
    } catch (e) {
      res = { error: 'Не удалось отправить отклик.' };
    } finally {
      setSending(false);
    }
    if (res?.error === 'shift_full') { refuse('Места только что закончились'); return; }
    if (res?.error === 'shift_not_active') { refuse('Смена больше не принимает отклики'); return; }
    if (res?.error === 'already_applied') { toast.show({ text: 'Ты уже откликнулся', kind: 'info' }); return; }
    // Both mean the same thing here: the number has to be confirmed first.
    if (res?.error === 'phone_not_verified' || res?.error === 'not_authenticated') { setPhoneSheet(true); return; }
    if (res?.error) { toast.error(res.error); return; }
    toast.success(`Отклик отправлен · ${shift.pay} BYN`);
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
      extra.push({ label: 'Отозвать отклик', destructive: true, onPress: () => { haptic.medium(); cancelApplication(application.id); toast.show({ text: 'Отклик отозван', kind: 'info' }); } });
    }
    if (confirmed && clock.phase === 'before') {
      extra.push({ label: 'Отменить смену', destructive: true, onPress: () => setCancelSheet(true) });
    }
    openReportMenu({ targetType: 'shift', targetId: shift.id, targetName: shift.title, blockUserId: shift.companyId, extra, store: useStore.getState() });
  };

  const barStyle = sky.key === 'night' || t.dark ? 'light' : 'dark';
  const panelH = 12 + 54 + insets.bottom + 26;
  const nav = (
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <CircleButton icon="chevron.left" variant="sky" color={sky.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
      <View style={{ flexDirection: 'row', gap: 9 }}>
        {currentUser?.role === 'worker' && !confirmed ? (
          <CircleButton icon={saved ? 'bookmark.fill' : 'bookmark'} variant="sky" color={sky.ink} onPress={() => { haptic.selection(); toggleSavedShift(shift.id); toast.success(saved ? 'Убрано из сохранённых' : 'Сохранено'); }} accessibilityLabel={saved ? 'Убрать из сохранённых' : 'Сохранить'} />
        ) : null}
        <CircleButton icon="ellipsis" variant="sky" color={sky.ink} onPress={menu} accessibilityLabel="Ещё: поделиться, пожаловаться" />
      </View>
    </View>
  );

  // ── Confirmed: the pass ─────────────────────────────────────
  if (confirmed) {
    const fresh = application?.respondedAt && (!seenAt || new Date(application.respondedAt) > new Date(seenAt));
    const running = clock.phase === 'running';
    const contact = company?.contactPerson;
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <StatusBar style={barStyle} />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <SkyView sky={sky} style={{ paddingBottom: 22 }}>
            {fresh ? <Sheen delay={300} /> : null}
            {nav}
            <View style={{ paddingTop: 20, paddingHorizontal: 20 }}>
              {running
                ? <StatusBadge state="running" label="Идёт смена" />
                : <StatusBadge state="confirmed" label="Смена подтверждена" style={{ backgroundColor: c.onSky }} />}
              <T v="bodyStrong" c={sky.ink2} style={{ marginTop: 14, fontSize: 14 }}>{clock.label}</T>
              <Ticking value={clock.value}>
                <T v="countdown" c={sky.ink} style={{ marginTop: 4 }} accessibilityLiveRegion="polite">{clock.value}</T>
              </Ticking>
              {running ? <Progress value={clock.progress} color={sky.ink} track={c.onSky} height={6} style={{ marginTop: 10 }} /> : null}
              <View style={{ marginTop: 14, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 16, backgroundColor: c.onSky }}>
                <T v="titleSection" c={sky.ink}>{shift.title}</T>
                <T v="bodyStrong" c={sky.ink2} style={{ marginTop: 5 }}>{`${dayLabel(shift.date, now)} · ${timeRange(shift)} · ${hours(shift.durationHours)}`}</T>
                <View style={{ marginTop: 9, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                  <Money value={shift.pay} size="pass" c={sky.ink} suffixC={sky.ink2} />
                  <T v="caption" c={sky.ink2} style={{ fontSize: 12.5 }}>{perHour(shift)}</T>
                </View>
              </View>
            </View>
          </SkyView>

          <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 10 }}>
            <Card style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }}>Куда идти</T>
                  <T v="rowTitle" style={{ marginTop: 5, fontSize: 16 }}>{location?.address || '—'}</T>
                  {location?.hint || location?.name ? <T v="caption" c="ink2" style={{ marginTop: 3 }}>{location.hint || location.name}</T> : null}
                </View>
                {location ? <Button title="Маршрут" size="sm" onPress={() => openRoute(location)} style={{ borderRadius: 13 }} /> : null}
              </View>
              {contact ? (
                <>
                  <Divider style={{ marginTop: 12 }} />
                  <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <PersonMono first={contact.split(' ')[0]} last={contact.split(' ')[1]} size={42} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }}>На входе спросить</T>
                      <T v="rowTitle" style={{ marginTop: 4, fontSize: 15.5 }}>{accusative(contact)}</T>
                    </View>
                    <Button title="Написать" size="sm" variant="secondary" loading={openingChat} onPress={openChat} style={{ borderRadius: 13 }} />
                  </View>
                </>
              ) : null}
            </Card>
            <InfoPlate icon="banknote" tone="success">{`Оплата — ${shift.pay} BYN после смены, напрямую от заказчика`}</InfoPlate>
            {clock.phase === 'before' ? (
              <T v="caption" c="ink2" style={{ textAlign: 'center', marginTop: 4 }}>Отменить смену можно в меню «···» — заказчик увидит отмену в профиле.</T>
            ) : null}
          </View>
        </ScrollView>
        <CancelShiftSheet
          visible={cancelSheet}
          onClose={() => setCancelSheet(false)}
          shift={shift}
          company={company}
          location={location}
          cancellations={cancellations}
          hasNoCancelBadge={currentUser?.badges?.includes('no_cancels')}
          onWrite={() => { setCancelSheet(false); openChat(); }}
          onConfirm={() => { setCancelSheet(false); haptic.medium(); cancelApplication(application.id); toast.show({ text: 'Смена отменена', kind: 'info' }); }}
        />
      </View>
    );
  }

  // ── Open / applied / full / over ────────────────────────────
  const reqs = requirementTags(shift.requirements);
  const left = shift.spotsTotal - shift.spotsTaken;
  const soon = dayLabel(shift.date, now);
  let badge = null;
  if (status === 'rejected') badge = <StatusBadge state="rejected" style={{ backgroundColor: c.onSky }} />;
  else if (over) badge = <StatusBadge state="done" label="Смена прошла" style={{ backgroundColor: c.onSky }} />;
  else if (full) badge = <StatusBadge state="full" onSky />;
  else if (status === 'pending') badge = <StatusBadge state="pending" />;
  else if (shift.urgent) badge = <StatusBadge state="urgent" label={soon === 'Сегодня' || soon === 'Завтра' ? `Срочно · нужен ${soon.toLowerCase()}` : 'Срочно'} />;

  const note = derived === 'sent' || shownState === 'sent'
    ? `Ждёт ответа заказчика · ${waitedFor(application?.appliedAt, now)}`
    : full ? 'Места закончились. Похожие смены — в ленте' : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={barStyle} />
      <ScrollView contentContainerStyle={{ paddingBottom: panelH + 20 }}>
        <SkyView sky={sky} style={{ paddingBottom: 20 }}>
          {nav}
          <View style={{ paddingTop: 22, paddingHorizontal: 20 }}>
            {badge}
            <T v="titleScreen" c={sky.ink} style={{ marginTop: badge ? 12 : 0 }} accessibilityRole="header">{shift.title}</T>
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <Money value={shift.pay} size="hero" c={sky.ink} suffixC={sky.ink} fontSize={compact ? 44 : undefined} />
              <T v="bodyStrong" c={sky.ink2}>{perHour(shift)}</T>
            </View>
            <T v="caption" c={sky.ink2} style={{ marginTop: 7 }}>Оплата после смены, напрямую от заказчика</T>
            <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.onSky }}>
              <T v="bodyStrong" display weight="700" c={sky.ink} style={{ fontSize: 15 }}>{`${soon} · ${timeRange(shift)}`}</T>
              <View style={{ width: 1, height: 14, backgroundColor: sky.ink, opacity: 0.25 }} />
              <T v="bodyStrong" display weight="600" c={sky.ink2} style={{ fontSize: 15 }}>{hours(shift.durationHours)}</T>
              {/* The sky already says it; on a narrow screen the word gives way. */}
              {!compact ? (
                <T v="caption" c={sky.ink2} weight="600" style={{ marginLeft: 'auto', flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>
                  {t.sky(skyKey(shift, { ignoreClosed: true })).label}
                </T>
              ) : null}
            </View>
          </View>
        </SkyView>

        <View style={{ paddingTop: 14, paddingHorizontal: 20, gap: 10 }}>
          <Card onPress={() => navigation.navigate('PublicCompanyProfile', { companyId: shift.companyId })} accessibilityLabel={`Компания ${company?.companyName}`} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CompanyMono name={company?.companyName} logo={company?.logo} size={44} sky={sky.key} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" style={{ fontSize: 16 }} numberOfLines={1}>{company?.companyName}</T>
              <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                {company?.rating ? <Icon name="star.fill" size={12} c={c.star} /> : null}
                {company?.rating ? <T v="caption" c="ink3" weight="600">{company.rating.toFixed(1)}</T> : null}
                <T v="caption" c="ink2">{`· ${reviewsWord(company?.reviewsCount || reviews.length)} · ${cancelsWord(companyCancels)}`}</T>
              </View>
            </View>
            <Icon name="chevron.right" size={16} c="ink2" weight="semibold" style={{ opacity: 0.7 }} />
          </Card>

          <Card clip>
            <MiniMap lat={location?.lat} lng={location?.lng} pay={shift.pay} height={compact ? 74 : 104} />
            <View style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="rowTitle" style={{ fontSize: 15.5 }}>{location?.address || '—'}</T>
                {location?.hint || location?.name ? <T v="caption" c="ink2" style={{ marginTop: 2 }}>{`${location?.city || 'Минск'} · ${location.hint || location.name}`}</T> : null}
              </View>
              {location ? <Button title="Маршрут" size="sm" variant="secondary" onPress={() => openRoute(location)} /> : null}
            </View>
          </Card>

          <Card style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T v="bodyStrong" c="ink3">{full ? 'Места' : 'Мест осталось'}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <T v="moneyInline" style={{ fontSize: 15 }}>{full ? seatsWord(shift.spotsTaken, shift.spotsTotal) : `${left} из ${shift.spotsTotal}`}</T>
                {shift.spotsTotal <= 8 ? <SeatDots taken={shift.spotsTaken} total={shift.spotsTotal} size={9} /> : null}
              </View>
            </View>
            {reqs.length || shift.requirements?.other ? (
              <View style={{ marginTop: 11, paddingTop: 11, borderTopWidth: 1, borderTopColor: c.line }}>
                <T v="caption" c="ink2" weight="600">Что подходит</T>
                <View style={{ marginTop: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {reqs.map((r) => <Tag key={r.label} label={r.label} tone={r.tone} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9 }} />)}
                </View>
                {shift.requirements?.other ? <T v="caption" c="ink2" style={{ marginTop: 8 }}>{shift.requirements.other}</T> : null}
              </View>
            ) : null}
          </Card>

          {shift.description ? (
            <Card style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
              <T v="caption" c="ink2" weight="600">Задачи</T>
              <T v="body" style={{ marginTop: 6, fontSize: 15, lineHeight: 21 }}>{shift.description}</T>
            </Card>
          ) : null}

          {reviews.length ? (
            <>
              <SectionTitle
                title="Отзывы о компании"
                right={reviews.length > 2 ? `Все ${reviews.length}` : undefined}
                onRightPress={reviews.length > 2 ? () => navigation.navigate('PublicCompanyProfile', { companyId: shift.companyId }) : undefined}
                style={{ marginTop: 8 }}
              />
              {reviews.slice(0, 2).map((r) => (
                <Card key={r.id} flat radius={18} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Icon name="star.fill" size={12} c={c.star} />
                    <T v="bodyStrong">{Number(r.overallRating || 0).toFixed(1)}</T>
                    <T v="caption" c="ink2">{`· ${longDate(String(r.createdAt).slice(0, 10))}`}</T>
                  </View>
                  {r.text ? <T v="body" style={{ marginTop: 5, fontSize: 15, lineHeight: 21 }} numberOfLines={4}>{r.text}</T> : null}
                </Card>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* The one action of this screen, on the material, in thumb reach */}
      <Material style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 10 }}>
        {worked ? (
          myReview
            ? <View style={{ height: 54, alignItems: 'center', justifyContent: 'center' }}><StatusBadge state="done" label="Смена выполнена, оценка отправлена" /></View>
            : <Button title="Оценить смену" onPress={() => navigation.navigate('RateShift', { shiftId: shift.id })} />
        ) : over ? (
          <View style={{ height: 54, alignItems: 'center', justifyContent: 'center' }}><T v="bodyStrong" c="ink2">Смена уже прошла</T></View>
        ) : currentUser?.role === 'employer' ? (
          <View style={{ height: 54, alignItems: 'center', justifyContent: 'center' }}><T v="bodyStrong" c="ink2">Так смену видят исполнители</T></View>
        ) : status === 'rejected' ? (
          <Button title="Найти похожую смену" variant="secondary" onPress={() => navigation.navigate('Tabs', { screen: 'Shifts' })} />
        ) : (
          <ApplyButton state={phoneSheet ? 'idle' : shownState || derived} amount={shift.pay} title={shift.title} onPress={apply} note={note} />
        )}
      </Material>

      <PhoneSheet
        visible={phoneSheet}
        onClose={() => setPhoneSheet(false)}
        navigation={navigation}
        social={!currentUser}
        intent={currentUser ? { type: 'verify-phone', then: { type: 'apply', shiftId: shift.id } } : { type: 'apply', shiftId: shift.id }}
      />
    </View>
  );
}
