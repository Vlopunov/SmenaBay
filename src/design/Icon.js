import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { useTheme } from './theme';

// SF Symbols on iOS (the handoff's icon table). Android has no SF Symbols,
// so every name maps to the closest Ionicons glyph — the app also ships on
// Google Play.
const ANDROID = {
  // categories
  'shippingbox': 'cube-outline',
  'tray.2': 'file-tray-stacked-outline',
  'bicycle': 'bicycle-outline',
  'fork.knife': 'restaurant-outline',
  'megaphone': 'megaphone-outline',
  'sparkles': 'sparkles-outline',
  'hammer': 'hammer-outline',
  'bag': 'bag-outline',
  'gearshape.2': 'cog-outline',
  // content (only three are allowed in content: bolt, star, timer)
  'bolt.fill': 'flash',
  'star.fill': 'star',
  'star': 'star-outline',
  'timer': 'timer-outline',
  // statuses
  'clock': 'time-outline',
  'checkmark.circle': 'checkmark-circle-outline',
  'checkmark.circle.fill': 'checkmark-circle',
  'checkmark.seal': 'ribbon-outline',
  'slash.circle': 'ban-outline',
  'person.slash': 'person-remove-outline',
  // control layer
  'location.fill': 'navigate',
  'location': 'locate-outline',
  'lock.shield': 'shield-outline',
  'checkmark.shield': 'shield-checkmark-outline',
  'creditcard': 'card-outline',
  'briefcase': 'briefcase-outline',
  'briefcase.fill': 'briefcase',
  'ticket': 'ticket-outline',
  'ticket.fill': 'ticket',
  'bubble.left.and.bubble.right': 'chatbubbles-outline',
  'bubble.left.and.bubble.right.fill': 'chatbubbles',
  'bubble.left': 'chatbubble-outline',
  'person.crop.circle': 'person-circle-outline',
  'person.crop.circle.fill': 'person-circle',
  'chart.bar': 'bar-chart-outline',
  'chart.bar.fill': 'bar-chart',
  'list.bullet': 'list',
  'map': 'map-outline',
  'line.3.horizontal.decrease': 'filter',
  'magnifyingglass': 'search',
  'chevron.left': 'chevron-back',
  'chevron.right': 'chevron-forward',
  'chevron.down': 'chevron-down',
  'ellipsis': 'ellipsis-horizontal',
  'plus': 'add',
  'minus': 'remove',
  'checkmark': 'checkmark',
  'xmark': 'close',
  'xmark.circle': 'close-circle-outline',
  'paperplane.fill': 'paper-plane',
  'exclamationmark.circle': 'alert-circle-outline',
  'info.circle': 'information-circle-outline',
  'bell': 'notifications-outline',
  'camera': 'camera-outline',
  'photo': 'image-outline',
  'square.and.arrow.up': 'share-outline',
  'bookmark': 'bookmark-outline',
  'bookmark.fill': 'bookmark',
  'flag': 'flag-outline',
  'hand.raised': 'hand-left-outline',
  'trash': 'trash-outline',
  'rectangle.portrait.and.arrow.right': 'log-out-outline',
  'doc.text': 'document-text-outline',
  'person.2': 'people-outline',
  'mappin.and.ellipse': 'location-outline',
  'building.2': 'business-outline',
  'phone': 'call-outline',
  'arrow.clockwise': 'refresh',
  'questionmark.circle': 'help-circle-outline',
  'person.badge.plus': 'person-add-outline',
  'wifi.slash': 'cloud-offline-outline',
  'calendar': 'calendar-outline',
  'heart': 'heart-outline',
  'heart.fill': 'heart',
  'envelope': 'mail-outline',
  'paperplane': 'paper-plane-outline',
  'person': 'person-outline',
  'arrow.up.right': 'open-outline',
  'delete.left': 'backspace-outline',
  'apple.logo': 'logo-apple',
};

const COLOR_ROLES = {
  label: 'label',
  secondary: 'labelSecondary',
  tertiary: 'labelTertiary',
  accent: 'accent',
  destructive: 'destructive',
  onAccent: 'onAccent',
  onInk: 'onInk',
  ink: 'ink',
};

/**
 * <Icon name="bolt.fill" size={11} c="label" weight="semibold" />
 * `size` is the point size of the glyph box.
 */
export default function Icon({ name, size = 17, c = 'label', weight = 'regular', style }) {
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
