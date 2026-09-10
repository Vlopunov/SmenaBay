// Employer's shift line: a 72 pt time column (start over end) where the
// worker's feed has the money rail — for the employer the first question is
// «when», and it always sits in the same place.
import React from 'react';
import { View } from 'react-native';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, Separator, SeatsBar } from '../../design/ui';
import { dayLabel, shortDate, money, plural } from '../../design/format';

export default function ShiftTimeRow({ shift, approved, pending, onPress, last, muted, right }) {
  const d = dayLabel(shift.date);
  const day = d === 'Сегодня' || d === 'Завтра' || d === 'Вчера' ? d : shortDate(shift.date);
  const meta = [day, `${money(shift.pay)} BYN`, pending ? `${pending} ${plural(pending, ['отклик', 'отклика', 'откликов'])}` : null].filter(Boolean).join(' · ');
  return (
    <View>
      <Press feedback="highlight" onPress={onPress} accessibilityLabel={`${shift.title}, ${day}, ${shift.timeStart}–${shift.timeEnd}, ${approved} из ${shift.spotsTotal} мест`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14, opacity: muted ? 0.55 : 1 }}>
          <View style={{ width: 72 }}>
            <T v="rowTitle" style={{ letterSpacing: -0.2 }}>{shift.timeStart}</T>
            <T v="caption" c="secondary">{shift.timeEnd}</T>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <T v="rowTitle" numberOfLines={1} style={{ flexShrink: 1 }}>{shift.title}</T>
              {shift.urgent ? <Icon name="bolt.fill" size={11} c="label" /> : null}
            </View>
            <T v="caption" c="secondary" numberOfLines={1}>{meta}</T>
          </View>
          {right ?? (
            <View style={{ alignItems: 'flex-end', gap: 5 }}>
              <T v="smallStrong" style={{ fontWeight: '600' }}>{approved}/{shift.spotsTotal}</T>
              <SeatsBar taken={approved} total={shift.spotsTotal} width={shift.spotsTotal > 2 ? 40 : 30} />
            </View>
          )}
        </View>
      </Press>
      {!last ? <Separator inset /> : null}
    </View>
  );
}
