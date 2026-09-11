import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { useTheme } from './theme';

// Control layer: SF Symbols on iOS (Phase 3 table). Android has no SF
// Symbols, so each name maps to the closest Ionicons glyph.
const ANDROID = {
  // tabs
  'briefcase': 'briefcase-outline',
  'briefcase.fill': 'briefcase',
  'calendar.badge.checkmark': 'calendar-outline',
  'bubble.left': 'chatbubble-outline',
  'bubble.left.fill': 'chatbubble',
  'person.crop.circle': 'person-circle-outline',
  'person.crop.circle.fill': 'person-circle',
  'chart.bar': 'bar-chart-outline',
  'chart.bar.fill': 'bar-chart',
  'rectangle.portrait.and.arrow.right': 'log-in-outline',
  // content — only three glyphs carry meaning in content
  'bolt.fill': 'flash',
  'star.fill': 'star',
  'star': 'star-outline',
  'timer': 'timer-outline',
  // statuses
  'checkmark.circle.fill': 'checkmark-circle',
  'checkmark.circle': 'checkmark-circle-outline',
  'clock': 'time-outline',
  'nosign': 'ban-outline',
  'checkmark': 'checkmark',
  'xmark.circle': 'close-circle-outline',
  'circle.fill': 'ellipse',
  // actions
  'chevron.left': 'chevron-back',
  'chevron.right': 'chevron-forward',
  'chevron.down': 'chevron-down',
  'ellipsis': 'ellipsis-horizontal',
  'magnifyingglass': 'search',
  'line.3.horizontal.decrease': 'filter',
  'list.bullet': 'list',
  'map': 'map-outline',
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'bell': 'notifications-outline',
  'bell.badge': 'notifications',
  'arrow.triangle.turn.up.right.diamond': 'navigate-outline',
  'arrow.triangle.turn.up.right.diamond.fill': 'navigate',
  'bookmark': 'bookmark-outline',
  'bookmark.fill': 'bookmark',
  'square.and.arrow.up': 'share-outline',
  'exclamationmark.bubble': 'chatbox-ellipses-outline',
  'hand.raised': 'hand-left-outline',
  'wifi.slash': 'cloud-offline-outline',
  'exclamationmark.circle': 'alert-circle-outline',
  'exclamationmark.triangle': 'warning-outline',
  'trash': 'trash-outline',
  'paperplane.fill': 'paper-plane',
  'camera': 'camera-outline',
  'photo': 'image-outline',
  'lock.fill': 'lock-closed',
  'lock': 'lock-closed-outline',
  'shield': 'shield-outline',
  'checkmark.shield': 'shield-checkmark-outline',
  'questionmark.circle': 'help-circle-outline',
  'doc.text': 'document-text-outline',
  'person': 'person-outline',
  'person.2': 'people-outline',
  'person.badge.plus': 'person-add-outline',
  'person.crop.circle.badge.checkmark': 'person-circle-outline',
  'heart': 'heart-outline',
  'heart.fill': 'heart',
  'mappin.and.ellipse': 'location-outline',
  'building.2': 'business-outline',
  'phone': 'call-outline',
  'envelope': 'mail-outline',
  'paperplane': 'paper-plane-outline',
  'arrow.up.right': 'open-outline',
  'arrow.clockwise': 'refresh',
  'calendar': 'calendar-outline',
  'info.circle': 'information-circle-outline',
  'banknote': 'cash-outline',
  'creditcard': 'card-outline',
  'gearshape': 'settings-outline',
  'moon': 'moon-outline',
  'delete.left': 'backspace-outline',
  'apple.logo': 'logo-apple',
  'text.bubble': 'chatbox-outline',
  'checkmark.seal': 'ribbon-outline',
  'slash.circle': 'ban-outline',
  'person.slash': 'person-remove-outline',
  'location': 'locate-outline',
  'location.fill': 'navigate',
  'arrow.right': 'arrow-forward',
  'person.fill.checkmark': 'person',
};

const COLOR_ROLES = {
  ink: 'ink',
  ink2: 'ink2',
  ink3: 'ink3',
  disabled: 'inkDisabled',
  brand: 'brand',
  onBrand: 'onBrand',
  success: 'success',
  error: 'error',
  urgent: 'urgent',
  star: 'star',
  // Legacy roles.
  label: 'ink',
  secondary: 'ink2',
  tertiary: 'inkDisabled',
  accent: 'brand',
  destructive: 'error',
  onAccent: 'onBrand',
  onInk: 'bg',
};

/**
 * <Icon name="bolt.fill" size={12} c="urgent" weight="semibold" />
 * `size` is the point size of the glyph box; weight matches adjacent text.
 */
export default function Icon({ name, size = 17, c = 'ink', weight = 'regular', style }) {
  const theme = useTheme();
  const color = COLOR_ROLES[c] ? theme.c[COLOR_ROLES[c]] : c;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={size}
        tintColor={color}
        weight={weight}
        resizeMode="scaleAspectFit"
        style={[{ width: size, height: size }, style]}
      />
    );
  }
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={ANDROID[name] || 'ellipse-outline'} size={size} color={color} />
    </View>
  );
}
