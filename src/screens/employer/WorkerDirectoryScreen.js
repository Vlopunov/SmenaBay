// «Каталог исполнителей» — screen 33. First the people who already worked
// for this company — the only reliable signal — then everyone. «Новичок»
// is not a verdict: it sits next to the name and the shift count, and the
// employer decides.
import React, { useMemo, useState } from 'react';
import { View, FlatList, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Press, SearchField, EmptyState, Card, Divider } from '../../design/ui';
import { PersonMono } from '../../design/Monogram';
import { Pictogram, categoryFromSkill, CATEGORY_LABEL } from '../../design/category';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { plural, shiftEnd } from '../../design/format';
import useStore from '../../store/useStore';

const KINDS = Object.keys(CATEGORY_LABEL);
const kindsOf = (w) => [...new Set((w.categories || []).map(categoryFromSkill).filter(Boolean))];
const shiftsWord = (n) => `${n} ${plural(n, ['смена', 'смены', 'смен'])}`;

/** Category chip: selected = brand fill with the pictogram, otherwise surface + line. */
function KindChip({ label, kind, selected, onPress }) {
  const { c } = useTheme();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      hitSlop={{ top: 5, bottom: 5 }}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 34, borderRadius: 11, borderWidth: 1,
        paddingVertical: 7, paddingLeft: selected && kind ? 9 : 11, paddingRight: selected ? 12 : 11,
        backgroundColor: selected ? c.brand : c.surface, borderColor: selected ? c.brand : c.line,
      }}
    >
      {selected && kind ? <Pictogram kind={kind} size={16} color={c.onBrand} /> : null}
      <T v="bodyStrong" c={selected ? 'onBrand' : 'ink3'} weight={selected ? '600' : '500'} style={{ fontSize: 13.5, lineHeight: 17 }}>{label}</T>
    </Press>
  );
}

