/**
 * Firebase init for React Native (native).
 *
 * Only Auth. Firestore is never touched from the phone: on many Belarusian
 * ISPs firestore.googleapis.com is unreachable, so all data goes through
 * our own API (services/api.js). Auth lives on a different host and works.
 *
 * Phone Auth needs the native SDK — the JS SDK's reCAPTCHA verifier does
 * not work in React Native. The native SDK auto-initialises from
 * google-services.json (Android) and GoogleService-Info.plist (iOS).
 */

import authModule from '@react-native-firebase/auth';

export const auth = authModule();
export { authModule as authNS };
