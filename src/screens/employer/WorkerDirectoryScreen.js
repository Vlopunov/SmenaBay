// Worker directory: search by name, filter by what people can do.
import React, { useMemo, useState } from 'react';
import { View, FlatList, TextInput, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, Separator, PersonAvatar, EmptyState, Chip } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { plural, presence } from '../../design/format';
import { WORKER_CATEGORIES } from '../../data/mockData';
import useStore from '../../store/useStore';

export default function WorkerDirectoryScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const workers = useStore((s) => s.workers);
  const applications = useStore((s) => s.applications);
  const blocked = useStore((s) => s.blockedUsers);
  const favMap = useStore((s) => s.favorites);
  const me = useStore((s) => s.currentUser);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return workers
      .filter((w) => !blocked.includes(w.id))
      .filter((w) => !cat || w.categories?.includes(cat))
      .filter((w) => !query || `${w.firstName} ${w.lastName}`.toLowerCase().includes(query))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [workers, blocked, q, cat]);
  const favs = (me && favMap[me.id]) || [];

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={(
          <>
            <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
              <T v="title" accessibilityRole="header">Исполнители</T>
              <T v="caption" c="secondary" style={{ marginTop: 2 }}>{list.length} {plural(list.length, ['человек', 'человека', 'человек'])}{cat ? ` · ${cat.toLowerCase()}` : ''}</T>
            </View>
            <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 36, borderRadius: 18, backgroundColor: c.fill, paddingHorizontal: 14 }}>
                <Icon name="magnifyingglass" size={15} c="tertiary" />
                <TextInput value={q} onChangeText={setQ} placeholder="Имя или фамилия" placeholderTextColor={c.labelTertiary} autoCorrect={false} clearButtonMode="while-editing" style={{ flex: 1, fontSize: 15, color: c.label, paddingVertical: 0 }} />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 22, paddingVertical: 14 }}>
              <Chip label="Все" selected={!cat} onPress={() => { haptic.selection(); setCat(null); }} />
              {WORKER_CATEGORIES.filter((x) => x !== 'Другое').map((x) => <Chip key={x} label={x} selected={cat === x} onPress={() => { haptic.selection(); setCat(cat === x ? null : x); }} />)}
            </ScrollView>
            <Separator />
          </>
        )}
        ListEmptyComponent={<EmptyState title="Никого не нашли" text={cat ? `Среди «${cat.toLowerCase()}» нет совпадений — попробуй без фильтра.` : 'Проверь написание имени.'} action={cat ? 'Показать всех' : undefined} onAction={() => setCat(null)} />}
        renderItem={({ item: w, index }) => {
          const cancels = applications.filter((a) => a.workerId === w.id && a.status === 'cancelled_by_worker').length;
          return (
            <View>
              <Press feedback="highlight" onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: w.id })}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 12 }}>
                  <PersonAvatar first={w.firstName} last={w.lastName} uri={w.avatar} size={44} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <T v="rowTitle" style={{ fontSize: 16, flexShrink: 1 }} numberOfLines={1}>{w.firstName} {w.lastName}</T>
                      {favs.includes(w.id) ? <Icon name="heart.fill" size={11} c="secondary" /> : null}
                    </View>
                    <T v="caption" c="secondary" numberOfLines={1}>★ {w.rating ? w.rating.toFixed(1) : '—'} · {w.shiftsCompleted} {plural(w.shiftsCompleted, ['смена', 'смены', 'смен'])} · {cancels ? `${cancels} ${plural(cancels, ['отмена', 'отмены', 'отмен'])}` : 'без отмен'}</T>
                    {w.categories?.length ? <T v="small" c="secondary" numberOfLines={1}>{w.categories.join(', ')}</T> : null}
                  </View>
                  <T v="small" c="secondary">{presence(w.lastSeen)}</T>
                </View>
              </Press>
              {index < list.length - 1 ? <Separator inset /> : null}
            </View>
          );
        }}
      />
    </View>
  );
}
