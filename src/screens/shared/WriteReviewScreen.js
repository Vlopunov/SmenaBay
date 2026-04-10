import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

const WORKER_CATEGORIES_LABELS = [
  { key: 'conditions', label: 'Условия работы' },
  { key: 'descriptionMatch', label: 'Соответствие описания' },
  { key: 'attitude', label: 'Отношение к сотрудникам' },
  { key: 'paymentSpeed', label: 'Своевременность оплаты' },
];

const COMPANY_CATEGORIES_LABELS = [
  { key: 'punctuality', label: 'Пунктуальность' },
  { key: 'workQuality', label: 'Качество работы' },
  { key: 'communication', label: 'Коммуникабельность' },
  { key: 'appearance', label: 'Внешний вид' },
];

function StarRow({ value, onChange, label }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={styles.stars}>
        {[1,2,3,4,5].map(s => (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={styles.starTouch}>
            <Ionicons name={s <= value ? 'star' : 'star-outline'} size={24} color={COLORS.star} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function WriteReviewScreen({ route, navigation }) {
  const { shiftId, targetId, type } = route.params;
  const insets = useSafeAreaInsets();
  const addReview = useStore(s => s.addReview);
  const currentUser = useStore(s => s.currentUser);

  const isWorkerReview = type === 'worker_about_company';
  const categories = isWorkerReview ? WORKER_CATEGORIES_LABELS : COMPANY_CATEGORIES_LABELS;

  const [overall, setOverall] = useState(0);
  const [catRatings, setCatRatings] = useState({});
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [recommendAgain, setRecommendAgain] = useState(null);

  const allFilled = overall > 0 && categories.every(c => catRatings[c.key] > 0) &&
    (!isWorkerReview ? recommendAgain !== null : true);

  const handleSubmit = () => {
    if (!allFilled) return;
    addReview({
      type,
      authorId: currentUser.id,
      targetId,
      shiftId,
      overallRating: overall,
      categoryRatings: catRatings,
      text: text.trim() || null,
      anonymous: isWorkerReview ? anonymous : false,
      recommendAgain: isWorkerReview ? null : recommendAgain,
    });
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Оставить отзыв</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <StarRow value={overall} onChange={setOverall} label="Общая оценка" />

        <View style={styles.divider} />

        {categories.map(cat => (
          <StarRow
            key={cat.key}
            value={catRatings[cat.key] || 0}
            onChange={(v) => setCatRatings(prev => ({ ...prev, [cat.key]: v }))}
            label={cat.label}
          />
        ))}

        <View style={styles.divider} />

        <Text style={styles.label}>Комментарий (до 500 символов)</Text>
        <TextInput
          style={styles.textarea}
          value={text}
          onChangeText={t => setText(t.slice(0, 500))}
          placeholder="Расскажите о вашем опыте..."
          placeholderTextColor={COLORS.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{text.length}/500</Text>

        {isWorkerReview && (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Оставить анонимно</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{ true: COLORS.accent }}
            />
          </View>
        )}

        {!isWorkerReview && (
          <View style={styles.recommendSection}>
            <Text style={styles.label}>Готовы работать с этим исполнителем снова?</Text>
            <View style={styles.recommendBtns}>
              <TouchableOpacity
                style={[styles.recBtn, recommendAgain === true && styles.recBtnYes]}
                onPress={() => setRecommendAgain(true)}
              >
                <Ionicons name="thumbs-up" size={18} color={recommendAgain === true ? COLORS.white : COLORS.success} />
                <Text style={[styles.recBtnText, recommendAgain === true && { color: COLORS.white }]}>Да</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.recBtn, recommendAgain === false && styles.recBtnNo]}
                onPress={() => setRecommendAgain(false)}
              >
                <Ionicons name="thumbs-down" size={18} color={recommendAgain === false ? COLORS.white : COLORS.error} />
                <Text style={[styles.recBtnText, recommendAgain === false && { color: COLORS.white }]}>Нет</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, !allFilled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!allFilled}
          activeOpacity={0.7}
        >
          <Text style={styles.submitBtnText}>Отправить отзыв</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  scroll: { paddingHorizontal: SIZES.lg, paddingTop: SIZES.md },

  starRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SIZES.md },
  starLabel: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary, flex: 1 },
  stars: { flexDirection: 'row', gap: 2 },
  starTouch: { padding: 2 },

  divider: { height: 1, backgroundColor: COLORS.borderLight, marginVertical: SIZES.sm },

  label: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary, marginTop: SIZES.md, marginBottom: SIZES.sm },
  textarea: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, padding: SIZES.base,
    height: 100, fontSize: SIZES.body, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  charCount: { fontSize: SIZES.caption, color: COLORS.textTertiary, textAlign: 'right', marginTop: SIZES.xs },

  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SIZES.lg },
  toggleLabel: { fontSize: SIZES.body, color: COLORS.textPrimary },

  recommendSection: { marginTop: SIZES.lg },
  recommendBtns: { flexDirection: 'row', gap: SIZES.md },
  recBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    paddingVertical: SIZES.md, borderRadius: SIZES.radiusMd, backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: COLORS.border,
  },
  recBtnYes: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  recBtnNo: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  recBtnText: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },

  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES['2xl'],
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
});
