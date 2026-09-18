/**
 * Crash reports and a small funnel.
 *
 * Launching without these is launching blind: a crash on someone's phone
 * is invisible, and so is the answer to the only question that matters
 * early on — how many people who open a shift actually apply.
 *
 * Both run on Firebase, the project the app already uses. Events carry no
 * names, phones or message text: an id and a screen name are enough to
 * see where people stop.
 */
import analyticsModule from '@react-native-firebase/analytics';
import crashlyticsModule from '@react-native-firebase/crashlytics';

const analytics = () => analyticsModule();
const crashlytics = () => crashlyticsModule();

/** Nothing here may ever break a screen; telemetry is not worth a crash. */
const quiet = (fn) => {
  try {
    const out = fn();
    if (out && typeof out.catch === 'function') out.catch(() => {});
  } catch (e) {
    // Module missing in this build, or a disabled analytics collection.
  }
};

/**
 * The funnel, in the words of the product:
 * feed → shift → apply → answer. Plus the two employer moments.
 */
export const track = (event, params) => quiet(() => analytics().logEvent(event, params));

export const EVENTS = {
  shiftOpened: (shift) => track('shift_opened', { shift_id: shift?.id, urgent: !!shift?.urgent, pay: shift?.pay }),
  applyStarted: (shiftId) => track('apply_started', { shift_id: shiftId }),
  applySent: (shiftId) => track('apply_sent', { shift_id: shiftId }),
  applyFailed: (shiftId, reason) => track('apply_failed', { shift_id: shiftId, reason }),
  signInStarted: (method) => track('sign_in_started', { method }),
  signInDone: (role) => track('sign_in_done', { role }),
  shiftPublished: (count) => track('shift_published', { count }),
  applicationAnswered: (answer) => track('application_answered', { answer }),
};

/** Who is looking, in Firebase's terms — id only, and the role. */
export const identify = (user) => quiet(() => {
  analytics().setUserId(user?.id || null);
  analytics().setUserProperty('role', user?.role || null);
  crashlytics().setUserId(user?.id || '');
});

export const screen = (name) => quiet(() => analytics().logScreenView({ screen_name: name, screen_class: name }));

/**
 * An error worth looking at later. Offline is not one of those — it says
 * something about the person's train, not about the app.
 */
export const reportError = (error, context) => quiet(() => {
  if (!error || error.code === 'offline') return;
  if (context) crashlytics().log(context);
  crashlytics().recordError(error instanceof Error ? error : new Error(String(error?.message || error)));
});
