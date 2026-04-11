import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const login = useStore(s => s.login);

  const [phone, setPhone] = useState('+375');
  const [step, setStep] = useState(1);
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');

  const handleSendCode = () => {
    if (phone.length < 13) {
      setError('Введите корректный номер');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleVerify = () => {
    if (smsCode.length < 4) return;
    const user = login(phone);
    if (!user) {
      setError('Пользователь не найден. Зарегистрируйтесь.');
      setStep(1);
    }
  };

  const quickLogin = (ph) => {
    Keyboard.dismiss();
    login(ph);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Вход</Text>
        <Text style={styles.subtitle}>Введите номер телефона</Text>

        {step === 1 ? (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+375XXXXXXXXX"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSendCode} activeOpacity={0.7}>
              <Text style={styles.submitBtnText}>Получить код</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.smsInput}
              value={smsCode}
              onChangeText={setSmsCode}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
            />
            <Text style={styles.smsHint}>В прототипе подойдёт любой код</Text>

            <TouchableOpacity
              style={[styles.submitBtn, smsCode.length < 4 && styles.submitBtnDisabled]}
              onPress={handleVerify}
              disabled={smsCode.length < 4}
              activeOpacity={0.7}
            >
              <Text style={styles.submitBtnText}>Войти</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Quick Demo Access */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Быстрый вход (демо)</Text>

          <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('+375291234567')} activeOpacity={0.7}>
            <Ionicons name="person" size={18} color={COLORS.accent} />
            <Text style={styles.demoBtnText}>Алексей К. — Исполнитель (87 смен)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('+375337654321')} activeOpacity={0.7}>
            <Ionicons name="person" size={18} color={COLORS.accent} />
            <Text style={styles.demoBtnText}>Дарья Н. — Исполнитель (42 смены)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.demoBtn} onPress={() => quickLogin('+375441112233')} activeOpacity={0.7}>
            <Ionicons name="person" size={18} color={COLORS.accent} />
            <Text style={styles.demoBtnText}>Иван Б. — Исполнитель (120 смен)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.demoBtn, styles.demoBtnEmployer]} onPress={() => quickLogin('+375291001010')} activeOpacity={0.7}>
            <Ionicons name="business" size={18} color="#D97706" />
            <Text style={styles.demoBtnText}>Ozon ПВЗ — Заказчик (Premium)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.demoBtn, styles.demoBtnEmployer]} onPress={() => quickLogin('+375293003030')} activeOpacity={0.7}>
            <Ionicons name="business" size={18} color="#D97706" />
            <Text style={styles.demoBtnText}>Кафе Васильки — Заказчик (Business)</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.demoBtn, styles.demoBtnEmployer]} onPress={() => quickLogin('+375295005050')} activeOpacity={0.7}>
            <Ionicons name="business" size={18} color="#D97706" />
            <Text style={styles.demoBtnText}>Склад-Логистик — Заказчик (Premium)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.sm },
  scroll: { paddingHorizontal: SIZES.lg, paddingTop: SIZES.lg },
  title: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs, marginBottom: SIZES.xl },
  input: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd, paddingHorizontal: SIZES.base,
    height: SIZES.inputHeight, fontSize: SIZES.bodyLarge, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, ...FONTS.regular,
  },
  inputError: { borderColor: COLORS.error },
  error: { fontSize: SIZES.caption, color: COLORS.error, marginTop: SIZES.sm },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.lg,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
  smsInput: {
    width: 160, height: 64, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    fontSize: 32, textAlign: 'center', ...FONTS.bold, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, letterSpacing: 12, alignSelf: 'center',
  },
  smsHint: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: SIZES.md, textAlign: 'center' },
  demoSection: {
    marginTop: SIZES['3xl'], paddingTop: SIZES.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  demoTitle: { fontSize: SIZES.small, ...FONTS.semibold, color: COLORS.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SIZES.md },
  demoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    paddingVertical: SIZES.md, paddingHorizontal: SIZES.base,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  demoBtnEmployer: { borderColor: '#FDE68A' },
  demoBtnText: { fontSize: SIZES.small, color: COLORS.textPrimary, ...FONTS.medium, flex: 1 },
});
