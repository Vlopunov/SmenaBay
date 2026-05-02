import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FONTS } from '../constants/theme';

const PALETTE = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B',
  '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#F97316',
];

function getColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function getInitials(name, name2) {
  if (name && name2) {
    return (name[0] + name2[0]).toUpperCase();
  }
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return '?';
}

export default function Avatar({ uri, name, name2, size = 48, style }) {
  const hasImage = uri && !uri.includes('pravatar.cc');

  if (hasImage) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#E5E7EB' }, style]}
      />
    );
  }

  const initials = getInitials(name, name2);
  const bg = getColor(name || '');
  const fontSize = size * 0.38;

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { justifyContent: 'center', alignItems: 'center' },
  initials: { color: '#FFFFFF', ...FONTS.bold },
});
