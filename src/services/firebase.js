/**
 * Firebase init for React Native (native).
 *
 * Uses @react-native-firebase, which auto-initializes from
 * google-services.json (Android) and GoogleService-Info.plist (iOS).
 *
 * For Phone Auth this is REQUIRED — Firebase JS SDK's reCAPTCHA verifier
 * does not work in React Native. Native SDK uses Play Integrity for
 * silent verification on Android.
 */

import authModule from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';

// Lazy/proxy accessors so callers can use `auth` and `db` like before.
export const auth = authModule();
export const db = firestoreModule();

// Re-export the modules for callers needing static helpers
// (e.g. firestore.FieldValue.serverTimestamp())
export { authModule as authNS, firestoreModule as firestoreNS };
