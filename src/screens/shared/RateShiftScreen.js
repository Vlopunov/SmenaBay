// «Оценка смены» — screen 13. Worker → company by default; employer →
// worker when `workerId` is passed. The header carries the shift's sky
// (closed once it is over). Stars are 44 pt so a tired thumb doesn't miss;
// ready-made reasons appear only at four stars and below, because typing a
// complaint after a 12-hour shift is not going to happen.
import React, { useState } from 'react';
import { View, ScrollView, TextInput, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, Chip, Button, CircleButton, Material } from '../../design/ui';
import { SkyView, skyKey } from '../../design/Sky';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { toast } from '../../design/Toast';
import { shortDate } from '../../design/format';
import useStore from '../../store/useStore';

const WORDS = ['', 'Плохо', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'];
// The last reason of each list means «nothing to complain about» and is exclusive.
const WORKER_REASONS = ['Задержали окончание', 'Не то, что в описании', 'Оплатили позже', 'Грубо общались', 'Не было инструктажа', 'Не тот адрес', 'Всё было нормально'];
const EMPLOYER_REASONS = ['Опоздание', 'Ушёл раньше', 'Не справился с задачами', 'Нужно было много объяснять', 'Всё было отлично'];

function Star({ on, onPress, index, selected }) {
  const { c } = useTheme();
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
      accessibilityRole="button"
      accessibilityLabel={`${index} из 5`}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Icon name="star.fill" size={44} c={on ? c.star : c.lineStrong} />
      </Animated.View>
    </Press>
  );
}

export default function RateShiftScreen({ route, navigation }) {
  const { shiftId, workerId } = route.params;
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const gutter = useWindowDimensions().width < 380 ? 16 : 20;
  const currentUser = useStore((s) => s.currentUser);
  const shift = useStore((s) => s.getShiftById(shiftId));
  const company = useStore((s) => (shift ? s.getCompanyById(shift.companyId) : null));
  const worker = useStore((s) => (workerId ? s.getWorkerById(workerId) : null));
  const addReview = useStore((s) => s.addReview);

  const aboutWorker = !!workerId;
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState([]);
  const [text, setText] = useState('');
  const reasons = aboutWorker ? EMPLOYER_REASONS : WORKER_REASONS;
  const okTag = reasons[reasons.length - 1];
  const showReasons = rating > 0 && rating <= 4;

  const toggle = (r) => {
    haptic.selection();
    setTags((prev) => {
      if (r === okTag) return prev.includes(r) ? [] : [r];
      const next = prev.filter((x) => x !== okTag);
      return next.includes(r) ? next.filter((x) => x !== r) : [...next, r];
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
      // Reasons are only on screen at four stars and below.
      tags: rating <= 4 ? tags : [],
      text: text.trim(),
      // The plate promises the company won't see who rated it; a company's
      // review of a worker is signed.
      anonymous: !aboutWorker,
    });
    haptic.success();
    toast.success('Оценка отправлена');
    navigation.goBack();
  };

  if (!shift) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const sky = t.sky(skyKey(shift));
  const workerName = `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim();
  const title = aboutWorker
    ? (workerName ? `Оцени работу:\n${workerName}` : 'Оцени работу исполнителя')
    : (company?.companyName ? `Как прошло\nв ${company.companyName}?` : 'Как прошла смена?');
  const line = aboutWorker
    ? `${shift.title} · ${shortDate(shift.date)}`
    : `${shift.title} · ${shortDate(shift.date)} · ${shift.pay} BYN`;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
          <SkyView sky={sky} style={{ paddingBottom: 20 }}>
            <View style={{ paddingTop: insets.top + 4, paddingHorizontal: gutter }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <CircleButton icon="xmark" variant="sky" color={sky.ink} iconSize={18} onPress={() => navigation.goBack()} accessibilityLabel="Закрыть" />
                <Press feedback="none" onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Пропустить оценку">
                  <T v="bodyStrong" c={sky.ink} style={{ fontSize: 15, lineHeight: 20 }}>Пропустить</T>
                </Press>
              </View>
              <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="checkmark" size={14} c="success" weight="heavy" />
                <T v="badge" c="success" style={{ fontSize: 12, lineHeight: 14, letterSpacing: 0.24 }}>СМЕНА ВЫПОЛНЕНА</T>
              </View>
              <T v="titleScreen" c={sky.ink} style={{ marginTop: 10, fontSize: 25, lineHeight: 30, letterSpacing: -0.5 }} accessibilityRole="header">{title}</T>
              <T v="bodyStrong" c={sky.ink} weight="500" style={{ marginTop: 8, fontSize: 14, lineHeight: 20, opacity: 0.85 }}>
                {line}
              </T>
            </View>
          </SkyView>

          <View style={{ paddingTop: 18, paddingHorizontal: gutter }}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} index={n} on={n <= rating} selected={n === rating} onPress={() => { haptic.selection(); setRating(n); }} />
              ))}
            </View>
            <T
              v="titleSection"
              display
              weight="700"
              c={rating ? 'ink' : 'ink2'}
              style={{ marginTop: 10, fontSize: 17, lineHeight: 22, textAlign: 'center' }}
              accessibilityLiveRegion="polite"
            >
              {rating ? WORDS[rating] : 'Поставь оценку'}
            </T>

            {showReasons ? (
              <>
                <T v="bodyStrong" c="ink3" style={{ marginTop: 22, fontSize: 14, lineHeight: 18 }}>Что было не так?</T>
                <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {reasons.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      tone="soft"
                      selected={tags.includes(r)}
                      onPress={() => toggle(r)}
                      style={{ borderRadius: 12, paddingVertical: 8, paddingLeft: 13, paddingRight: 13, minHeight: 36 }}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={aboutWorker ? 'Что стоит знать другим заказчикам — по желанию' : 'Что стоит знать другим — по желанию'}
              placeholderTextColor={c.inkDisabled}
              style={{
                marginTop: 18, minHeight: 92, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line,
                paddingHorizontal: 15, paddingTop: 13, paddingBottom: 13, fontSize: 15, lineHeight: 22, color: c.ink, textAlignVertical: 'top',
              }}
              accessibilityLabel="Текст отзыва, по желанию"
            />

            {!aboutWorker ? (
              <View style={{ marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.surface2 }}>
                <T v="caption" c="ink3" style={{ fontSize: 13, lineHeight: 19 }}>
                  Оценка появится в профиле компании. Заказчик не увидит, кто именно её поставил.
                </T>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <Material style={{ paddingTop: 12, paddingHorizontal: gutter, paddingBottom: aboutWorker ? insets.bottom + 10 : Math.max(insets.bottom, 12) }}>
          <Button title="Отправить оценку" onPress={submit} disabled={!rating} />
          {!aboutWorker ? (
            <Press
              feedback="none"
              onPress={() => navigation.navigate('Tabs', { screen: 'Shifts' })}
              style={{ alignSelf: 'center', marginTop: 2, paddingVertical: 10, paddingHorizontal: 12 }}
            >
              <T v="bodyStrong" c="brand" style={{ fontSize: 15.5, lineHeight: 20 }}>Найти похожую смену</T>
            </Press>
          ) : null}
        </Material>
      </KeyboardAvoidingView>
    </View>
  );
}
