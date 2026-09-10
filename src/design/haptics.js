// Haptics are tied to meaning, not to motion (handoff «Движение»):
// success on the first frame of the apply morph, error with the first
// shake, selection when switching list ⇄ map. One per user action, never
// on scroll, never the only feedback.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const safe = (fn) => () => {
  if (Platform.OS === 'web') return;
  fn().catch(() => {});
};

export const haptic = {
  selection: safe(() => Haptics.selectionAsync()),
  light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
