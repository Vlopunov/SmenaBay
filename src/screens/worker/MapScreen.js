import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Карта</Text>
      </View>
      <View style={styles.placeholder}>
        <Ionicons name="map-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.placeholderTitle}>Карта смен</Text>
        <Text style={styles.placeholderText}>
          Интерактивная карта с маркерами смен{'\n'}появится в следующей версии
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  title: { fontSize: SIZES.largeTitle, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.5 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: SIZES.tabBarHeight },
  placeholderTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginTop: SIZES.lg },
  placeholderText: { fontSize: SIZES.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.sm, lineHeight: 22 },
});
