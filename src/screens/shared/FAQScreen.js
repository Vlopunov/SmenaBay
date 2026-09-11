// Help (screen 22): questions split by role and written in people's words,
// real contacts without promised response times, and the legal documents
// a reviewer must be able to reach from inside the app.
import React, { useMemo, useState } from 'react';
import { View, ScrollView, LayoutAnimation, Platform, UIManager, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Press, SearchField, Divider } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { LINKS, openLink } from '../../constants/links';
import useStore from '../../store/useStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// app.json → expo.version; expo-constants is not used in this project.
const APP_VERSION = 'СменаБел 1.0.0';
const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

const WORKER = [
  { q: 'Когда и как мне заплатят?', a: 'Платит заказчик — напрямую, после смены. Сумма указана в карточке смены. Приложение деньги не принимает и не переводит, поэтому как именно заплатят — наличными или переводом — уточни у заказчика в чате, когда смену подтвердят.' },
  { q: 'Что делать, если смену отменили?', a: 'Тебе придёт уведомление. Отмены заказчика видны всем в профиле компании. Подходящую замену ищи в ленте «Смены».' },
  { q: 'Нужна ли медкнижка?', a: 'Зависит от смены — это написано в требованиях. В фильтрах есть «Без медкнижки», чтобы видеть только подходящие смены.' },
  { q: 'Почему мой отклик не приняли?', a: 'Заказчик выбирает сам и не обязан объяснять причину — например, места могли закончиться раньше. В отклике он видит твой рейтинг, число смен и отмен, поэтому смены без отмен помогают.' },
  { q: 'Как откликнуться на смену?', a: 'Открой смену и нажми «Откликнуться». Если ты ещё не входил, приложение спросит номер и пришлёт код — это одна минута. Заказчик увидит отклик сразу.' },
  { q: 'Когда придёт ответ?', a: 'Как только заказчик подтвердит или отклонит отклик, ответ появится в уведомлениях, а подтверждённая смена — в «Моих сменах» с обратным отсчётом.' },
  { q: 'Можно ли отменить?', a: 'Отклик можно отозвать в меню «···» на экране смены. Подтверждённую смену тоже можно отменить — денежного штрафа нет, но отмена будет видна заказчикам в твоём профиле.' },
  { q: 'Как считается рейтинг?', a: 'После каждой смены заказчик ставит оценку. Рейтинг — среднее всех оценок, его видно в каждом отклике.' },
];

const EMPLOYER = [
  { q: 'Как опубликовать смену?', a: 'На «Сводке» нажми круглую кнопку «+» вверху. Форма начинается с оплаты — от неё больше всего зависит, закроется ли смена.' },
  { q: 'Что делать, если никто не откликается?', a: 'Проверь оплату — от неё больше всего зависит, закроется ли смена. Отметь смену срочной: она попадёт во вкладку «Срочные» и получит метку. Ещё можно позвать своих людей или найти исполнителя в каталоге.' },
  { q: 'Как платить исполнителям?', a: 'Напрямую, после смены — наличными или переводом, как договоритесь. Приложение деньги не принимает и не переводит. Плати ту сумму, что указана в смене: её видел исполнитель, когда откликался.' },
  { q: 'Как выбрать исполнителя?', a: 'Открой смену → «Отклики». У каждого видно рейтинг, число смен и отмен. Подтверди — исполнитель получит уведомление, и откроется чат.' },
  { q: 'Можно ли отменить смену?', a: 'Да, в меню «···» на экране смены. Все, кто откликнулся, получат уведомление. Частые отмены видны исполнителям в профиле точки.' },
  { q: 'Сколько смен можно публиковать?', a: 'Лимит зависит от тарифа — он указан в «Профиль → Тариф» и обновляется первого числа каждого месяца.' },
];

/** A raised surface whose content is clipped to the corners (shadow kept outside). */
function Surface({ children, radius = 18, style, onPress, accessibilityLabel, accessibilityRole }) {
  const t = useTheme();
  const outer = [{ borderRadius: radius, backgroundColor: t.c.surface }, t.sh.e1, t.dark && { borderWidth: 1, borderColor: t.c.line }, style];
  const inner = <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>;
  return onPress
    ? <Press onPress={onPress} scaleTo={0.975} style={outer} accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole}>{inner}</Press>
    : <View style={outer}>{inner}</View>;
}

function Label({ children, first }) {
  return (
    <T v="caption" c="ink2" weight="700" style={{ marginTop: first ? 18 : 20, fontSize: 13, lineHeight: 16, letterSpacing: 0.2 }} accessibilityRole="header">
      {children}
    </T>
  );
}

