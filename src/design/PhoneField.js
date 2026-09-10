// Phone capsule: 54 pt on fill, fixed «+375» prefix, a hairline divider,
// then the local number formatted as «29 644-18-02».
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import T from './Text';
import { useTheme } from './theme';

/** Digits after +375, max 9: operator code (2) + number (7). */
export function formatLocal(digits) {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  if (parts.length <= 1) return parts.join('');
  return `${parts[0]} ${parts.slice(1).join('-')}`;
}

export const toE164 = (digits) => `+375${digits.replace(/\D/g, '').slice(0, 9)}`;
export const isComplete = (digits) => digits.replace(/\D/g, '').length === 9;

/** '+375296441802' → '+375 29 644-18-02' */
export function prettyPhone(e164 = '') {
  const d = String(e164).replace(/\D/g, '');
  if (!d.startsWith('375') || d.length < 12) return e164;
  return `+375 ${formatLocal(d.slice(3))}`;
}

export default function PhoneField({ value, onChange, autoFocus, onSubmit, error }) {
  const { c } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 27,
      backgroundColor: c.fill, paddingHorizontal: 20,
      borderWidth: error ? 2 : 0, borderColor: c.destructive,
    }}>
      <T v="value" style={{ fontSize: 19, lineHeight: 24 }}>+375</T>
      <View style={{ width: StyleSheet.hairlineWidth * 2, height: 22, backgroundColor: c.separator }} />
      <TextInput
        value={formatLocal(value)}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 9))}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus={autoFocus}
        placeholder="29 000-00-00"
        placeholderTextColor={c.labelTertiary}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        maxLength={12}
        accessibilityLabel="Номер телефона без кода страны"
        style={{ flex: 1, fontSize: 19, fontWeight: '500', color: c.label, fontVariant: ['tabular-nums'], paddingVertical: 0 }}
      />
    </View>
  );
}
