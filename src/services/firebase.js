/**
 * Firebase init for React Native (native).
 *
 * Uses @react-native-firebase/auth which auto-initialises from
 * google-services.json (Android) and GoogleService-Info.plist (iOS).
 *
 * Phone Auth requires the native SDK — Firebase JS SDK reCAPTCHA verifier
 * does not work in React Native. The native SDK uses Play Integrity on
 * Android and APNs/SafetyNet on iOS for silent verification.
 *
 * NOTE: @react-native-firebase/firestore is intentionally NOT installed.
 * It does not compile under iOS useFrameworks: "static" without extra
 * gRPC pod config, and we don't use Firestore at runtime (USE_FIRESTORE
 * is false in services/firestore.js — all CRUD calls short-circuit).
 */

import authModule from '@react-native-firebase/auth';

export const auth = authModule();
export { authModule as authNS };

// Stub so legacy firestore.js / firestoreSync.js can keep importing
// `db` / `firestoreNS` at module scope without crashing at load time.
// All Firestore functions in services/firestore.js are gated behind
// USE_FIRESTORE === false, so the stub is never actually exercised.
const noop = () => {
  throw new Error('Firestore is disabled in this build (USE_FIRESTORE=false)');
};
export const db = new Proxy({}, { get: noop });
export const firestoreNS = new Proxy(
  { FieldValue: { serverTimestamp: noop, arrayUnion: noop, increment: noop } },
  { get: (t, p) => p in t ? t[p] : noop }
);
