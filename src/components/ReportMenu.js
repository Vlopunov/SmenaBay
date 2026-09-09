/**
 * Report / block control for user-generated content.
 *
 * App Store Review Guideline 1.2 requires apps with user-generated content
 * to provide a method for filtering objectionable material, a mechanism to
 * report it, and the ability to block abusive users. This is the reporting
 * and blocking half; filtering happens where lists are rendered, via
 * `useStore().blockedUsers`.
 *
 * Usage:
 *   <ReportMenu targetType="user" targetId={worker.id} targetName="Дарья" />
 *   <ReportMenu targetType="shift" targetId={shift.id} blockUserId={company.id} />
 */
import React from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import useStore from '../store/useStore';

const REASONS = [
  { key: 'spam', label: 'Спам или реклама' },
  { key: 'scam', label: 'Мошенничество' },
  { key: 'offensive', label: 'Оскорбления или травля' },
  { key: 'inappropriate', label: 'Непристойный контент' },
  { key: 'other', label: 'Другое' },
];

export default function ReportMenu({
  targetType,
  targetId,
  targetName = '',
  // Who to block. For a shift or a message this is the author, not the item.
  blockUserId = null,
  size = 22,
  color = COLORS.textSecondary,
  style,
}) {
  const reportContent = useStore(s => s.reportContent);
  const blockUser = useStore(s => s.blockUser);
  const unblockUser = useStore(s => s.unblockUser);
  const blockedUsers = useStore(s => s.blockedUsers);
  const currentUser = useStore(s => s.currentUser);

  const blockTarget = blockUserId || (targetType === 'user' ? targetId : null);
  const isBlocked = !!blockTarget && blockedUsers.includes(blockTarget);
  const isSelf = blockTarget && blockTarget === currentUser?.id;

  const submitReport = (reason) => {
    reportContent({ targetType, targetId, reason });
    Alert.alert(
      'Жалоба отправлена',
      'Спасибо. Мы рассмотрим её в течение 24 часов и примем меры, если правила были нарушены.'
    );
  };

  const openReasonPicker = () => {
    Alert.alert(
      'Причина жалобы',
      targetName ? `На: ${targetName}` : '',
      [
        ...REASONS.map(r => ({ text: r.label, onPress: () => submitReport(r.key) })),
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const confirmBlock = () => {
    Alert.alert(
      'Заблокировать?',
      `${targetName || 'Этот пользователь'} больше не сможет писать вам, а его смены и отзывы исчезнут из ваших лент.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Заблокировать',
          style: 'destructive',
          onPress: () => {
            blockUser(blockTarget);
            Alert.alert('Готово', 'Пользователь заблокирован.');
          },
        },
      ]
    );
  };

  const openMenu = () => {
    const options = [{ text: 'Пожаловаться', onPress: openReasonPicker }];

    if (blockTarget && !isSelf) {
      options.push(
        isBlocked
          ? { text: 'Разблокировать', onPress: () => unblockUser(blockTarget) }
          : { text: 'Заблокировать', style: 'destructive', onPress: confirmBlock }
      );
    }

    options.push({ text: 'Отмена', style: 'cancel' });
    Alert.alert('Безопасность', targetName || '', options);
  };

  return (
    <TouchableOpacity
      onPress={openMenu}
      style={style}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Пожаловаться или заблокировать"
    >
      <Ionicons
        name={isBlocked ? 'ban' : 'ellipsis-horizontal'}
        size={size}
        color={isBlocked ? COLORS.error : color}
      />
    </TouchableOpacity>
  );
}
