/**
 * Delete-account row.
 *
 * App Store Review Guideline 5.1.1(v): an app that offers account creation
 * must let people start deleting the account from inside the app. Two
 * confirmations — this is one of the two places Alert is allowed (the other
 * is cancelling a confirmed shift), because it is irreversible.
 */
import React, { useState } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { SettingRow } from '../design/ui';
import { haptic } from '../design/haptics';
import { useTheme } from '../design/theme';
import useStore from '../store/useStore';

export default function DeleteAccountRow({ last = true }) {
  const { c } = useTheme();
  const deleteAccount = useStore((s) => s.deleteAccount);
  const role = useStore((s) => s.currentUser?.role);
  const [busy, setBusy] = useState(false);

  const what = role === 'employer'
    ? 'профиль компании, все смены, отклики на них, переписка и отзывы'
    : 'профиль, отклики, переписка, отзывы и сохранённые смены';

  const run = async () => {
    setBusy(true);
    try {
      const r = await deleteAccount();
      if (r?.success) { haptic.medium(); return; }
      if (r?.requiresRecentLogin) {
        Alert.alert('Нужен повторный вход', 'Удалить аккаунт можно сразу после входа — так мы проверяем, что это ты. Выйди, войди заново и повтори.');
        return;
      }
      Alert.alert('Не получилось удалить', r?.message || 'Попробуй ещё раз чуть позже.');
    } finally {
      setBusy(false);
    }
  };

  const ask = () => Alert.alert(
    'Удалить аккаунт?',
    `Безвозвратно удалятся: ${what}.`,
    [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Продолжить', style: 'destructive',
        onPress: () => Alert.alert('Точно удалить?', 'Восстановить аккаунт будет невозможно.', [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Удалить навсегда', style: 'destructive', onPress: run },
        ]),
      },
    ],
  );

  return (
    <SettingRow
      icon="trash"
      title={busy ? 'Удаляем…' : 'Удалить аккаунт'}
      sub="Аккаунт и все данные удаляются безвозвратно"
      destructive
      onPress={busy ? undefined : ask}
      right={busy ? <ActivityIndicator size="small" color={c.destructive} /> : undefined}
      last={last}
    />
  );
}
