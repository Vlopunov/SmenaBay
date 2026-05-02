import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';

const FAQ_DATA = [
  {
    category: 'Для исполнителей',
    items: [
      { q: 'Как откликнуться на смену?', a: 'Найдите смену в ленте или на карте, откройте детали и нажмите «Откликнуться». Заказчик получит уведомление и примет решение.' },
      { q: 'Когда я получу подтверждение?', a: 'Обычно заказчики отвечают в течение нескольких часов. Вы получите уведомление и сможете связаться в чате.' },
      { q: 'Что делать, если я опаздываю?', a: 'Напишите заказчику в чат как можно раньше. Используйте быстрый ответ «Опаздываю» — заказчик сразу увидит.' },
      { q: 'Как работает рейтинг?', a: 'После каждой завершённой смены заказчик может оставить отзыв. Ваш рейтинг — среднее всех оценок. Высокий рейтинг повышает шансы на одобрение.' },
      { q: 'Нужна ли медицинская книжка?', a: 'Зависит от смены. В описании указано, требуется ли медкнижка. Используйте фильтр «Без медкнижки» чтобы видеть только подходящие смены.' },
      { q: 'Могу ли я отменить отклик?', a: 'Да, пока отклик в статусе «Ожидает» — вы можете отменить его в разделе «Мои смены».' },
    ],
  },
  {
    category: 'Для заказчиков',
    items: [
      { q: 'Как создать смену?', a: 'Нажмите «Создать» в нижнем меню. Заполните название, описание, оплату, время и локацию. Можно выбрать несколько дат сразу.' },
      { q: 'Сколько стоит размещение?', a: 'Бесплатный тариф — до 3 смен в месяц. Тариф Бизнес — до 30 смен. Премиум — без ограничений. Подробнее в Профиль → Тарифы.' },
      { q: 'Как одобрить исполнителя?', a: 'Откройте смену → вкладка «Новые» → посмотрите профиль и рейтинг → нажмите «Подтвердить». Исполнитель получит уведомление и чат откроется автоматически.' },
      { q: 'Могу ли я отменить смену?', a: 'Да, в управлении сменой нажмите «Отменить». Все подтверждённые исполнители получат уведомление.' },
    ],
  },
  {
    category: 'Общие вопросы',
    items: [
      { q: 'Как пройти верификацию?', a: 'При попытке откликнуться или создать смену появится окно верификации. Введите номер телефона, получите SMS-код и подтвердите.' },
      { q: 'Безопасны ли мои данные?', a: 'Да. Номер телефона показывается только если вы разрешили это в настройках. Общение происходит через встроенный чат.' },
      { q: 'Как связаться с поддержкой?', a: 'Напишите нам в Telegram: @smenabel или на email: support@smenabel.by' },
    ],
  },
];

export default function FAQScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState({});

  const toggle = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Помощь</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {FAQ_DATA.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.category}</Text>
            {section.items.map((item, qi) => {
              const key = `${si}_${qi}`;
              const isOpen = expanded[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.faqItem}
                  onPress={() => toggle(key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.questionRow}>
                    <Text style={styles.question}>{item.q}</Text>
                    <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textTertiary} />
                  </View>
                  {isOpen && (
                    <Text style={styles.answer}>{item.a}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color={COLORS.accent} />
          <Text style={styles.contactTitle}>Не нашли ответ?</Text>
          <Text style={styles.contactText}>Telegram: @smenabel</Text>
          <Text style={styles.contactText}>Email: support@smenabel.by</Text>
        </View>

        <View style={{ height: SIZES['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.lg },

  section: { marginBottom: SIZES.xl },
  sectionTitle: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SIZES.sm, marginTop: SIZES.md },

  faqItem: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  question: { fontSize: SIZES.body, ...FONTS.semibold, color: COLORS.textPrimary, flex: 1, marginRight: SIZES.sm },
  answer: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.md, lineHeight: 22 },

  contactCard: {
    backgroundColor: COLORS.accentSoft, borderRadius: SIZES.radiusLg,
    padding: SIZES.xl, alignItems: 'center', marginTop: SIZES.md,
  },
  contactTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.sm },
  contactText: { fontSize: SIZES.body, color: COLORS.accent, marginTop: SIZES.xs },
});
