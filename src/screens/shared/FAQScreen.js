// Help: short answers, real contacts, and the legal documents a reviewer
// must be able to reach from inside the app.
import React, { useState } from 'react';
import { View, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, SectionHeader, Separator, SettingRow } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { LINKS, openLink } from '../../constants/links';
import useStore from '../../store/useStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WORKER = [
  { q: 'Как откликнуться на смену?', a: 'Открой смену и нажми «Откликнуться». Если ты ещё не входил, приложение спросит номер и пришлёт код — это одна минута. Заказчик увидит отклик сразу.' },
  { q: 'Когда придёт ответ?', a: 'Как только заказчик подтвердит или отклонит отклик, ответ появится в уведомлениях, а подтверждённая смена — в «Моих сменах» с обратным отсчётом.' },
  { q: 'Можно ли отменить?', a: 'Отклик можно отозвать в меню «···» на экране смены. Подтверждённую смену тоже можно отменить — денежного штрафа нет, но отмена будет видна заказчикам в твоём профиле.' },
  { q: 'Нужна ли медкнижка?', a: 'Зависит от смены — это написано в требованиях. В фильтрах есть «Без медкнижки», чтобы видеть только подходящие смены.' },
  { q: 'Как считается рейтинг?', a: 'После каждой смены заказчик ставит оценку. Рейтинг — среднее всех оценок, его видно в каждом отклике.' },
];

const EMPLOYER = [
  { q: 'Как создать смену?', a: 'На «Сводке» нажми круглую кнопку «+» вверху. Форма начинается с оплаты — от неё больше всего зависит, закроется ли смена.' },
  { q: 'Как выбрать исполнителя?', a: 'Открой смену → «Отклики». У каждого видно рейтинг, число смен и отмен. Подтверди — исполнитель получит уведомление, и откроется чат.' },
  { q: 'Можно ли отменить смену?', a: 'Да, в меню «···» на экране смены. Все, кто откликнулся, получат уведомление. Частые отмены видны исполнителям в профиле точки.' },
  { q: 'Сколько смен можно публиковать?', a: 'Лимит зависит от тарифа — он указан в «Профиль → Тариф» и обновляется первого числа каждого месяца.' },
];

function Item({ q, a, last }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Press
        feedback="highlight"
        onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')); setOpen(!open); }}
        accessibilityState={{ expanded: open }}
        style={{ paddingHorizontal: 22, paddingVertical: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <T v="value" style={{ flex: 1, fontSize: 16, lineHeight: 21 }}>{q}</T>
          <Icon name={open ? 'chevron.down' : 'chevron.right'} size={13} c="tertiary" weight="semibold" />
        </View>
        {open ? <T v="body" c="secondary" style={{ marginTop: 8 }}>{a}</T> : null}
      </Press>
      {!last ? <Separator inset /> : null}
    </View>
  );
}

export default function FAQScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const role = useStore((s) => s.currentUser?.role);
  const first = role === 'employer' ? EMPLOYER : WORKER;
  const second = role === 'employer' ? WORKER : EMPLOYER;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 }}>
          <T v="title" accessibilityRole="header">Помощь</T>
          <T v="caption" c="secondary" style={{ marginTop: 2 }}>Не нашёл ответ — напиши нам, контакты внизу</T>
        </View>
        <SectionHeader title={role === 'employer' ? 'Для заказчиков' : 'Для исполнителей'} />
        {first.map((x, i) => <Item key={x.q} {...x} last={i === first.length - 1} />)}
        <SectionHeader title={role === 'employer' ? 'Для исполнителей' : 'Для заказчиков'} />
        {second.map((x, i) => <Item key={x.q} {...x} last={i === second.length - 1} />)}

        <SectionHeader title="Связаться" />
        <SettingRow icon="paperplane" title="Telegram" sub="@smenabel" onPress={() => openLink('https://t.me/smenabel')} right={<Icon name="arrow.up.right" size={13} c="tertiary" />} />
        <SettingRow icon="envelope" title="Почта" sub="support@smenabel.by" onPress={() => openLink(LINKS.supportEmail)} right={<Icon name="arrow.up.right" size={13} c="tertiary" />} last />

        <SectionHeader title="Документы" />
        <SettingRow icon="doc.text" title="Условия использования" onPress={() => openLink(LINKS.terms)} right={<Icon name="arrow.up.right" size={13} c="tertiary" />} />
        <SettingRow icon="lock.shield" title="Политика конфиденциальности" onPress={() => openLink(LINKS.privacy)} right={<Icon name="arrow.up.right" size={13} c="tertiary" />} last />
        <Separator />
      </ScrollView>
    </View>
  );
}
