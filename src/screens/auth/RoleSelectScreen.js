import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, StatusBar, Modal, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FAMILIES } from '../../constants/theme';
import { Icon, MonoTag, Money, Pill, PrimaryButton, GhostButton } from '../../components/ui/Atoms';
import { signInWithGoogle, signInWithApple } from '../../services/auth';

export default function RoleSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const openAuthChoice = (role) => setSelectedRole(role);
  const handlePhone = () => {
    const screen = selectedRole === 'worker' ? 'RegisterWorker' : 'RegisterEmployer';
    setSelectedRole(null);
    navigation.navigate(screen, { authMethod: 'phone' });
  };

  const socialFlow = async (provider) => {
    setLoading(true);
    try {
      const result = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (result.cancelled) return setLoading(false);
      const screen = selectedRole === 'worker' ? 'RegisterWorker' : 'RegisterEmployer';
      setSelectedRole(null);
      navigation.navigate(screen, { authMethod: provider, socialData: result });
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />

      {/* Wordmark + edition */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>смена<Text style={styles.dot}>·</Text>бел</Text>
        <MonoTag>Шаг 01 · Роль</MonoTag>
      </View>

      {/* Heading */}
      <View style={styles.headingBlock}>
        <Text style={styles.heading}>
          Кто ты{'\n'}<Text style={styles.serif}>сегодня</Text>?
        </Text>
        <Text style={styles.subheading}>Выбери роль — её можно сменить позже.</Text>
      </View>

      {/* Two cards — asymmetric */}
      <View style={{ paddingHorizontal: 18, gap: 14, flex: 1 }}>
        <RoleCard
          numero="01"
          letters="W"
          title="Ищу подработку"
          desc="Смены рядом, отклик в один тап."
          accentBg={COLORS.signal}
          accentColor={COLORS.ink}
          stat="142"
          statLabel="Смен сегодня"
          onPress={() => openAuthChoice('worker')}
        />
        <RoleCard
          numero="02"
          letters="E"
          title="Ищу сотрудников"
          desc="Публикуй смены, отбирай исполнителей."
          accentBg={COLORS.graphite}
          accentColor={COLORS.signal}
          stat="04"
          statLabel="Минут на публикацию"
          dark
          onPress={() => openAuthChoice('employer')}
        />
      </View>

      {/* Footer login link */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={[styles.loginLink, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.loginText}>Уже зарегистрирован? </Text>
        <Text style={styles.loginAccent}>Войти →</Text>
      </TouchableOpacity>

      {/* Auth method modal */}
      <Modal visible={!!selectedRole} transparent animationType="slide" onRequestClose={() => !loading && setSelectedRole(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => !loading && setSelectedRole(null)}>
          <Pressable onPress={() => {}} style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Регистрация{'\n'}<Text style={styles.serif}>{selectedRole === 'worker' ? 'исполнителя' : 'заказчика'}</Text>
            </Text>
            <MonoTag style={{ marginBottom: 18 }}>выбери способ входа</MonoTag>

            <PrimaryButton title="По номеру телефона" icon="call" onPress={handlePhone} style={{ marginBottom: 10 }} />
            <GhostButton title="Через Google" icon="google" onPress={() => socialFlow('google')} style={{ marginBottom: 10 }} />
            {Platform.OS === 'ios' && <GhostButton title="Через Apple" icon="apple" onPress={() => socialFlow('apple')} />}

            {loading && <ActivityIndicator color={COLORS.fg} style={{ marginTop: 14 }} />}
            <TouchableOpacity onPress={() => setSelectedRole(null)} disabled={loading} style={{ alignItems: 'center', paddingTop: 18 }}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function RoleCard({ numero, letters, title, desc, accentBg, accentColor, stat, statLabel, dark, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}
      style={[styles.card, dark && { backgroundColor: COLORS.graphite }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.letterBadge, { backgroundColor: accentBg }]}>
          <Text style={[styles.letterText, { color: accentColor }]}>{letters}</Text>
        </View>
        <Text style={[styles.cardNum, dark && { color: 'rgba(244,241,234,0.5)' }]}>№ {numero}</Text>
      </View>
      <Text style={[styles.cardTitle, dark && { color: COLORS.fgInv }]}>{title}</Text>
      <Text style={[styles.cardDesc, dark && { color: 'rgba(244,241,234,0.62)' }]}>{desc}</Text>

      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.cardStatLabel, dark && { color: 'rgba(244,241,234,0.5)' }]}>{statLabel}</Text>
          <Text style={[styles.cardStat, dark && { color: COLORS.signal }]}>{stat}</Text>
        </View>
        <View style={[styles.arrowCircle, { backgroundColor: dark ? COLORS.signal : COLORS.ink }]}>
          <Icon name="arrow" size={18} color={dark ? COLORS.ink : COLORS.signal} strokeWidth={2} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 14,
  },
  wordmark: { fontFamily: FAMILIES.display, fontSize: 18, color: COLORS.ink, letterSpacing: -0.6 },
  dot: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic', color: COLORS.live },

  headingBlock: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 },
  heading: { fontFamily: FAMILIES.display, fontSize: 44, lineHeight: 44, letterSpacing: -2, color: COLORS.ink },
  serif: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic' },
  subheading: { fontFamily: FAMILIES.text, fontSize: 14, color: COLORS.fgMuted, marginTop: 12 },

  card: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radiusBlock,
    padding: 20, borderWidth: 1, borderColor: COLORS.lineSoft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  letterBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontFamily: FAMILIES.display, fontSize: 22, letterSpacing: -1 },
  cardNum: { fontFamily: FAMILIES.mono, fontSize: 11, color: COLORS.fgFaint, letterSpacing: 1 },
  cardTitle: { fontFamily: FAMILIES.display, fontSize: 26, color: COLORS.ink, letterSpacing: -1, lineHeight: 28 },
  cardDesc: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.fgMuted, marginTop: 8, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 18 },
  cardStatLabel: { fontFamily: FAMILIES.mono, fontSize: 9.5, color: COLORS.fgFaint, letterSpacing: 1, textTransform: 'uppercase' },
  cardStat: { fontFamily: FAMILIES.display, fontSize: 30, color: COLORS.ink, letterSpacing: -1.5, marginTop: 4 },
  arrowCircle: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  loginLink: { flexDirection: 'row', justifyContent: 'center', paddingTop: 22 },
  loginText: { fontFamily: FAMILIES.text, fontSize: 13, color: COLORS.fgMuted },
  loginAccent: { fontFamily: FAMILIES.textBold, fontSize: 13, color: COLORS.ink },

  // Bottom sheet
  overlay: { flex: 1, backgroundColor: 'rgba(14,15,12,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.paper, paddingHorizontal: 22, paddingTop: 12, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  sheetHandle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: COLORS.line, marginBottom: 18 },
  sheetTitle: { fontFamily: FAMILIES.display, fontSize: 30, lineHeight: 32, letterSpacing: -1.2, color: COLORS.ink, marginBottom: 6 },
  cancelText: { fontFamily: FAMILIES.textSemi, fontSize: 14, color: COLORS.fgMuted },
});
