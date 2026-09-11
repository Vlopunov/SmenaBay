/**
 * «···» menu with report / block for user-generated content.
 *
 * App Store Review Guideline 1.2 requires apps with user-generated content to
 * let people report objectionable material and block abusive users. Blocked
 * users are filtered out wherever lists render, via `blockedUsers`.
 *
 *   <ReportMenu targetType="user" targetId={worker.id} targetName="Дарья" />
 *   <ReportMenu targetType="shift" targetId={shift.id} blockUserId={company.id}
 *               extra={[{ label: 'Сохранить', onPress: save }]} />
 */
import React from 'react';
import { Alert } from 'react-native';
import { CircleButton } from '../design/ui';
import { showActions } from '../design/ActionSheet';
import { haptic } from '../design/haptics';
import useStore from '../store/useStore';

const REASONS = [
  { key: 'spam', label: 'Спам или реклама' },
  { key: 'scam', label: 'Мошенничество' },
  { key: 'offensive', label: 'Оскорбления или травля' },
  { key: 'inappropriate', label: 'Непристойный контент' },
  { key: 'other', label: 'Другое' },
];

export function openReportMenu({ targetType, targetId, targetName = '', blockUserId = null, extra = [], store }) {
  const { reportContent, blockUser, unblockUser, blockedUsers, currentUser } = store;
  const blockTarget = blockUserId || (targetType === 'user' ? targetId : null);
  const isBlocked = !!blockTarget && blockedUsers.includes(blockTarget);
  const isSelf = blockTarget && blockTarget === currentUser?.id;

  const report = () => showActions({
    title: 'Причина жалобы',
    message: targetName || undefined,
    options: REASONS.map((r) => ({
      label: r.label,
      onPress: () => {
        reportContent({ targetType, targetId, reason: r.key });
        haptic.success();
        Alert.alert('Жалоба отправлена', 'Спасибо. Рассмотрим её в течение 24 часов и примем меры, если правила нарушены.');
      },
    })),
  });

  const block = () => Alert.alert(
    'Заблокировать?',
    `${targetName || 'Этот пользователь'} не сможет тебе писать, а его смены и отзывы пропадут из твоих списков.`,
    [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Заблокировать', style: 'destructive', onPress: () => { blockUser(blockTarget); haptic.medium(); } },
    ],
  );

  const options = [...extra];
  if (currentUser) options.push({ label: 'Пожаловаться', onPress: report });
  if (currentUser && blockTarget && !isSelf) {
    options.push(isBlocked
      ? { label: 'Разблокировать', onPress: () => unblockUser(blockTarget) }
      : { label: 'Заблокировать', destructive: true, onPress: block });
  }
  if (options.length === 0) return;
  showActions({ title: targetName || undefined, options });
}

export default function ReportMenu(props) {
  // Read the store at tap time — subscribing here would re-render the
  // button on every store change.
  return (
    <CircleButton
      icon="ellipsis"
      accessibilityLabel="Ещё: пожаловаться или заблокировать"
      onPress={() => openReportMenu({ ...props, store: useStore.getState() })}
    />
  );
}
