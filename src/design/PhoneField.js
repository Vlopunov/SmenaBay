// Phone field: fixed «+375» prefix, a divider, then the local number
// formatted as «29 644-18-02».
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

// Field: 54 pt on surface with a 1 pt line; focus — 2 pt brand; error —
// 2 pt error (the message lives under the field, as text and a sign).
export default function PhoneField({ value, onChange, autoFocus, onSubmit, error, editable = true }) {
  const { c } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const border = error ? c.error : focused ? c.brand : c.line;
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 16,
      backgroundColor: editable ? c.surface : c.surface2, paddingHorizontal: focused || error ? 15 : 16,
      borderWidth: focused || error ? 2 : 1, borderColor: border,
    }}>
      <T v="bodyStrong" style={{ fontSize: 18, lineHeight: 22 }}>+375</T>
      <View style={{ width: 1, height: 20, backgroundColor: c.line }} />
      <TextInput
        value={formatLocal(value)}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 9))}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus={autoFocus}
        editable={editable}
        placeholder="29 000-00-00"
        placeholderTextColor={c.inkDisabled}
        onSubmitEditing={onSubmit}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="done"
        maxLength={12}
        accessibilityLabel="Номер телефона без кода страны"
        style={{ flex: 1, fontSize: 18, fontWeight: '600', color: c.ink, fontVariant: ['tabular-nums'], paddingVertical: 0 }}
      />
    </View>
  );
}
