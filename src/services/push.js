/**
 * Push notifications.
 *
 * The product promises «ответ придёт в уведомления», so this is not a
 * nicety: a worker who applied and put the phone away has to hear back,
 * and an employer has to know a person is waiting.
 *
 * Tokens are Expo push tokens; the server sends through Expo's service
 * (see the web repo's lib/push.ts). Permission is asked for at the moment
 * it means something — right after someone signs in — not on first launch.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as backend from './backend';

let registeredToken = null;
let handlerSet = false;

/**
 * A build without the notifications module (or without the push
 * entitlement) must still run: nothing here is allowed to take the app
 * down on launch.
 */
function setHandler() {
  if (handlerSet) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    handlerSet = true;
  } catch (e) {
    console.warn('[push] no notifications module', e?.message);
  }
}

/** Android needs a channel before anything shows up at all. */
async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Смены и сообщения',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#0F5673',
  });
}

/**
 * Ask (once) and hand the token to the server.
 * Returns the token, or null when the person said no, the build has no
 * push entitlement, or this is a simulator.
 */
export async function registerForPush() {
  if (!Device.isDevice) return null;
  try {
    setHandler();
    await ensureChannel();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const asked = await Notifications.requestPermissionsAsync();
      status = asked.status;
    }
    if (status !== 'granted') return null;

    const projectId = require('../../app.json')?.expo?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    if (!token || token === registeredToken) return token || null;

    await backend.registerPushToken(token, Platform.OS);
    registeredToken = token;
    return token;
  } catch (e) {
    // A build without the push entitlement throws here. Not being able to
    // send pushes is not a reason to break signing in.
    console.warn('[push]', e?.message);
    return null;
  }
}

/** On logout: this phone should stop getting that person's notifications. */
export async function unregisterPush() {
  if (!registeredToken) return;
  try {
    await backend.unregisterPushToken(registeredToken);
  } catch (e) {
    // The token dies with the account anyway.
  }
  registeredToken = null;
}

/**
 * Where a tapped notification should land. The payload mirrors the
 * server's `data`; anything unknown opens the app as usual.
 */
export function routeForNotification(data) {
  if (!data) return null;
  if (data.route) return String(data.route);
  switch (data.type) {
    case 'application': return data.shiftId ? `applications/${data.shiftId}` : 'dashboard';
    case 'approved':
    case 'rejected':
    case 'reminder': return data.shiftId ? `shift/${data.shiftId}` : 'my';
    case 'message': return data.conversationId ? `chat/${data.conversationId}` : 'chats';
    default: return data.shiftId ? `shift/${data.shiftId}` : null;
  }
}

/**
 * Wire taps to navigation. Handles both a tap on a banner while the app is
 * open and a cold start from a notification.
 */
export function attachNotificationTaps(open) {
  setHandler();
  let sub;
  try {
    sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const route = routeForNotification(response?.notification?.request?.content?.data);
      if (route) open(route);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const route = routeForNotification(response?.notification?.request?.content?.data);
      if (route) open(route);
    }).catch(() => {});
  } catch (e) {
    console.warn('[push] taps unavailable', e?.message);
  }
  return () => { try { sub?.remove(); } catch (e) { /* already gone */ } };
}

/** Clear the red dot when the person has read everything. */
export const setBadge = (n) => {
  try {
    Notifications.setBadgeCountAsync(Math.max(0, n || 0)).catch(() => {});
  } catch (e) {
    // No notifications module in this build.
  }
};
