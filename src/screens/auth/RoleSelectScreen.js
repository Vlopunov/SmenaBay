import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';

export default function RoleSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SIZES['3xl'] }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.logo}>СменаБай</Text>
        <Text style={styles.subtitle}>Маркетплейс посменных подработок</Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('RegisterWorker')}
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
          onPress={() => navigation.navigate('RegisterEmployer')}
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
});
