import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';
import { sendVerificationCode, verifyCode, isMockAuth, signInWithGoogle, signInWithApple } from '../../services/auth';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const login = useStore(s => s.login);

  const [phone, setPhone] = useState('+375');
  const [step, setStep] = useState(1);
  const [smsCode, setSmsCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timerRef.current);
    }
  }, [resendTimer]);

  const handleSendCode = async () => {
    if (phone.length < 13) {
      setError('Введите корректный номер');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await sendVerificationCode(phone);
      setVerification(result);
      setStep(2);
      setResendTimer(60);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (smsCode.length < 6) return;
    setError('');
    setLoading(true);
    try {
      await verifyCode(verification, smsCode);
      const user = login(phone);
      if (!user) {
        setError('Пользователь не найден. Зарегистрируйтесь.');
        setStep(1);
        setSmsCode('');
        setVerification(null);
      }
    } catch (e) {
      setError(e.message);
      setSmsCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendVerificationCode(phone);
      setVerification(result);
      setResendTimer(60);
      setSmsCode('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) { setLoading(false); return; }
      // Try to find user by email or create placeholder
      // For now, show info that account needs to be linked
      Alert.alert('Google Sign-In', `Вошли как ${result.displayName || result.email}.\n\nДля полной интеграции необходим бэкенд.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithApple();
      if (result.cancelled) { setLoading(false); return; }
      Alert.alert('Apple Sign-In', `Вошли как ${result.displayName || result.email}.\n\nДля полной интеграции необходим бэкенд.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
        <Text style={styles.subtitle}>
          {step === 1 ? 'Введите номер телефона' : `Код отправлен на ${phone}`}
        </Text>

        {step === 1 ? (
          <>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+375XXXXXXXXX"
              placeholderTextColor={COLORS.textTertiary}
              keyboardType="phone-pad"
              editable={!loading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSendCode}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Получить код</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.smsInput}
              value={smsCode}
              onChangeText={setSmsCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="0000"
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
              editable={!loading}
            />
            {isMockAuth() && (
              <Text style={styles.smsHint}>Режим разработки — подойдёт любой код</Text>
            )}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, (smsCode.length < 6 || loading) && styles.submitBtnDisabled]}
              onPress={handleVerify}
              disabled={smsCode.length < 6 || loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Войти</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={resendTimer > 0 ? undefined : handleResend}
              disabled={resendTimer > 0}
            >
              <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                {resendTimer > 0 ? `Отправить повторно (${resendTimer}с)` : 'Отправить код повторно'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.changePhoneBtn} onPress={() => { setStep(1); setSmsCode(''); setError(''); }}>
              <Text style={styles.changePhoneText}>Изменить номер</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Social Login */}
        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>или войдите через</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} activeOpacity={0.7} disabled={loading}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialBtnText}>Продолжить с Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity style={styles.appleBtn} onPress={handleAppleLogin} activeOpacity={0.7} disabled={loading}>
              <Ionicons name="logo-apple" size={22} color={COLORS.white} />
              <Text style={styles.appleBtnText}>Продолжить с Apple</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Demo Access — only in dev */}
        {__DEV__ && <View style={styles.demoSection}>
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
        </View>}
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
  error: { fontSize: SIZES.caption, color: COLORS.error, marginTop: SIZES.sm, textAlign: 'center' },
  submitBtn: {
    backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd, height: SIZES.buttonHeight,
    justifyContent: 'center', alignItems: 'center', marginTop: SIZES.lg,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
  smsInput: {
    width: 180, height: 64, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    fontSize: 28, textAlign: 'center', ...FONTS.bold, color: COLORS.textPrimary,
    borderWidth: 1, borderColor: COLORS.border, letterSpacing: 10, alignSelf: 'center',
  },
  smsHint: { fontSize: SIZES.caption, color: COLORS.textTertiary, marginTop: SIZES.md, textAlign: 'center' },
  resendBtn: { marginTop: SIZES.lg, alignItems: 'center' },
  resendText: { fontSize: SIZES.body, color: COLORS.accent, ...FONTS.medium },
  resendTextDisabled: { color: COLORS.textTertiary },
  changePhoneBtn: { marginTop: SIZES.sm, alignItems: 'center' },
  changePhoneText: { fontSize: SIZES.small, color: COLORS.textSecondary },
  socialSection: { marginTop: SIZES.xl },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: SIZES.small, color: COLORS.textTertiary, marginHorizontal: SIZES.md },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.sm,
  },
  socialBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.textPrimary },
  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: '#000000', borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  appleBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.white },
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
