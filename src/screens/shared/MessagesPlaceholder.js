import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function MessagesPlaceholder() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Сообщения</Text>
      </View>
      <View style={styles.placeholder}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.pTitle}>Скоро появится</Text>
        <Text style={styles.pText}>Чат с заказчиками и исполнителями{'\n'}в следующем обновлении</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  title: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  pTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
  pText: { fontSize: SIZES.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm, lineHeight: 22 },
});
