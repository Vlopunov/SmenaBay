import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import { signInWithGoogle, signInWithApple } from '../../services/auth';

export default function RoleSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(null); // 'worker' | 'employer'
  const [loading, setLoading] = useState(false);

  const openAuthChoice = (role) => {
    setSelectedRole(role);
  };

  const handlePhone = () => {
    setSelectedRole(null);
    const screen = selectedRole === 'worker' ? 'RegisterWorker' : 'RegisterEmployer';
    navigation.navigate(screen, { authMethod: 'phone' });
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.cancelled) { setLoading(false); return; }
      setSelectedRole(null);
      const screen = selectedRole === 'worker' ? 'RegisterWorker' : 'RegisterEmployer';
      navigation.navigate(screen, { authMethod: 'google', socialData: result });
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      const result = await signInWithApple();
      if (result.cancelled) { setLoading(false); return; }
      setSelectedRole(null);
      const screen = selectedRole === 'worker' ? 'RegisterWorker' : 'RegisterEmployer';
      navigation.navigate(screen, { authMethod: 'apple', socialData: result });
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + SIZES['3xl'] }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>СменаБел</Text>
        <Text style={styles.subtitle}>Маркетплейс посменных подработок</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => openAuthChoice('worker')}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#EEF2FF' }]}>
            <Ionicons name="person-outline" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.cardTitle}>Ищу подработку</Text>
          <Text style={styles.cardDesc}>
            Находите смены рядом с вами и зарабатывайте
          </Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.accent} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => openAuthChoice('employer')}
        >
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="business-outline" size={32} color="#D97706" />
          </View>
          <Text style={styles.cardTitle}>Ищу сотрудников</Text>
          <Text style={styles.cardDesc}>
            Публикуйте смены и находите исполнителей
          </Text>
          <View style={styles.cardArrow}>
            <Ionicons name="arrow-forward" size={20} color={COLORS.accent} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>Уже есть аккаунт? </Text>
        <Text style={styles.loginTextAccent}>Войти</Text>
      </TouchableOpacity>

      {/* Auth method modal */}
      <Modal visible={!!selectedRole} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => !loading && setSelectedRole(null)}
        >
          <View style={[styles.modal, { paddingBottom: insets.bottom + SIZES.lg }]}>
            <Text style={styles.modalTitle}>Как вы хотите зарегистрироваться?</Text>
            <Text style={styles.modalHint}>
              Для работы в приложении потребуется верификация по номеру телефона
            </Text>

            <TouchableOpacity style={styles.phoneBtn} onPress={handlePhone} disabled={loading}>
              <Ionicons name="call-outline" size={20} color={COLORS.white} />
              <Text style={styles.phoneBtnText}>По номеру телефона</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle} disabled={loading}>
              {loading ? <ActivityIndicator color="#DB4437" /> : <Ionicons name="logo-google" size={20} color="#DB4437" />}
              <Text style={styles.socialText}>Продолжить с Google</Text>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.appleBtn} onPress={handleApple} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Ionicons name="logo-apple" size={22} color={COLORS.white} />}
                <Text style={styles.appleText}>Продолжить с Apple</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedRole(null)} disabled={loading}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SIZES.lg },
  header: { alignItems: 'center', marginBottom: SIZES['3xl'] },
  logo: { fontSize: 36, ...FONTS.bold, color: COLORS.accent, letterSpacing: -1 },
  subtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs },
  cards: { gap: SIZES.base },
  card: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusXl, padding: SIZES.lg,
    ...SHADOWS.md, position: 'relative',
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.md,
  },
  cardTitle: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary },
  cardDesc: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs, paddingRight: 40 },
  cardArrow: {
    position: 'absolute', right: SIZES.lg, bottom: SIZES.lg,
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.accentSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  loginLink: {
    flexDirection: 'row', justifyContent: 'center', marginTop: SIZES['2xl'],
    padding: SIZES.base,
  },
  loginText: { fontSize: SIZES.body, color: COLORS.textSecondary },
  loginTextAccent: { fontSize: SIZES.body, ...FONTS.semibold, color: COLORS.accent },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    padding: SIZES.lg,
  },
  modalTitle: { fontSize: SIZES.title, ...FONTS.bold, color: COLORS.textPrimary, textAlign: 'center' },
  modalHint: { fontSize: SIZES.small, color: COLORS.textTertiary, textAlign: 'center', marginTop: SIZES.sm, marginBottom: SIZES.xl, lineHeight: 18 },

  phoneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  phoneBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SIZES.sm,
  },
  socialText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.textPrimary },

  appleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: '#000', borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.sm,
  },
  appleText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.white },

  cancelBtn: { alignItems: 'center', paddingVertical: SIZES.md },
  cancelText: { fontSize: SIZES.body, color: COLORS.textSecondary },
});
