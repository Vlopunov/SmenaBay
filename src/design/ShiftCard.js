// Shift cards. The sky band encodes the hour the shift starts; the
// category lives in a neutral pictogram tile; money is the best-set type
// on the card. Variants (Phase 3): normal · urgent · full · with my
// status · «как видят исполнители».
import React from 'react';
import { View } from 'react-native';
import T from './Text';
import Icon from './Icon';
import Money from './Money';
import { Card, Press } from './ui';
import { useTheme } from './theme';
import { SkyView, skyKey } from './Sky';
import { StatusBadge, SeatDots } from './Status';
import { CategoryTile, categoryOf } from './category';
import { rublesLabel } from './Money';
import { timeRange, hours, perHour, dayLabel, clock, shiftEnd } from './format';

export function seatsWord(taken, total) {
  const word = total % 10 === 1 && total % 100 !== 11 ? 'места' : 'мест';
  return `${taken} из ${total} ${word}`;
}

function Rating({ value }) {
  const { c } = useTheme();
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      <Icon name="star.fill" size={11} c={c.star} />
      <T v="caption" c="ink3" weight="600" style={{ fontSize: 13.5, lineHeight: 17 }}>{Number(value).toFixed(1)}</T>
    </View>
  );
}

/** Sky band: «10:00–18:00 · 8 ч» on the left, a badge on the right. */
export function SkyBand({ sky, text, right, height = 38, fontSize = 14 }) {
  const t = useTheme();
  const s = t.sky(sky);
  return (
    <SkyView sky={s} style={{ height, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}>
      <T v="bodyStrong" display weight="700" c={s.ink} style={{ fontSize, lineHeight: fontSize + 4 }} numberOfLines={1}>{text}</T>
      {/* A badge pins itself to flex-start; the wrapper centres it in the band. */}
      {right ? <View style={{ alignSelf: 'center' }}>{right}</View> : null}
    </SkyView>
  );
}

/** «Срочно» chip on a sky: urgent tint, bolt in urgent, text urgentInk. */
export function UrgentChip({ size = 'sm' }) {
  return <StatusBadge state="urgent" size={size} />;
}

/**
 * Feed card.
 * mine: 'pending' | 'confirmed' | null — the viewer's application state;
 * appliedAt — for «Отклик отправлен в 9:41»; preview — the employer's
 * «как видят исполнители» frame; compact — SE gutters.
 */
export function FeedCard({
  shift, company, location, onPress, onLongPress, mine, appliedAt, showDate, now = new Date(), style, preview,
}) {
  const t = useTheme();
  const { c } = t;
  const full = shift.status === 'filled' || shift.spotsTaken >= shift.spotsTotal;
  // A full shift is closed for others, but for the person confirmed on it
  // it is their shift ahead: it keeps its sky.
  const over = shift.status === 'cancelled' || shiftEnd(shift) < now;
  const sky = skyKey(shift, { now, ignoreClosed: mine === 'confirmed' && !over });
  const closed = sky === 'closed';
  const kind = categoryOf(shift, company);
  const when = `${showDate ? `${dayLabel(shift.date, now)} · ` : ''}${timeRange(shift)} · ${hours(shift.durationHours)}`;

  let badge = null;
  if (mine === 'pending') badge = <StatusBadge state="pending" size="sm" />;
  else if (mine === 'confirmed') badge = <StatusBadge state="confirmed" size="sm" />;
  else if (full) badge = <FullMark />;
  else if (shift.urgent) badge = <UrgentChip />;

  const sub = mine === 'pending' && appliedAt
    ? <T v="caption" c="ink2" style={{ fontSize: 13.5, lineHeight: 17 }}>Отклик отправлен в {clock(appliedAt)}</T>
    : (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        <T v="caption" c="ink2" style={{ fontSize: 13.5, lineHeight: 17, flexShrink: 1 }} numberOfLines={2}>
          {company?.companyName}
        </T>
        {!closed ? <Rating value={company?.rating} /> : company?.rating ? <T v="caption" c="ink2" style={{ fontSize: 13.5 }}>· ★ {company.rating.toFixed(1)}</T> : null}
      </View>
    );

  const a11y = `${shift.title}, ${company?.companyName || ''}${company?.rating ? `, рейтинг ${String(company.rating.toFixed(1)).replace('.', ',')}` : ''}. ${dayLabel(shift.date, now)} с ${shift.timeStart} до ${shift.timeEnd}, ${shift.durationHours} часов. ${rublesLabel(shift.pay)}. ${full ? 'Мест нет' : `Осталось ${shift.spotsTotal - shift.spotsTaken} из ${shift.spotsTotal}`}.${shift.urgent ? ' Срочно.' : ''}`;

  const card = (
    <Card
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityLabel={a11y}
      border={closed}
      clip
      style={[
        closed && { shadowOpacity: 0, opacity: 0.92 },
        mine === 'pending' && { borderWidth: 1.5, borderColor: c.urgent },
        style,
      ]}
    >
      <SkyBand sky={sky} text={when} right={badge} height={preview ? 34 : 38} fontSize={preview ? 13.5 : 14} />
      <View style={{ paddingTop: 12, paddingHorizontal: 14, paddingBottom: 13 }}>
        <View style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start' }}>
          {!preview ? <CategoryTile kind={kind} muted={closed} /> : null}
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v="rowTitle" c={closed ? 'ink3' : 'ink'} numberOfLines={2}>{shift.title}</T>
            <View style={{ marginTop: 2 }}>{sub}</View>
          </View>
        </View>
        <View style={{ marginTop: 11, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Money value={shift.pay} size="card" c={closed ? 'ink2' : 'ink'} />
            {!closed ? <T v="caption" c="ink2" style={{ fontSize: 12.5 }}>{perHour(shift)}</T> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T v="caption" c="ink2" weight="500" style={{ fontSize: 12.5 }}>{seatsWord(shift.spotsTaken, shift.spotsTotal)}</T>
            {!closed && shift.spotsTotal <= 8 ? <SeatDots taken={shift.spotsTaken} total={shift.spotsTotal} mine={mine === 'confirmed' ? 1 : 0} /> : null}
          </View>
        </View>
      </View>
    </Card>
  );

  if (!preview) return card;
  return (
    <View style={{ padding: 7, borderRadius: 26, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong }}>
      {card}
      <T v="badge" c="ink2" style={{ textAlign: 'center', marginTop: 6, fontSize: 10.5, fontWeight: '600', letterSpacing: 0 }}>Предпросмотр для заказчика</T>
    </View>
  );
}

export function FullMark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon name="nosign" size={12} c="ink2" weight="bold" />
      <T v="badge" c="ink3">Мест нет</T>
    </View>
  );
}

/**
 * Compact list row (Мои смены «Ждут ответа», history): sky tile · title ·
 * sub · money inline and a coloured status line on the right.
 */
export function ShiftLine({ shift, title, sub, onPress, statusText, statusC = 'ink2', tile = true, money = true, style, right }) {
  const t = useTheme();
  const sky = skyKey(shift, { ignoreClosed: true });
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
      {tile ? <SkyView sky={sky} radius={12} style={{ width: 38, height: 38 }} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="rowTitle" style={{ fontSize: 15.5, lineHeight: 19 }} numberOfLines={2}>{title || shift.title}</T>
        {sub ? <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }} numberOfLines={2}>{sub}</T> : null}
      </View>
      {right || (
        <View style={{ alignItems: 'flex-end' }}>
          {money ? <Money value={shift.pay} size="inline" /> : null}
          {statusText ? <T v="badge" c={statusC} style={{ marginTop: 4, fontSize: 11.5, lineHeight: 13, fontWeight: '600', letterSpacing: 0 }}>{statusText}</T> : null}
        </View>
      )}
    </View>
  );
  return onPress
    ? <Card flat radius={18} onPress={onPress} style={style}>{content}</Card>
    : <Card flat radius={18} style={style}>{content}</Card>;
}

