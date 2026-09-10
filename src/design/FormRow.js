// Editable ledger line: the same «label — value» geometry as read-only rows,
// so a form reads like the record it produces.
import React from 'react';
import { View, TextInput } from 'react-native';
import T from './Text';
import { Separator } from './ui';
import { useTheme } from './theme';

export default function FormRow({ label, value, onChangeText, placeholder, error, hint, multiline, keyboardType, autoCapitalize = 'sentences', maxLength, last, textContentType, right, inputRef, onSubmitEditing, returnKeyType }) {
  const { c } = useTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: multiline ? 'flex-start' : 'center', gap: 14, paddingHorizontal: 22, paddingTop: 13, paddingBottom: 14, minHeight: 52 }}>
        <T v="caption" c={error ? 'destructive' : 'secondary'} style={{ width: 84, lineHeight: 19, paddingTop: multiline ? 1 : 0 }}>{label}</T>
        <View style={{ flex: 1 }}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={c.labelTertiary}
            multiline={multiline}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            maxLength={maxLength}
            textContentType={textContentType}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            accessibilityLabel={label}
            style={{ fontSize: 15, lineHeight: 20, fontWeight: '500', color: c.label, paddingVertical: 0, minHeight: multiline ? 60 : 20, fontVariant: ['tabular-nums'], textAlignVertical: multiline ? 'top' : 'center' }}
          />
          {error ? <T v="small" c="destructive" style={{ marginTop: 3 }}>{error}</T> : hint ? <T v="small" c="secondary" style={{ marginTop: 3 }}>{hint}</T> : null}
        </View>
        {right}
      </View>
      {!last ? <Separator inset /> : null}
    </View>
  );
}
