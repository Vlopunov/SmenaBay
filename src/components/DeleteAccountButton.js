/**
 * Delete-account control.
 *
 * App Store Review Guideline 5.1.1(v) requires that an app offering account
 * creation also lets the user initiate deletion of the account from within
 * the app. Two-step confirmation so it can't be hit by accident, and the
 * copy spells out exactly what disappears.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import useStore from '../store/useStore';

export default function DeleteAccountButton() {
  const deleteAccount = useStore(s => s.deleteAccount);
  const currentUser = useStore(s => s.currentUser);
  const [busy, setBusy] = useState(false);

  const isEmployer = currentUser?.role === 'employer';

  const whatGetsDeleted = isEmployer
    ? 'профиль компании, все опубликованные смены, отклики на них, переписка и отзывы'
    : 'профиль, отклики на смены, переписка, отзывы и сохранённые смены';

  const runDeletion = async () => {
    setBusy(true);
    try {
      const result = await deleteAccount();
      if (result?.success) {
        // The store clears currentUser, which drops the navigator back to
        // AuthStack — nothing else to do here.
        return;
      }
      if (result?.requiresRecentLogin) {
        Alert.alert(
          'Нужен повторный вход',
          'В целях безопасности удалить аккаунт можно только сразу после входа. Выйдите, войдите заново и повторите удаление.'
        );
        return;
      }
      Alert.alert('Ошибка', result?.message || 'Не удалось удалить аккаунт.');
    } finally {
      setBusy(false);
    }
  };

  const confirmSecondStep = () => {
    Alert.alert(
      'Точно удалить?',
      'Это последнее предупреждение. Восстановить аккаунт и данные будет невозможно.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Удалить навсегда', style: 'destructive', onPress: runDeletion },
      ]
    );
  };

  const handlePress = () => {
    if (busy) return;
    Alert.alert(
      'Удалить аккаунт',
      `Будут безвозвратно удалены: ${whatGetsDeleted}.\n\nЭто действие нельзя отменить.`,
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Продолжить', style: 'destructive', onPress: confirmSecondStep },
      ]
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.btn}
        onPress={handlePress}
        disabled={busy}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Удалить аккаунт"
      >
        {busy ? (
          <ActivityIndicator size="small" color={COLORS.error} />
        ) : (
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        )}
        <Text style={styles.text}>
          {busy ? 'Удаляем…' : 'Удалить аккаунт'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Аккаунт и все связанные данные удаляются безвозвратно.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.base,
    borderRadius: SIZES.radiusMd,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginTop: SIZES.base,
  },
  text: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.error },
  hint: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SIZES.sm,
    paddingHorizontal: SIZES.base,
  },
});
