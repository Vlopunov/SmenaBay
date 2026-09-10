// The unit of every shift list. Money sits on a 72 pt rail on the left —
// the worker's first question is «how much», and the answer is always in
// the same spot. Then time, then place (design rules 2 and 5).
import React from 'react';
import { View } from 'react-native';
import T from './Text';
import Icon from './Icon';
import { Press, Separator } from './ui';
import { useTheme } from './theme';
import { money, perHour, timeRange, hours, seats } from './format';

// Sized by length rather than adjustsFontSizeToFit: on the New Architecture a
// recycled list row can come back shrunk far below minimumFontScale.
const RAIL_SIZE = { 3: null, 4: { fontSize: 26, letterSpacing: -1.2 }, 5: { fontSize: 23, letterSpacing: -1 } };

export function MoneyRail({ amount, sub, muted, width = 72 }) {
  const text = money(amount);
  const fit = text.length <= 3 ? null : RAIL_SIZE[text.length] || { fontSize: 20, letterSpacing: -0.8 };
  return (
    <View style={{ width, alignItems: 'flex-end' }}>
      <T v="moneyRail" c={muted ? 'secondary' : 'label'} numberOfLines={1} maxFontSizeMultiplier={text.length > 3 ? 1.1 : undefined} style={fit}>{text}</T>
      <T v="unit" c="secondary">BYN</T>
      {sub ? <T v="label" c="secondary" style={{ marginTop: 4 }} numberOfLines={1}>{sub}</T> : null}
    </View>
  );
}

export default function ShiftRow({
  amount, perHourText, title, urgent,
  line2, line2Right, line3, line3Right,
  onPress, selected, unavailable, muted, last, warm, accessibilityLabel,
}) {
  const { c } = useTheme();
  const body = (
    <View style={[
      { flexDirection: 'row', gap: 14, paddingHorizontal: 22, paddingTop: 15, paddingBottom: 16 },
      selected && { backgroundColor: c.fill },
      unavailable && { opacity: 0.45 },
    ]}>
      <MoneyRail amount={amount} sub={perHourText} muted={muted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T v="rowTitle" c={muted ? 'secondary' : 'label'} numberOfLines={1} style={{ flexShrink: 1 }}>{title}</T>
          {urgent ? <Icon name="bolt.fill" size={11} c={muted ? 'secondary' : 'label'} accessibilityLabel="срочно" /> : null}
        </View>
        {line2 || line2Right ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginTop: 3 }}>
            <T v="rowTime" c={muted ? 'secondary' : 'label'} numberOfLines={1} style={{ flexShrink: 1 }}>{line2}</T>
            {typeof line2Right === 'string' ? <T v="smallStrong" c="secondary">{line2Right}</T> : line2Right}
          </View>
        ) : null}
        {line3 || line3Right ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginTop: 2 }}>
            <T v="caption" c="secondary" numberOfLines={1} style={{ flex: 1 }}>{line3}</T>
            {typeof line3Right === 'string' ? <T v="caption" c="secondary">{line3Right}</T> : line3Right}
          </View>
        ) : null}
      </View>
    </View>
  );
  return (
    <View>
      {onPress ? (
        <Press onPress={onPress} feedback="highlight" accessibilityLabel={accessibilityLabel}>{body}</Press>
      ) : body}
      {!last ? <Separator inset warm={warm} /> : null}
    </View>
  );
}

/** Rating on the right edge: star 10 pt + number in secondary. */
export function RatingMark({ value }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon name="star.fill" size={10} c="secondary" />
      <T v="caption" c="secondary" style={{ fontWeight: '500' }}>{Number(value).toFixed(1)}</T>
    </View>
  );
}

/** «Мест нет» with its symbol — the unavailable row keeps its place in the list. */
export function FullMark() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name="person.slash" size={11} c="secondary" />
      <T v="smallStrong" c="secondary">Мест нет</T>
    </View>
  );
}

/** Feed row built straight from store objects. */
export function FeedShiftRow({ shift, company, location, onPress, selected, last, showRating = true }) {
  const full = shift.spotsTaken >= shift.spotsTotal || shift.status === 'filled';
  const place = [company?.companyName, location?.address].filter(Boolean).join(' · ');
  return (
    <ShiftRow
      amount={shift.pay}
      perHourText={perHour(shift)}
      title={shift.title}
      urgent={shift.urgent && !full}
      line2={`${timeRange(shift)} · ${hours(shift.durationHours)}`}
      line2Right={full ? <FullMark /> : seats(shift.spotsTaken, shift.spotsTotal)}
      line3={place}
      line3Right={showRating ? <RatingMark value={company?.rating} /> : null}
      unavailable={full}
      selected={selected}
      onPress={onPress}
      last={last}
      accessibilityLabel={`${shift.title}, ${shift.pay} BYN, ${timeRange(shift)}, ${place}${full ? ', мест нет' : ''}`}
    />
  );
}
