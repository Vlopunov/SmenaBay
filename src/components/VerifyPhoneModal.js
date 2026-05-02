import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS, FONTS } from '../constants/theme';
import { sendVerificationCode, verifyCode, isMockAuth } from '../services/auth';
import useStore from '../store/useStore';

export default function VerifyPhoneModal({ visible, onClose, onVerified }) {
  const currentUser = useStore(s => s.currentUser);
  const updateProfile = useStore(s => s.updateProfile);

  const [step, setStep] = useState(1); // 1=phone, 2=code, 3=success
  const [phone, setPhone] = useState(currentUser?.phone || '+375');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(1);
      setPhone(currentUser?.phone || '+375');
      setCode('');
      setError('');
      setVerification(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

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
    setLoading(true);
    setError('');
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
    if (code.length < 6) return;
    setLoading(true);
    setError('');
    try {
      await verifyCode(verification, code);
      updateProfile({ phone, phoneVerified: true });
      setStep(3);
      setTimeout(() => {
        onVerified?.();
        onClose();
      }, 1500);
    } catch (e) {
      setError(e.message);
      setCode('');
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
      setCode('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={step !== 3 ? onClose : undefined} />

        <Animated.View style={[styles.modal, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, step === 3 && styles.iconCircleSuccess]}>
              <Ionicons
                name={step === 3 ? 'checkmark-circle' : 'shield-checkmark'}
                size={32}
                color={step === 3 ? COLORS.success : COLORS.accent}
              />
            </View>
            <Text style={styles.title}>
              {step === 1 ? 'Верификация' : step === 2 ? 'Введите код' : 'Готово!'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1 && 'Подтвердите номер телефона, чтобы откликаться на смены и публиковать объявления'}
              {step === 2 && `SMS-код отправлен на ${phone}`}
              {step === 3 && 'Номер телефона подтверждён. Теперь все функции доступны!'}
            </Text>
          </View>

          {/* Step 1: Phone input */}
          {step === 1 && (
            <View style={styles.content}>
              <Text style={styles.label}>Номер телефона</Text>
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
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={18} color={COLORS.white} />
                    <Text style={styles.primaryBtnText}>Отправить код</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Code input */}
          {step === 2 && (
            <View style={styles.content}>
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="••••"
                placeholderTextColor={COLORS.textTertiary}
                autoFocus
                editable={!loading}
              />
              {isMockAuth() && (
                <Text style={styles.mockHint}>Режим разработки — подойдёт любой код</Text>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryBtn, (code.length < 6 || loading) && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={code.length < 6 || loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.primaryBtnText}>Подтвердить</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryRow}>
                <TouchableOpacity onPress={resendTimer > 0 ? undefined : handleResend} disabled={resendTimer > 0}>
                  <Text style={[styles.linkText, resendTimer > 0 && styles.linkDisabled]}>
                    {resendTimer > 0 ? `Повторно (${resendTimer}с)` : 'Отправить повторно'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setStep(1); setCode(''); setError(''); }}>
                  <Text style={styles.linkText}>Изменить номер</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <View style={styles.content}>
              <View style={styles.successCheck}>
                <Ionicons name="checkmark" size={40} color={COLORS.success} />
              </View>
            </View>
          )}

          {/* Close button */}
          {step !== 3 && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Не сейчас</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },

  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: SIZES.xl, paddingHorizontal: SIZES.lg, paddingBottom: SIZES['3xl'],
    ...SHADOWS.lg,
  },

  header: { alignItems: 'center', marginBottom: SIZES.lg },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.md,
  },
  iconCircleSuccess: { backgroundColor: '#D1FAE5' },
  title: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary },
  subtitle: {
    fontSize: SIZES.body, color: COLORS.textSecondary, textAlign: 'center',
    marginTop: SIZES.sm, lineHeight: 22, paddingHorizontal: SIZES.md,
  },

  content: { marginBottom: SIZES.md },
  label: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary, marginBottom: SIZES.sm },
  input: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.base, height: 52, fontSize: SIZES.bodyLarge,
    color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.border,
  },
  inputError: { borderColor: COLORS.error },
  error: { fontSize: SIZES.caption, color: COLORS.error, marginTop: SIZES.sm },

  codeInput: {
    height: 64, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    fontSize: 28, textAlign: 'center', ...FONTS.bold, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.border, letterSpacing: 12,
  },
  mockHint: { fontSize: SIZES.caption, color: COLORS.textTertiary, textAlign: 'center', marginTop: SIZES.sm },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd,
    marginTop: SIZES.lg,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },

  secondaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: SIZES.lg, paddingHorizontal: SIZES.xs,
  },
  linkText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },
  linkDisabled: { color: COLORS.textTertiary },

  successCheck: { alignItems: 'center', paddingVertical: SIZES.md },

  closeBtn: { alignItems: 'center', paddingVertical: SIZES.md },
  closeText: { fontSize: SIZES.body, color: COLORS.textTertiary },
});
