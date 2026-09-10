// Saved shifts — the same feed rows, past ones dropped.
import React, { useMemo } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { NavBar, Separator, EmptyState } from '../../design/ui';
import { FeedShiftRow } from '../../design/ShiftRow';
import { useTheme } from '../../design/theme';
import { shiftStart, plural } from '../../design/format';
import useStore from '../../store/useStore';

export default function SavedShiftsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const savedMap = useStore((s) => s.savedShifts);
  const shifts = useStore((s) => s.shifts);
  const companies = useStore((s) => s.companies);
  const getLocationById = useStore((s) => s.getLocationById);

  const saved = useMemo(() => {
    const ids = (me && savedMap[me.id]) || [];
    const now = new Date();
    return shifts
      .filter((s) => ids.includes(s.id) && s.status !== 'cancelled' && shiftStart(s) > now)
      .sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));
  }, [me, savedMap, shifts]);

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <FlatList
        data={saved}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={(
          <>
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 }}>
              <T v="title" accessibilityRole="header">Сохранённые</T>
              <T v="caption" c="secondary" style={{ marginTop: 2 }}>
                {saved.length ? `${saved.length} ${plural(saved.length, ['смена', 'смены', 'смен'])} впереди` : 'Прошедшие смены отсюда исчезают'}
              </T>
            </View>
            <Separator />
          </>
        )}
        ListEmptyComponent={<EmptyState title="Пока ничего не сохранено" text="Сохраняй смены из меню «···» на экране смены — вернуться к ним можно будет здесь." action="Смотреть смены" onAction={() => navigation.navigate('Tabs', { screen: 'Shifts' })} />}
        renderItem={({ item, index }) => (
          <FeedShiftRow
            shift={item}
            company={companies.find((co) => co.id === item.companyId)}
            location={getLocationById(item.locationId)}
            last={index === saved.length - 1}
            onPress={() => navigation.navigate('ShiftDetail', { shiftId: item.id })}
          />
        )}
      />
    </View>
  );
}
