// «Свои люди»: workers the employer marked. Opened with `inviteShiftId`, every
// line gets «Позвать» for that shift.
import React, { useMemo, useState } from 'react';
import { View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import { NavBar, Press, Separator, PersonAvatar, EmptyState, Button } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, dayLabel, shortDate, timeRange } from '../../design/format';
import useStore from '../../store/useStore';

export default function FavoritesScreen({ route, navigation }) {
  const inviteShiftId = route?.params?.inviteShiftId;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const favMap = useStore((s) => s.favorites);
  const workers = useStore((s) => s.workers);
  const applications = useStore((s) => s.applications);
  const invitations = useStore((s) => s.invitations);
  const blocked = useStore((s) => s.blockedUsers);
  const shift = useStore((s) => (inviteShiftId ? s.getShiftById(inviteShiftId) : null));
  const invite = useStore((s) => s.inviteWorkerToShift);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [sent, setSent] = useState({});

  const people = useMemo(() => {
    const ids = (me && favMap[me.id]) || [];
    return workers.filter((w) => ids.includes(w.id) && !blocked.includes(w.id));
  }, [me, favMap, workers, blocked]);

  const cancelsOf = (id) => applications.filter((a) => a.workerId === id && a.status === 'cancelled_by_worker').length;
  const invited = (id) => sent[id] || invitations.some((i) => i.workerId === id && i.shiftId === inviteShiftId);
  const applied = (id) => applications.some((a) => a.workerId === id && a.shiftId === inviteShiftId && a.status !== 'cancelled_by_worker');

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <FlatList
        data={people}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={(
          <>
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 }}>
              <T v="title" accessibilityRole="header">{inviteShiftId ? 'Позвать своих' : 'Свои люди'}</T>
              <T v="caption" c="secondary" style={{ marginTop: 2 }}>
                {shift ? `${shift.title} · ${dayLabel(shift.date) === 'Сегодня' || dayLabel(shift.date) === 'Завтра' ? dayLabel(shift.date).toLowerCase() : shortDate(shift.date)}, ${timeRange(shift)}` : 'Исполнители, которых ты отметил — зови их первыми'}
              </T>
            </View>
            <Separator />
          </>
        )}
        ListEmptyComponent={(
          <EmptyState
            title="Своих людей пока нет"
            text="Отмечай сердцем тех, кто хорошо отработал, — потом их можно позвать на смену в одно касание."
            action="Открыть каталог"
            onAction={() => navigation.navigate('WorkerDirectory')}
          />
        )}
        renderItem={({ item: w, index }) => {
          const cancels = cancelsOf(w.id);
          return (
            <View>
              <Press
                feedback="highlight"
                onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}
                onLongPress={() => showActions({ title: `${w.firstName} ${w.lastName}`, options: [{ label: 'Убрать из своих', destructive: true, onPress: () => { toggleFavorite(w.id); haptic.medium(); } }] })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                  <PersonAvatar first={w.firstName} last={w.lastName} uri={w.avatar} size={44} />
                  <View style={{ flex: 1 }}>
                    <T v="rowTitle" style={{ fontSize: 16 }}>{w.firstName} {w.lastName}</T>
                    <T v="caption" c="secondary" numberOfLines={1}>★ {w.rating ? w.rating.toFixed(1) : '—'} · {w.shiftsCompleted} {plural(w.shiftsCompleted, ['смена', 'смены', 'смен'])} · {cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен'}</T>
                  </View>
                  {inviteShiftId ? (
                    applied(w.id) ? <T v="caption" c="secondary">Откликнулся</T>
                      : invited(w.id) ? <T v="caption" c="secondary">Позвали</T>
                        : <Button title="Позвать" size="sm" onPress={() => { invite(w.id, inviteShiftId); setSent((x) => ({ ...x, [w.id]: true })); haptic.success(); }} />
                  ) : null}
                </View>
              </Press>
              {index < people.length - 1 ? <Separator inset /> : null}
            </View>
          );
        }}
      />
    </View>
  );
}
