// Cancelling a confirmed shift (screen 12). Consequences are listed
// honestly, including the mark in the profile. The main button is not the
// cancellation but a conversation — «Написать Андрею»; the cancellation
// itself is red text: not hidden, not hit by accident.
import React from 'react';
import { View } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import Icon from '../design/Icon';
import Money from '../design/Money';
import { Button, Press } from '../design/ui';
import { useTheme } from '../design/theme';
import { SkyBand } from '../design/ShiftCard';
import { skyKey } from '../design/Sky';
import { PersonMono } from '../design/Monogram';
import { dayLabel, timeRange, hours, plural, dative } from '../design/format';

function Line({ icon, color, children }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <Icon name={icon} size={16} c={color || 'ink2'} weight="semibold" style={{ marginTop: 3 }} />
      <T v="body" c="ink3" style={{ flex: 1, fontSize: 14.5, lineHeight: 21 }}>{children}</T>
    </View>
  );
}

export default function CancelShiftSheet({ visible, onClose, shift, company, location, cancellations = 0, hasNoCancelBadge, onWrite, onConfirm }) {
  const t = useTheme();
  if (!shift) return null;
  const contact = company?.contactPerson || '';
  const [first, last] = contact.split(' ');
  const next = cancellations + 1;
  return (
    <Sheet visible={visible} onClose={onClose} title="Отменить смену?">
      <View style={{ paddingHorizontal: 20 }}>
        <View style={[{ marginTop: 14, borderRadius: 18, overflow: 'hidden', backgroundColor: t.c.surface }, t.sh.e1]}>
          <SkyBand sky={skyKey(shift, { ignoreClosed: true })} text={`${dayLabel(shift.date)} · ${timeRange(shift)} · ${hours(shift.durationHours)}`} height={32} fontSize={12.5} />
          <View style={{ paddingTop: 10, paddingHorizontal: 13, paddingBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" style={{ fontSize: 15 }} numberOfLines={2}>{shift.title}</T>
              <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5 }} numberOfLines={1}>{[company?.companyName, location?.address].filter(Boolean).join(' · ')}</T>
            </View>
            <Money value={shift.pay} size="inline" style={{ fontSize: 17 }} />
          </View>
        </View>

        <T v="caption" c="ink2" weight="600" style={{ marginTop: 16 }}>Что изменится</T>
        <View style={{ marginTop: 9, gap: 9 }}>
          <Line icon="person.2">Место освободится, и его займёт другой человек.</Line>
          <Line icon="exclamationmark.triangle" color={t.c.warning}>
            В профиле станет <T v="body" weight="700" style={{ fontSize: 14.5 }}>{`${next} ${plural(next, ['отмена', 'отмены', 'отмен'])}`}</T> вместо {cancellations} — заказчики это видят.
          </Line>
          {hasNoCancelBadge ? <Line icon="checkmark.shield">Метка «Надёжный исполнитель» пропадёт.</Line> : null}
          <Line icon="banknote">{`Оплату ${shift.pay} BYN ты не получишь — смена не состоится.`}</Line>
        </View>

        {first ? (
          <View style={{ marginTop: 16, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.c.brandTint, flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <PersonMono first={first} last={last} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong" c="brand" style={{ fontSize: 14 }}>Не успеваешь или что-то поменялось?</T>
              <T v="caption" c="brand" style={{ marginTop: 2, fontSize: 12.5, opacity: 0.8 }}>{`Напиши ${dative(first)} — часто можно сдвинуть время`}</T>
            </View>
          </View>
        ) : null}

        <Button title={first ? `Написать ${dative(first)}` : 'Написать заказчику'} onPress={onWrite} style={{ marginTop: 12 }} />
        <Press onPress={onConfirm} hitSlop={10} style={{ alignSelf: 'center', marginTop: 14, paddingVertical: 4 }} accessibilityLabel="Всё равно отменить смену">
          <T v="bodyStrong" c="error" style={{ fontSize: 16 }}>Всё равно отменить смену</T>
        </Press>
      </View>
    </Sheet>
  );
}
