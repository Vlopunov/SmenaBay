import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

// "online" if lastSeen within 15 minutes, otherwise "offline"
export function getOnlineStatus(lastSeen) {
  if (!lastSeen) return 'offline';
  const diff = (Date.now() - new Date(lastSeen).getTime()) / 1000;
  if (diff < 900) return 'online';
  return 'offline';
}

export function formatLastSeen(lastSeen) {
  if (!lastSeen) return '';
  const status = getOnlineStatus(lastSeen);
  if (status === 'online') return 'в сети';
  const d = new Date(lastSeen);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const seenDate = d.toISOString().split('T')[0];
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (seenDate === today) return `был(а) сегодня в ${time}`;
  return `был(а) ${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')} в ${time}`;
}

export default function OnlineDot({ lastSeen, size = 12, style }) {
  const status = getOnlineStatus(lastSeen);
  const color = status === 'online' ? '#22C55E' : '#9CA3AF';

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: size > 10 ? 2 : 1.5,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderColor: COLORS.white,
  },
});