/** Map preview in the sheet: band + title + money and a brand arrow. */
export function MapPreviewCard({ shift, company, onPress, now = new Date() }) {
  const t = useTheme();
  const sky = skyKey(shift, { now });
  const s = t.sky(sky);
  return (
    <Card onPress={onPress} radius={22} clip style={t.sh.e2} accessibilityLabel={`${shift.title}, ${rublesLabel(shift.pay)}. Открыть смену`}>
      <SkyBand sky={sky} text={`${timeRange(shift)} · ${hours(shift.durationHours)}`} height={34} fontSize={13.5}
        right={<T v="badge" c={s.ink} style={{ fontSize: 11.5, opacity: 0.85 }}>{s.label}</T>} />
      <View style={{ paddingTop: 11, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="rowTitle" numberOfLines={1}>{shift.title}</T>
          <T v="caption" c="ink2" style={{ marginTop: 2 }} numberOfLines={1}>{company?.companyName}{company?.rating ? ` · ★ ${company.rating.toFixed(1)}` : ''}</T>
          <View style={{ marginTop: 7, flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
            <Money value={shift.pay} size="card" fontSize={26} />
            <T v="caption" c="ink2" style={{ fontSize: 12.5 }}>{perHour(shift)}</T>
          </View>
        </View>
        <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: t.c.brand, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron.right" size={20} c="onBrand" weight="bold" />
        </View>
      </View>
    </Card>
  );
}
