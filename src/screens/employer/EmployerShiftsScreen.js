// Employer's shifts: upcoming by day, then the past. The create button lives
// in the toolbar, not in the tab bar.
import React, { useMemo, useState } from 'react';
import { View, SectionList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { RoundButton, TextTabs, SectionHeader, Separator, EmptyState } from '../../design/ui';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { useTabBarSpace } from '../../design/TabBar';
import { daySection, plural, monthName, capitalize, parseDay } from '../../design/format';
import ShiftTimeRow from './ShiftTimeRow';
import { StatusText } from '../../design/ui';
import { employerSnapshot } from './employerData';
import useStore from '../../store/useStore';

export default function EmployerShiftsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const now = useNow(30000);
  const [tab, setTab] = useState('upcoming');
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const workers = useStore((s) => s.workers);
  const snap = useMemo(() => employerSnapshot({ me, shifts, applications, workers, now }), [me, shifts, applications, workers, now]);

  const sections = useMemo(() => {
    const list = tab === 'upcoming' ? snap.upcoming : snap.past;
    const groups = new Map();
    list.forEach((s) => {
      const key = tab === 'upcoming' ? daySection(s.date) : capitalize(monthName(parseDay(s.date)));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(s);
    });
    return [...groups.entries()].map(([title, data]) => ({ title, data }));
  }, [snap, tab]);

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <SectionList
        sections={sections}
        keyExtractor={(s) => s.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: tabSpace }}
        ListHeaderComponent={(
          <View>
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <T v="screenTitle" accessibilityRole="header">Смены</T>
                <T v="caption" c="secondary" style={{ marginTop: 2 }}>
                  {snap.pending ? `${snap.pending} ${plural(snap.pending, ['отклик ждёт', 'отклика ждут', 'откликов ждут'])} ответа` : `${snap.upcoming.length} ${plural(snap.upcoming.length, ['смена', 'смены', 'смен'])} впереди`}
                </T>
              </View>
              <View style={{ paddingTop: 4 }}>
                <RoundButton icon="plus" variant="accent" iconSize={18} onPress={() => navigation.navigate('CreateShift')} accessibilityLabel="Создать смену" />
              </View>
            </View>
            <TextTabs style={{ paddingTop: 18 }} items={[{ key: 'upcoming', label: 'Впереди' }, { key: 'past', label: 'Прошедшие' }]} value={tab} onChange={setTab} />
            <Separator style={{ marginTop: 9 }} />
          </View>
        )}
        ListEmptyComponent={tab === 'upcoming'
          ? <EmptyState title="Смен впереди нет" text="Опубликуй смену — она сразу появится в ленте у исполнителей." action="Создать смену" onAction={() => navigation.navigate('CreateShift')} />
          : <EmptyState title="Прошедших смен нет" text="Здесь будет история смен и оценки исполнителей." />}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} top={section.title !== sections[0]?.title} right={`${section.data.length}`} />}
        renderItem={({ item, index, section }) => (
          <ShiftTimeRow
            shift={item}
            approved={snap.approvedFor(item.id)}
            pending={tab === 'upcoming' ? snap.pendingFor(item.id) : 0}
            muted={item.status === 'cancelled'}
            last={index === section.data.length - 1}
            right={tab === 'past' ? <StatusText status={item.status === 'cancelled' ? 'cancelled' : 'done'} label={item.status === 'cancelled' ? 'Отменена' : `${snap.approvedFor(item.id)}/${item.spotsTotal}`} /> : undefined}
            onPress={() => navigation.navigate('ShiftManage', { shiftId: item.id })}
          />
        )}
      />
    </View>
  );
}
