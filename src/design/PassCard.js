// The one card in the system: a confirmed shift has become a thing in hand.
// Everything else is a ledger line (design rule 1).
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import T from './Text';
import Icon from './Icon';
import { Monogram, StatusPill, Press } from './ui';
import { useTheme } from './theme';
import { countdown, dayLabel, shortDate, timeRange, hours, money } from './format';

/** Re-renders on a clock; the countdown is derived from the shift start. */
export function useNow(intervalMs = 10000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function TearLine({ notch }) {
  const { c } = useTheme();
  const half = notch / 2;
  const dot = {
    position: 'absolute', top: -half, width: notch, height: notch, borderRadius: half,
    backgroundColor: c.warmBg, borderWidth: 1, borderColor: c.warmSeparator,
  };
  return (
    <View style={{ height: 1, backgroundColor: c.warmSeparator }}>
      <View style={[dot, { left: -half }]} />
      <View style={[dot, { right: -half }]} />
    </View>
  );
}

export function Countdown({ shift, size = 'hero' }) {
  const now = useNow();
  const cd = countdown(shift, now);
  const hero = size === 'hero';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: hero ? 7 : 6 }} accessibilityLiveRegion="polite">
      <Icon name="timer" size={hero ? 19 : 15} c="label" weight="semibold" />
      <T v={hero ? 'countdown' : 'bodyStrong'} style={[{ flexShrink: 1 }, hero ? null : { lineHeight: 20 }]} numberOfLines={1}>{cd.text}</T>
    </View>
  );
}

export default function PassCard({ shift, company, location, variant = 'hero', onPress, onRoute }) {
  const { c } = useTheme();
  const hero = variant === 'hero';
  const card = (
    <View style={{
      backgroundColor: c.warmElevated,
      borderWidth: 1, borderColor: c.warmSeparator,
      borderRadius: hero ? 22 : 20,
      shadowColor: c.passShadow,
      shadowOpacity: hero ? 0.10 : 0.07,
      shadowRadius: hero ? 20 : 15,
      shadowOffset: { width: 0, height: hero ? 16 : 10 },
      elevation: 3,
    }}>
      <View style={{ paddingTop: hero ? 17 : 15, paddingHorizontal: hero ? 18 : 16, paddingBottom: hero ? 16 : 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: hero ? 10 : 9 }}>
          <Monogram name={company?.companyName} logo={company?.logo} size={hero ? 34 : 26} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T v={hero ? 'value' : 'caption'} c={hero ? 'label' : 'secondary'} style={hero ? { fontSize: 14, lineHeight: 19 } : { fontWeight: '500' }} numberOfLines={1}>
              {company?.companyName}
            </T>
            {hero && company?.rating ? (
              <T v="small" c="secondary" style={{ lineHeight: 16 }}>
                ★ {company.rating.toFixed(1)} · {company.reviewsCount} {company.reviewsCount % 10 === 1 && company.reviewsCount % 100 !== 11 ? 'отзыв' : 'отзывов'}
              </T>
            ) : null}
          </View>
          <StatusPill status="confirmed" />
        </View>

        <T v={hero ? 'passTitle' : 'rowTitle'} style={hero ? { marginTop: 16 } : { fontSize: 19, lineHeight: 24, letterSpacing: -0.5, marginTop: 11 }} numberOfLines={2}>
          {shift.title}
        </T>
        <View style={{ marginTop: hero ? 10 : 5 }}>
          <Countdown shift={shift} size={hero ? 'hero' : 'compact'} />
        </View>
        {!hero && location?.address ? <T v="caption" c="secondary" style={{ marginTop: 1 }}>{location.address}</T> : null}
      </View>

      <TearLine notch={hero ? 16 : 14} />

      <View style={{ paddingTop: hero ? 15 : 13, paddingHorizontal: hero ? 18 : 16, paddingBottom: hero ? 17 : 15, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
        {hero ? (
          <>
            <View style={{ flexShrink: 1 }}>
              <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>
                {dayLabel(shift.date) === 'Сегодня' ? `Сегодня, ${shortDate(shift.date)}` : dayLabel(shift.date) === 'Завтра' ? `Завтра, ${shortDate(shift.date)}` : shortDate(shift.date)}
              </T>
              <T v="countdown" style={{ fontWeight: '600', marginTop: 1 }}>
                {timeRange(shift)} <T v="rowTime" c="secondary">· {hours(shift.durationHours)}</T>
              </T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>К выплате</T>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <T v="sheetTitle" style={{ lineHeight: 28, letterSpacing: -0.9 }}>{money(shift.pay)}</T>
                <T v="caption" c="secondary" style={{ fontWeight: '600' }}>BYN</T>
              </View>
            </View>
          </>
        ) : (
          <>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <T v="sheetTitle" style={{ fontSize: 24, lineHeight: 26, letterSpacing: -0.9 }}>{money(shift.pay)}</T>
                <T v="caption" c="secondary" style={{ fontWeight: '600' }}>BYN</T>
              </View>
              <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400', marginTop: 2 }}>{timeRange(shift)} · {hours(shift.durationHours)}</T>
            </View>
            {onRoute ? (
              <Press onPress={onRoute} hitSlop={10} accessibilityLabel="Маршрут">
                <T v="bodyStrong" c="accent">Маршрут</T>
              </Press>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
  if (!onPress) return card;
  return <Press onPress={onPress} accessibilityLabel={`Подтверждённая смена ${shift.title}, ${countdown(shift).text}`}>{card}</Press>;
}
