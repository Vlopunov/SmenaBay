// Filters sheet. The button names the result as a number («Показать 9 смен»),
// so there is no surprise after closing. Active chips are ink, not accent:
// the accent is already taken by the button and the slider.
import React, { useEffect, useState } from 'react';
import { View, Switch } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import Slider from '../design/Slider';
import { Button, Chip, Separator } from '../design/ui';
import { useTheme } from '../design/theme';
import { haptic } from '../design/haptics';
import { plural } from '../design/format';
import { EMPTY_FILTERS, PAY_MIN, PAY_MAX, WHEN, SKILLS, passes } from '../screens/worker/shiftFilters';

export default function FiltersSheet({ visible, onClose, value, onApply, pool }) {
  const { c } = useTheme();
  const [f, setF] = useState(value);
  useEffect(() => { if (visible) setF(value); }, [visible]);

  const count = pool.filter((s) => passes(s, f)).length;
  const toggle = (key, item) => {
    haptic.selection();
    setF((prev) => ({ ...prev, [key]: prev[key].includes(item) ? prev[key].filter((x) => x !== item) : [...prev[key], item] }));
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Фильтры" right="Сбросить" onRight={() => { haptic.selection(); setF(EMPTY_FILTERS); }}>
      <Separator style={{ marginTop: 10 }} />
      <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <T v="section" c="secondary">Оплата за смену, не меньше</T>
          <T v="rowTitle" style={{ letterSpacing: 0 }}>{f.minPay} BYN</T>
        </View>
        <Slider
          min={PAY_MIN} max={PAY_MAX} step={5} value={f.minPay} thumb={22}
          onChange={(v) => setF((p) => ({ ...p, minPay: v }))}
          accessibilityLabel="Оплата за смену, не меньше"
          formatValue={(v) => `${v} BYN`}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
          <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>{PAY_MIN}</T>
          <T v="label" c="secondary" style={{ fontSize: 11.5, fontWeight: '400' }}>{PAY_MAX}</T>
        </View>
      </View>

      <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 22 }}>Когда</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingTop: 11 }}>
        {WHEN.map((w) => <Chip key={w.key} tone="sheet" label={w.label} selected={f.when.includes(w.key)} onPress={() => toggle('when', w.key)} />)}
      </View>

      <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 22 }}>Что подходит</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingTop: 11 }}>
        {SKILLS.map((s) => <Chip key={s.key} tone="sheet" label={s.label} selected={f.skills.includes(s.key)} onPress={() => toggle('skills', s.key)} />)}
      </View>

      <Separator inset style={{ marginTop: 20 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <T v="value" style={{ fontSize: 16, lineHeight: 21 }}>Только срочные</T>
          <T v="caption" c="secondary">Заказчик отметил, что человек нужен срочно</T>
        </View>
        <Switch
          value={f.urgentOnly}
          onValueChange={(v) => { haptic.selection(); setF((p) => ({ ...p, urgentOnly: v })); }}
          trackColor={{ true: c.accent, false: c.fillSecondary }}
          ios_backgroundColor={c.fillSecondary}
          accessibilityLabel="Только срочные"
        />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Button
          title={count ? `Показать ${count} ${plural(count, ['смену', 'смены', 'смен'])}` : 'Под эти условия смен нет'}
          disabled={!count}
          onPress={() => { onApply(f); onClose(); }}
        />
      </View>
    </Sheet>
  );
}
