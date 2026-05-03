import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar,
  ScrollView, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FAMILIES } from '../../constants/theme';
import { Icon, MonoTag, IconButton, PrimaryButton, GhostButton } from '../../components/ui/Atoms';
import useStore from '../../store/useStore';
import { sendVerificationCode, verifyCode, isMockAuth, signInWithGoogle, signInWithApple } from '../../services/auth';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const login = useStore((s) => s.login);

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
        setError('Профиль не найден. Зарегистрируйся заново.');
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
    setLoading(true); setError('');
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) return setLoading(false);
      Alert.alert('Google', `Вошли как ${result.displayName || result.email}`);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleAppleLogin = async () => {
    setLoading(true); setError('');
    try {
      const result = await signInWithApple();
      if (result.cancelled) return setLoading(false);
      Alert.alert('Apple', `Вошли как ${result.displayName || result.email}`);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <IconButton icon="arrowL" onPress={() => navigation.goBack()} />
        <MonoTag>Шаг {step} из 02</MonoTag>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>
          {step === 1 ? <>С возвращением,{'\n'}<Text style={styles.serif}>исполнитель</Text></> : <>Введи код{'\n'}<Text style={styles.serif}>из СМС</Text></>}
        </Text>
        <Text style={styles.subheading}>
          {step === 1 ? 'Введи номер — пришлём код по SMS.' : `Код отправлен на ${phone}`}
        </Text>

        {/* STEP 1: phone */}
        {step === 1 && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>НОМЕР ТЕЛЕФОНА</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                keyboardType="phone-pad"
                placeholder="+375 (XX) XXX-XX-XX"
                placeholderTextColor={COLORS.fgFaint}
                maxLength={13}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title={loading ? 'Отправка…' : 'Получить код'}
              icon="arrow"
              onPress={handleSendCode}
              disabled={loading}
              style={{ marginTop: 14 }}
            />

            {isMockAuth() && <MonoTag style={{ marginTop: 12, alignSelf: 'center' }}>демо-режим: SMS не отправляется</MonoTag>}

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ИЛИ</Text>
              <View style={styles.dividerLine} />
            </View>

            <GhostButton title="Войти через Google" icon="google" onPress={handleGoogleLogin} style={{ marginBottom: 10 }} />
            {Platform.OS === 'ios' && <GhostButton title="Войти через Apple" icon="apple" onPress={handleAppleLogin} />}

            {/* Demo accounts — editorial style */}
            <View style={styles.demoBlock}>
              <MonoTag style={{ marginBottom: 10 }}>Демо-аккаунты</MonoTag>
              <DemoRow label="Артём · исполнитель" phone="+375291234567" onPress={quickLogin} />
              <DemoRow label="Дарья · исполнитель" phone="+375337654321" onPress={quickLogin} />
              <DemoRow label="Олег · исполнитель" phone="+375441112233" onPress={quickLogin} />
              <DemoRow label="ШаурМания · заказчик" phone="+375291001010" onPress={quickLogin} variant="employer" />
              <DemoRow label="Кофемания · заказчик" phone="+375293003030" onPress={quickLogin} variant="employer" />
              <DemoRow label="BarBQ · заказчик" phone="+375295005050" onPress={quickLogin} variant="employer" />
            </View>
          </>
        )}

        {/* STEP 2: SMS code */}
        {step === 2 && (
          <>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>КОД ИЗ СМС</Text>
              <TextInput
                value={smsCode}
                onChangeText={setSmsCode}
                style={[styles.input, { fontFamily: FAMILIES.display, fontSize: 32, letterSpacing: 8 }]}
                keyboardType="number-pad"
                placeholder="······"
                placeholderTextColor={COLORS.fgFaint}
                maxLength={6}
                autoFocus
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton
              title={loading ? 'Проверяем…' : 'Войти'}
              icon="arrow"
              onPress={handleVerify}
              disabled={loading || smsCode.length < 6}
              style={{ marginTop: 14 }}
            />

            <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0} style={styles.resendBtn}>
              <Text style={styles.resendText}>
                {resendTimer > 0 ? `Повтор через ${resendTimer}с` : 'Отправить код заново'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setStep(1); setSmsCode(''); setError(''); }} style={styles.changePhoneBtn}>
              <Text style={styles.changePhoneText}>← Изменить номер</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DemoRow({ label, phone, onPress, variant }) {
  const isEmployer = variant === 'employer';
  return (
    <TouchableOpacity onPress={() => onPress(phone)} style={[styles.demoRow, isEmployer && styles.demoRowEmployer]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.demoLabel, isEmployer && { color: COLORS.fgInv }]}>{label}</Text>
        <Text style={[styles.demoPhone, isEmployer && { color: 'rgba(244,241,234,0.55)' }]}>{phone}</Text>
      </View>
      <Icon name="arrow" size={16} color={isEmployer ? COLORS.signal : COLORS.fgMuted} strokeWidth={1.7} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 12 },

  scroll: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },

  heading: { fontFamily: FAMILIES.display, fontSize: 36, lineHeight: 38, letterSpacing: -1.6, color: COLORS.ink, marginTop: 8 },
  serif: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic' },
  subheading: { fontFamily: FAMILIES.text, fontSize: 14, color: COLORS.fgMuted, marginTop: 10 },

  field: { marginTop: 26 },
  fieldLabel: { fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgMuted, letterSpacing: 1, marginBottom: 8 },
  input: {
    fontFamily: FAMILIES.text, fontSize: 18, color: COLORS.ink,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.line,
    paddingHorizontal: 16, paddingVertical: 16, height: 56,
  },
  error: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.live, marginTop: 8 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.line },
  dividerText: { fontFamily: FAMILIES.mono, fontSize: 10, color: COLORS.fgFaint, letterSpacing: 1 },

  demoBlock: { marginTop: 28, paddingTop: 22, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  demoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.lineSoft, marginBottom: 8,
  },
  demoRowEmployer: { backgroundColor: COLORS.graphite, borderColor: COLORS.graphite },
  demoLabel: { fontFamily: FAMILIES.textSemi, fontSize: 13, color: COLORS.ink },
  demoPhone: { fontFamily: FAMILIES.mono, fontSize: 11, color: COLORS.fgMuted, marginTop: 2, letterSpacing: 0.5 },

  resendBtn: { alignItems: 'center', paddingVertical: 18 },
  resendText: { fontFamily: FAMILIES.textSemi, fontSize: 13, color: COLORS.ink },
  changePhoneBtn: { alignItems: 'center', paddingVertical: 8 },
  changePhoneText: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.fgMuted },
});
