// Filters sheet (screen 3). The feed stays visible behind it, so it is
// clear what is being filtered. One-handle pay slider — «от» is what a
// person actually decides; the button always counts: «Показать 9 смен».
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Sheet from '../design/Sheet';
import T from '../design/Text';
import Slider from '../design/Slider';
import { Button, Chip, Switch, Press } from '../design/ui';
import { useTheme } from '../design/theme';
import { haptic } from '../design/haptics';
import { plural } from '../design/format';
import { EMPTY_FILTERS, PAY_MIN, PAY_MAX, WHEN, SKILLS, passes } from '../screens/worker/shiftFilters';

function WhenSegments({ value, onChange }) {
  const t = useTheme();
  const { c } = t;
  const items = [{ key: null, label: 'Любой день' }, ...WHEN];
  return (
    <View style={{ flexDirection: 'row', padding: 3, gap: 2, borderRadius: 12, backgroundColor: c.surface2, marginTop: 9 }}>
      {items.map((it) => {
        const on = (value || null) === it.key;
        return (
          <Press key={String(it.key)} outerStyle={{ flex: 1 }} onPress={() => { haptic.selection(); onChange(it.key); }} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <View style={[{ paddingVertical: 8, borderRadius: 9, alignItems: 'center', backgroundColor: on ? c.surface : 'transparent' }, on && { shadowColor: c.shadow, shadowOpacity: t.dark ? 0 : 0.14, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }]}>
              <T v="bodyStrong" c={on ? 'brand' : 'ink2'} numberOfLines={1} style={{ fontSize: 13.5, lineHeight: 17, fontWeight: on ? '600' : '500' }}>{it.label}</T>
            </View>
          </Press>
        );
      })}
    </View>
  );
}

const Label = ({ children, style }) => <T v="bodyStrong" c="ink3" style={[{ fontSize: 15 }, style]}>{children}</T>;

export default function FiltersSheet({ visible, onClose, value, onApply, pool }) {
  const [f, setF] = useState(value);
  useEffect(() => { if (visible) setF(value); }, [visible]);

  const count = pool.filter((s) => passes(s, f)).length;
  const toggle = (item) => {
    haptic.selection();
    setF((prev) => ({ ...prev, skills: prev.skills.includes(item) ? prev.skills.filter((x) => x !== item) : [...prev.skills, item] }));
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Фильтры" right="Сбросить" onRight={() => { haptic.selection(); setF(EMPTY_FILTERS); }}>
      <View style={{ paddingHorizontal: 20 }}>
        <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <Label>Оплата за смену</Label>
          <T v="moneyInline" style={{ fontSize: 15 }}>{f.minPay > PAY_MIN ? `от ${f.minPay} BYN` : 'любая'}</T>
        </View>
        <Slider
          min={PAY_MIN} max={PAY_MAX} step={5} value={f.minPay} fill="from"
          onChange={(v) => setF((p) => ({ ...p, minPay: v }))}
          accessibilityLabel="Оплата за смену, не меньше"
          formatValue={(v) => `от ${v} BYN`}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
          <T v="caption" c="ink2" style={{ fontSize: 11.5 }}>{PAY_MIN}</T>
          <T v="caption" c="ink2" style={{ fontSize: 11.5 }}>{PAY_MAX} BYN</T>
        </View>

        <Label style={{ marginTop: 18 }}>Когда</Label>
        <WhenSegments value={f.when[0]} onChange={(k) => setF((p) => ({ ...p, when: k ? [k] : [] }))} />

        <Label style={{ marginTop: 18 }}>Что подходит</Label>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }}>
          {SKILLS.map((s) => <Chip key={s.key} tone="soft" label={s.label} selected={f.skills.includes(s.key)} onPress={() => toggle(s.key)} />)}
        </View>

        <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <T v="body" style={{ fontSize: 16, lineHeight: 21, flex: 1 }}>Только срочные</T>
          <Switch value={f.urgentOnly} onValueChange={(v) => { haptic.light(); setF((p) => ({ ...p, urgentOnly: v })); }} accessibilityLabel="Только срочные" />
        </View>

        <Button
          style={{ marginTop: 20 }}
          title={count ? `Показать ${count} ${plural(count, ['смену', 'смены', 'смен'])}` : 'Под эти условия смен нет'}
          disabled={!count}
          onPress={() => { haptic.selection(); onApply(f); onClose(); }}
        />
      </View>
    </Sheet>
  );
}