export default function WorkerDirectoryScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
  const workers = useStore((s) => s.workers);
  const shifts = useStore((s) => s.shifts);
  const applications = useStore((s) => s.applications);
  const blocked = useStore((s) => s.blockedUsers);
  const favMap = useStore((s) => s.favorites);
  const me = useStore((s) => s.currentUser);
  const [q, setQ] = useState('');
  const [kind, setKind] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const city = me?.city || 'Минск';
  const favs = (me && favMap[me.id]) || [];

  const visible = useMemo(() => workers.filter((w) => !blocked.includes(w.id)), [workers, blocked]);
  const inCity = visible.filter((w) => (w.city || city) === city).length;

  // Categories that someone actually has, the most common first.
  const kinds = useMemo(() => {
    const n = {};
    visible.forEach((w) => kindsOf(w).forEach((k) => { n[k] = (n[k] || 0) + 1; }));
    return KINDS.filter((k) => n[k]).sort((a, b) => n[b] - n[a] || KINDS.indexOf(a) - KINDS.indexOf(b));
  }, [visible]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visible
      .filter((w) => !kind || kindsOf(w).includes(kind))
      .filter((w) => {
        if (!query) return true;
        const hay = [w.firstName, w.lastName, ...(w.categories || []), ...kindsOf(w).map((k) => CATEGORY_LABEL[k])].join(' ').toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [visible, q, kind]);

  // Worked here: approved on this company's shifts that have ended.
  const worked = useMemo(() => {
    const now = new Date();
    const own = new Map(shifts.filter((s) => s.companyId === me?.id).map((s) => [s.id, s]));
    const n = {};
    applications.forEach((a) => {
      const s = own.get(a.shiftId);
      if (a.status === 'approved' && s && shiftEnd(s) <= now) n[a.workerId] = (n[a.workerId] || 0) + 1;
    });
    return list.filter((w) => n[w.id]).sort((a, b) => n[b.id] - n[a.id] || (b.rating || 0) - (a.rating || 0));
  }, [list, shifts, applications, me?.id]);

  const pickKind = (k) => { haptic.selection(); setKind(kind === k ? null : k); };
  const shownKinds = expanded ? kinds : kinds.slice(0, 3);
  const open = (w) => navigation.navigate('PublicWorkerProfile', { workerId: w.id });

  const header = (
    <View style={{ paddingBottom: 10 }}>
      <View style={{ paddingTop: insets.top + 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} iconSize={20} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="titleScreen" accessibilityRole="header" style={{ fontSize: 30, lineHeight: 35, letterSpacing: -0.6 }}>Каталог</T>
        </View>
      </View>
      <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 13.5, lineHeight: 18 }}>{`${city} · ${inCity} ${plural(inCity, ['исполнитель', 'исполнителя', 'исполнителей'])}`}</T>
      <SearchField value={q} onChangeText={setQ} placeholder="Имя или что умеет" style={{ marginTop: 14 }} />
      {kinds.length ? (
        <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {shownKinds.map((k) => <KindChip key={k} kind={k} label={CATEGORY_LABEL[k]} selected={kind === k} onPress={() => pickKind(k)} />)}
          {!expanded && kinds.length > 3 ? <KindChip label={`Ещё ${kinds.length - 3}`} onPress={() => { haptic.selection(); setExpanded(true); }} /> : null}
        </View>
      ) : null}

      {worked.length ? (
        <>
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
            <T v="titleSection" style={{ fontSize: 17, lineHeight: 20 }} accessibilityRole="header">Работали у тебя</T>
            <T v="caption" c="ink2" style={{ fontSize: 12.5 }}>{worked.length}</T>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -g, marginTop: 6, marginBottom: -10 }}
            contentContainerStyle={{ gap: 9, paddingHorizontal: g, paddingTop: 4, paddingBottom: 14 }}
          >
            {worked.map((w) => (
              <Press
                key={w.id}
                onPress={() => open(w)}
                scaleTo={0.96}
                accessibilityLabel={`${w.firstName} ${w.lastName}, рейтинг ${w.rating ? w.rating.toFixed(1) : 'нет'}, ${shiftsWord(w.shiftsCompleted || 0)}`}
                style={[{ width: 104, backgroundColor: c.surface, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: c.line }]}
              >
                <PersonMono first={w.firstName} last={w.lastName} uri={w.avatar} size={46} />
                <T v="bodyStrong" numberOfLines={2} style={{ marginTop: 8, fontSize: 12.5, lineHeight: 15.5, textAlign: 'center' }}>{`${w.firstName}\n${w.lastName}`}</T>
                <T v="caption" c="ink2" numberOfLines={1} style={{ marginTop: 4, fontSize: 11, lineHeight: 13 }}>{`★ ${w.rating ? w.rating.toFixed(1) : '—'} · ${w.shiftsCompleted || 0}`}</T>
              </Press>
            ))}
          </ScrollView>
        </>
      ) : null}

      {list.length ? (
        <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <T v="titleSection" style={{ fontSize: 17, lineHeight: 20 }} accessibilityRole="header">Все исполнители</T>
          {q.trim() || kind ? <T v="caption" c="ink2" style={{ fontSize: 12.5 }}>{list.length}</T> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: g, paddingBottom: insets.bottom + 30 }}
        ListHeaderComponent={header}
        ListEmptyComponent={(
          <Card style={{ marginTop: 6 }}>
            <EmptyState
              icon="magnifyingglass"
              tone="neutral"
              title="Никого не нашли"
              text={kind ? `Среди «${CATEGORY_LABEL[kind]}» нет совпадений — попробуй без фильтра.` : 'Проверь написание имени или навыка.'}
              action={kind || q.trim() ? 'Показать всех' : undefined}
              actionVariant="secondary"
              onAction={() => { setKind(null); setQ(''); }}
            />
          </Card>
        )}
        renderItem={({ item: w, index }) => {
          const first = index === 0;
          const last = index === list.length - 1;
          const n = w.shiftsCompleted || 0;
          const skills = kindsOf(w).slice(0, 2).map((k) => CATEGORY_LABEL[k]);
          const sub = [`★ ${w.rating ? w.rating.toFixed(1) : '—'}`, shiftsWord(n), ...skills, w.city && w.city !== city ? w.city : null].filter(Boolean).join(' · ');
          const r = 18;
          return (
            <Press
              feedback="highlight"
              onPress={() => open(w)}
              accessibilityLabel={`${w.firstName} ${w.lastName}${w.badges?.includes('newbie') ? ', новичок' : ''}, ${sub.replace('★', 'рейтинг')}`}
              style={{
                backgroundColor: c.surface, overflow: 'hidden', borderColor: c.line,
                borderLeftWidth: 1, borderRightWidth: 1, borderTopWidth: first ? 1 : 0, borderBottomWidth: last ? 1 : 0,
                borderTopLeftRadius: first ? r : 0, borderTopRightRadius: first ? r : 0,
                borderBottomLeftRadius: last ? r : 0, borderBottomRightRadius: last ? r : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 13 }}>
                <PersonMono first={w.firstName} last={w.lastName} uri={w.avatar} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <T v="rowTitle" numberOfLines={1} style={{ flexShrink: 1, fontSize: 15, lineHeight: 19 }}>{w.firstName} {w.lastName}</T>
                    {favs.includes(w.id) ? <Icon name="heart.fill" size={11} c="ink2" /> : null}
                    {w.badges?.includes('newbie') ? (
                      <View style={{ paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6, backgroundColor: c.surface2 }}>
                        <T v="badge" c="ink3" style={{ fontSize: 10, lineHeight: 12, letterSpacing: 0 }}>Новичок</T>
                      </View>
                    ) : null}
                  </View>
                  <T v="caption" c="ink2" numberOfLines={1} style={{ marginTop: 2, fontSize: 12, lineHeight: 15.5 }}>{sub}</T>
                </View>
                <Icon name="chevron.right" size={14} c="ink2" weight="semibold" style={{ opacity: 0.6 }} />
              </View>
              {!last ? <Divider inset={13} /> : null}
            </Press>
          );
        }}
      />
    </View>
  );
}
