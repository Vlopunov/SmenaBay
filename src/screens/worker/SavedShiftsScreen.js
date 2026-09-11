// «Сохранённые смены» — screen 16. The same feed cards, past and cancelled
// ones dropped. The empty state names the next step with a real count, and
// the plate removes a dangerous misconception: a bookmark holds no seat.
import React, { useMemo } from 'react';
import { View, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Button } from '../../design/ui';
import { FeedCard } from '../../design/ShiftCard';
import { SkyView } from '../../design/Sky';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { showActions } from '../../design/ActionSheet';
import { shiftStart, plural } from '../../design/format';
import { visibleShifts } from './shiftFilters';
import useStore from '../../store/useStore';

const smena = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;

function SeatPlate({ style }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: 11, paddingVertical: 13, paddingHorizontal: 15, borderRadius: 15, backgroundColor: c.surface2 }, style]}>
      <Icon name="info.circle" size={19} c="brand" style={{ marginTop: 1 }} />
      <T v="caption" c="ink3" style={{ flex: 1, fontSize: 13.5, lineHeight: 19.5 }}>
        Сохранённая смена не занимает место. Чтобы место стало твоим, нужно откликнуться.
      </T>
    </View>
  );
}

export default function SavedShiftsScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const savedMap = useStore((s) => s.savedShifts);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const applications = useStore((s) => s.applications);
  const blocked = useStore((s) => s.blockedUsers);
  const getLocationById = useStore((s) => s.getLocationById);
  const toggleSavedShift = useStore((s) => s.toggleSavedShift);

  const saved = useMemo(() => {
    const ids = (me && savedMap[me.id]) || [];
    const now = new Date();
    return shifts
      .filter((s) => ids.includes(s.id) && s.status !== 'cancelled' && shiftStart(s) > now)
      .sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));
  }, [me, savedMap, shifts]);

  const mineOf = useMemo(() => {
    const out = {};
    if (!me) return out;
    applications.forEach((a) => {
      if (a.workerId !== me.id) return;
      if (a.status === 'pending') out[a.shiftId] = { state: 'pending', at: a.appliedAt };
      if (a.status === 'approved') out[a.shiftId] = { state: 'confirmed', at: a.respondedAt };
    });
    return out;
  }, [applications, me]);

  const openCount = useMemo(
    () => visibleShifts(shifts, blocked).filter((s) => s.spotsTaken < s.spotsTotal && s.status === 'active').length,
    [shifts, blocked],
  );
  const city = me?.city || 'Минск';
  const toFeed = () => navigation.navigate('Tabs', { screen: 'Shifts' });

  const unsave = (shift) => showActions({
    title: shift.title,
    options: [{
      label: 'Убрать из сохранённых',
      destructive: true,
      onPress: () => { haptic.selection(); toggleSavedShift(shift.id); toast.show({ text: 'Убрано из сохранённых', kind: 'info' }); },
    }],
  });

  const empty = (
    <View>
      <View style={{ marginTop: 96, alignItems: 'center', paddingHorizontal: 10 }}>
        <SkyView sky="day" radius={26} style={{ width: 78, height: 78, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="bookmark" size={38} c={t.sky('day').ink} weight="light" />
        </SkyView>
        <T v="titleScreen" style={{ marginTop: 18, fontSize: 21, lineHeight: 27, letterSpacing: -0.21, textAlign: 'center' }}>Пока ничего не сохранено</T>
        <T v="body" c="ink2" style={{ marginTop: 9, fontSize: 15, lineHeight: 22.5, textAlign: 'center' }}>
          Нажми закладку на экране смены — вернёшься к ней позже. Прошедшие смены отсюда исчезают.
        </T>
        <Button
          title={openCount ? `Смотреть ${smena(openCount)} в ${city === 'Минск' ? 'Минске' : 'городе'}` : 'Смотреть смены'}
          onPress={toFeed}
          style={{ marginTop: 20, alignSelf: 'stretch', minHeight: 52, borderRadius: 16 }}
        />
      </View>
      <SeatPlate style={{ marginTop: 32 }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" style={{ flex: 1 }} numberOfLines={1} accessibilityRole="header">Сохранённые смены</T>
      </View>
      <FlatList
        data={saved}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={saved.length ? (
          <T v="caption" c="ink2" style={{ marginBottom: 10 }}>{`${smena(saved.length)} впереди · прошедшие отсюда исчезают`}</T>
        ) : null}
        ListEmptyComponent={empty}
        ListFooterComponent={saved.length ? <SeatPlate style={{ marginTop: 16 }} /> : null}
        renderItem={({ item }) => (
          <FeedCard
            shift={item}
            company={companies.find((co) => co.id === item.companyId)}
            location={getLocationById(item.locationId)}
            mine={mineOf[item.id]?.state || null}
            appliedAt={mineOf[item.id]?.at}
            showDate
            onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.id })}
            onLongPress={() => unsave(item)}
          />
        )}
      />
    </View>
  );
}