function Item({ q, a, last }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Press
        feedback="highlight"
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')); setOpen(!open); }}
        accessibilityState={{ expanded: open }}
        accessibilityLabel={q}
        accessibilityHint={open ? 'Свернуть ответ' : 'Показать ответ'}
        style={{ paddingHorizontal: 14, paddingVertical: 13 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T v="body" style={{ flex: 1, fontSize: 15.5, lineHeight: 21 }}>{q}</T>
          <Icon name={open ? 'chevron.down' : 'chevron.right'} size={14} c="ink2" weight="semibold" style={{ opacity: 0.6 }} />
        </View>
        {open ? <T v="body" c="ink2" style={{ marginTop: 8, fontSize: 14.5, lineHeight: 21 }}>{a}</T> : null}
      </Press>
      {!last ? <Divider inset={14} /> : null}
    </View>
  );
}

function Contact({ icon, title, sub, onPress }) {
  return (
    <Surface radius={16} style={{ flex: 1 }} onPress={onPress} accessibilityLabel={`${title}: ${sub}`} accessibilityRole="link">
      <View style={{ paddingVertical: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name={icon} size={20} c="brand" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="bodyStrong" style={{ fontSize: 14.5, lineHeight: 18 }}>{title}</T>
          <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 11.5, lineHeight: 14 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{sub}</T>
        </View>
      </View>
    </Surface>
  );
}

function DocLink({ title, url }) {
  return (
    <Press feedback="none" onPress={() => openLink(url)} accessibilityRole="link" accessibilityLabel={title} style={{ paddingVertical: 6, paddingHorizontal: 12, minHeight: 32, justifyContent: 'center' }} hitSlop={6}>
      <T v="body" c="brand" style={{ fontSize: 14, lineHeight: 18 }}>{title}</T>
    </Press>
  );
}

export default function FAQScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const role = useStore((s) => s.currentUser?.role);
  const [query, setQuery] = useState('');

  // The viewer's own role goes first.
  const sections = useMemo(() => {
    const w = { key: 'w', title: 'ИСПОЛНИТЕЛЯМ', items: WORKER };
    const e = { key: 'e', title: 'ЗАКАЗЧИКАМ', items: EMPLOYER };
    const ordered = role === 'employer' ? [e, w] : [w, e];
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered
      .map((s) => ({ ...s, items: s.items.filter((x) => x.q.toLowerCase().includes(q) || x.a.toLowerCase().includes(q)) }))
      .filter((s) => s.items.length);
  }, [role, query]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter, paddingBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" style={{ flex: 1, fontSize: 17, lineHeight: 21 }} accessibilityRole="header">Помощь</T>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: gutter, paddingTop: 12, paddingBottom: insets.bottom + 30 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <SearchField value={query} onChangeText={setQuery} placeholder="Поиск по вопросам" />

        {sections.length ? sections.map((s, si) => (
          <View key={s.key}>
            <Label first={si === 0}>{s.title}</Label>
            <Surface style={{ marginTop: 9 }}>
              {s.items.map((x, i) => <Item key={x.q} {...x} last={i === s.items.length - 1} />)}
            </Surface>
          </View>
        )) : (
          <View style={{ marginTop: 18, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 16, backgroundColor: c.surface2 }}>
            <T v="bodyStrong" c="ink">{`По запросу «${query.trim()}» ничего`}</T>
            <T v="caption" c="ink2" style={{ marginTop: 3, fontSize: 13.5, lineHeight: 19 }}>Напиши нам — контакты ниже.</T>
          </View>
        )}

        <Label>НАПИСАТЬ НАМ</Label>
        <View style={{ marginTop: 9, flexDirection: 'row', gap: 9 }}>
          <Contact icon="paperplane" title="Telegram" sub="@smenabel" onPress={() => openLink('https://t.me/smenabel')} />
          <Contact icon="envelope" title="Почта" sub="support@smenabel.by" onPress={() => openLink(LINKS.supportEmail)} />
        </View>

        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <DocLink title="Условия использования" url={LINKS.terms} />
          <DocLink title="Политика конфиденциальности" url={LINKS.privacy} />
          <T v="caption" c="ink2" style={{ marginTop: 8, fontSize: 12, lineHeight: 15, fontFamily: MONO }}>{APP_VERSION}</T>
        </View>
      </ScrollView>
    </View>
  );
}
