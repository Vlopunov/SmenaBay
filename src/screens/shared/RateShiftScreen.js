// Rating a finished shift (handoff screen 4). Worker → company by default;
// employer → worker when `workerId` is passed. Ready-made reasons as chips,
// because typing a complaint after a 12-hour shift is not going to happen.
import React, { useState } from 'react';
import { View, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, Chip, Separator, Button } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import useStore from '../../store/useStore';

const WORDS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо, но не идеально', 'Отлично'];
const WORKER_REASONS = ['Задержали окончание', 'Не тот адрес', 'Работы больше обещанного', 'Некому объяснить', 'Задержали оплату', 'Всё было нормально'];
const EMPLOYER_REASONS = ['Опоздание', 'Ушёл раньше', 'Не справился с задачами', 'Нужно было много объяснять', 'Всё было отлично'];

function Star({ on, onPress, index }) {
  const reduced = useReducedMotion();
  const s = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Press
      feedback="none"
      onPress={() => {
        if (!reduced) s.value = withSequence(withTiming(1.18, { duration: 90, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 160 }));
        onPress();
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${index} из 5`}
    >
      <Animated.View style={style}>
        <Icon name={on ? 'star.fill' : 'star'} size={44} c={on ? 'label' : 'tertiary'} />
      </Animated.View>
    </Press>
  );
}

function streetOf(address = '') {
  // «пр. Независимости, 58» → «Независимости»
  return address.replace(/^(пр\.|ул\.|пр-т|просп\.|пер\.|пл\.|б-р|бул\.)\s*/i, '').split(',')[0].trim();
}

export default function RateShiftScreen({ route, navigation }) {
  const { shiftId, workerId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useStore((s) => s.currentUser);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const location = useStore((s) => (shift ? s.getLocationById(shift.locationId) : null));
  const worker = useStore((s) => (workerId ? s.getWorkerById(workerId) : null));
  const addReview = useStore((s) => s.addReview);

  const aboutWorker = !!workerId;
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const reasons = aboutWorker ? EMPLOYER_REASONS : WORKER_REASONS;
  const okTag = reasons[reasons.length - 1];

  const title = aboutWorker
    ? `Оценка: ${worker?.firstName || ''} ${worker?.lastName || ''}`.trim()
    : `Как прошло на ${streetOf(location?.address) || 'смене'}?`;

  const toggle = (t) => {
    haptic.selection();
    setTags((prev) => {
      if (t === okTag) return prev.includes(t) ? [] : [t];
      const next = prev.filter((x) => x !== okTag);
      return next.includes(t) ? next.filter((x) => x !== t) : [...next, t];
    });
  };

  const submit = () => {
    if (!rating || !shift || !currentUser) return;
    addReview({
      type: aboutWorker ? 'company_about_worker' : 'worker_about_company',
      authorId: currentUser.id,
      targetId: aboutWorker ? workerId : shift.companyId,
      shiftId: shift.id,
      overallRating: rating,
      tags,
      text: text.trim(),
      anonymous: false,
    });
    haptic.success();
    navigation.goBack();
  };

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 22, alignItems: 'flex-end' }}>
            <Press feedback="none" onPress={() => navigation.goBack()} hitSlop={12}><T v="body" c="accent" style={{ fontSize: 16 }}>Позже</T></Press>
          </View>
          <View style={{ paddingHorizontal: 22, paddingTop: 26 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="checkmark.seal" size={14} c="label" />
              <T v="section">Смена закрыта</T>
            </View>
            <T v="title" style={{ marginTop: 12 }} accessibilityRole="header">{title}</T>
            <T v="body" c="secondary" style={{ marginTop: 7 }}>
              {aboutWorker
                ? 'Оценка войдёт в рейтинг исполнителя — его видят другие заказчики.'
                : 'Оценка войдёт в рейтинг компании, а текст увидят другие исполнители.'}
            </T>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }} accessibilityRole="adjustable" accessibilityLabel={`Оценка: ${rating || 'не выбрана'}`}>
              {[1, 2, 3, 4, 5].map((n) => <Star key={n} index={n} on={n <= rating} onPress={() => { haptic.selection(); setRating(n); }} />)}
            </View>
            <T v="body" c="secondary" style={{ marginTop: 10, minHeight: 21 }}>{WORDS[rating]}</T>
          </View>

          <Separator style={{ marginTop: 18 }} />
          <T v="section" c="secondary" style={{ paddingHorizontal: 22, paddingTop: 18 }}>
            {rating === 5 ? 'Что понравилось' : 'Что было не так'}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 22, paddingTop: 11 }}>
            {reasons.map((r) => <Chip key={r} label={r} selected={tags.includes(r)} onPress={() => toggle(r)} />)}
          </View>
          <View style={{ paddingHorizontal: 22, paddingTop: 18 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={aboutWorker ? 'Пара слов для других заказчиков' : 'Пара слов для других — что стоит знать перед такой сменой'}
              placeholderTextColor={c.labelTertiary}
              style={{ minHeight: 88, borderRadius: 14, backgroundColor: c.fill, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 13, fontSize: 15, lineHeight: 21, color: c.label, textAlignVertical: 'top' }}
              accessibilityLabel="Текст отзыва"
            />
          </View>
        </ScrollView>
        <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 6, paddingTop: 10, gap: 6 }}>
          <Button title="Отправить оценку" onPress={submit} disabled={!rating} />
          {!aboutWorker ? (
            <Press feedback="none" onPress={() => navigation.navigate('Tabs', { screen: 'Shifts' })} style={{ alignSelf: 'center', paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <T v="body" c="accent">Найти похожую смену</T>
              <Icon name="chevron.right" size={11} c="accent" weight="semibold" />
            </Press>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
