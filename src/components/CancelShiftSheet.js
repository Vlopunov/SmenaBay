// Cancelling a confirmed shift (handoff screen 15). The sheet names every
// consequence by name — including the honest «no fine» — offers a better way
// out first, and keeps the destructive action as red text without a fill so
// it is not hit by accident.
import React from 'react';
import { View } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import Icon from '../design/Icon';
import { Button, Separator } from '../design/ui';
import { shiftStart, plural, dative } from '../design/format';

function Consequence({ icon, title, sub, last }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 12 }}>
        <Icon name={icon} size={16} c="label" style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <T v="value">{title}</T>
          <T v="small" c="secondary" style={{ marginTop: 1 }}>{sub}</T>
        </View>
      </View>
      {!last ? <Separator /> : null}
    </View>
  );
}

export default function CancelShiftSheet({ visible, onClose, shift, company, cancellations, hasNoCancelBadge, onWrite, onConfirm }) {
  if (!shift) return null;
  const hoursLeft = Math.max(0, Math.round((shiftStart(shift) - new Date()) / 3600000));
  const contact = company?.contactPerson?.split(' ')[0];
  const soon = hoursLeft < 24;
  const title = soon
    ? `Отменить смену за ${hoursLeft} ${plural(hoursLeft, ['час', 'часа', 'часов'])} до начала?`
    : 'Отменить подтверждённую смену?';
  const lead = soon
    ? `${contact || 'Заказчик'} уже рассчитывает на тебя, и заново закрыть место так быстро почти нереально.`
    : 'Место снова откроется, и заказчику придётся искать замену.';

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={{ paddingHorizontal: 22, paddingTop: 12 }}>
        <T v="sheetTitle">{title}</T>
        <T v="body" c="secondary" style={{ marginTop: 8 }}>{lead}</T>
        <Separator style={{ marginTop: 16 }} />
        <Consequence
          icon="star.fill"
          title={`Отмен в профиле станет ${cancellations + 1}`}
          sub="Заказчики видят это число в каждом твоём отклике"
        />
        {hasNoCancelBadge ? (
          <Consequence icon="checkmark.shield" title="Метка «Без отмен» пропадёт" sub="Её видят заказчики в списке откликов" />
        ) : null}
        <Consequence icon="creditcard" title="Денежного штрафа нет" sub="Платформа не списывает деньги за отмену" last />
      </View>
      <View style={{ paddingHorizontal: 22, paddingTop: 14, gap: 4 }}>
        <Button variant="secondary" icon="bubble.left" title={contact ? `Написать ${dative(contact)}` : 'Написать заказчику'} onPress={onWrite} />
        <Button variant="destructive" title="Всё равно отменить" onPress={onConfirm} />
      </View>
    </Sheet>
  );
}
