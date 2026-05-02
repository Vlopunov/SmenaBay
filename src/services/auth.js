/**
 * Auth Service — @react-native-firebase/auth
 *
 * Native Firebase SDK. Phone Auth uses Play Integrity / SafetyNet for
 * silent verification on Android (no reCAPTCHA modal for the user).
 * Requires SHA-1/SHA-256 fingerprints registered in Firebase Console
 * (App Signing key for Play Store builds).
 *
 * Google Sign-In via @react-native-google-signin/google-signin
 * Apple Sign-In via expo-apple-authentication
 */

import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Web client ID from google-services.json (oauth_client with client_type: 3)
const WEB_CLIENT_ID = '1087544794452-fgjjsc5trnvv98gu2mbjib9nka7l4as6.apps.googleusercontent.com';

let googleSigninConfigured = false;
function configureGoogleSignin() {
  if (googleSigninConfigured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  googleSigninConfigured = true;
}

// Mock mode flag (kept for backward compatibility with screens checking isMockAuth)
const FORCE_MOCK = false;

/**
 * Send verification code to phone number.
 * Returns { confirmation, mock } — confirmation has .confirm(code).
 */
export async function sendVerificationCode(phone) {
  if (FORCE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { verificationId: 'mock_' + Date.now(), mock: true };
  }

  try {
    const confirmation = await auth().signInWithPhoneNumber(phone);
    return {
      confirmation,
      verificationId: confirmation.verificationId,
      mock: false,
    };
  } catch (error) {
    const errorMessages = {
      'auth/invalid-phone-number': 'Неверный формат номера телефона',
      'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
      'auth/quota-exceeded': 'Лимит SMS исчерпан. Попробуйте позже',
      'auth/missing-client-identifier': 'Приложение не авторизовано в Firebase. Обновите версию.',
      'auth/app-not-authorized': 'Приложение не авторизовано. Обновите версию.',
      'auth/network-request-failed': 'Нет соединения с интернетом',
    };
    console.warn('[sendVerificationCode]', error?.code, error?.message);
    throw new Error(errorMessages[error?.code] || 'Ошибка отправки SMS. Попробуйте позже');
  }
}

/**
 * Verify the SMS code.
 */
export async function verifyCode(verification, code) {
  if (!verification) throw new Error('Сначала запросите код');

  if (verification.mock) {
    await new Promise(r => setTimeout(r, 500));
    if (code.length >= 4) return { success: true, uid: 'mock_uid_' + Date.now() };
    throw new Error('Введите 4-значный код');
  }

  try {
    const userCredential = await verification.confirmation.confirm(code);
    return {
      success: true,
      uid: userCredential.user.uid,
      phone: userCredential.user.phoneNumber,
    };
  } catch (error) {
    const errorMessages = {
      'auth/invalid-verification-code': 'Неверный код. Попробуйте ещё раз',
      'auth/code-expired': 'Код истёк. Запросите новый',
      'auth/session-expired': 'Код истёк. Запросите новый',
    };
    console.warn('[verifyCode]', error?.code, error?.message);
    throw new Error(errorMessages[error?.code] || 'Ошибка проверки кода');
  }
}

/**
 * Sign in with Google (native).
 */
export async function signInWithGoogle() {
  if (FORCE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, uid: 'mock_google_' + Date.now(), email: 'demo@gmail.com', displayName: 'Google User', mock: true };
  }

  try {
    configureGoogleSignin();
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo?.data?.idToken || userInfo?.idToken;
    if (!idToken) throw new Error('Не удалось получить idToken от Google');

    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);

    return {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
    };
  } catch (error) {
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) return { cancelled: true };
    if (error?.code === statusCodes.IN_PROGRESS) return { cancelled: true };
    if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services недоступны на этом устройстве');
    }
    console.warn('[signInWithGoogle]', error?.code, error?.message);
    throw new Error('Ошибка входа через Google');
  }
}

/**
 * Sign in with Apple (iOS only).
 */
export async function signInWithApple() {
  if (FORCE_MOCK) {
    await new Promise(r => setTimeout(r, 800));
    return { success: true, uid: 'mock_apple_' + Date.now(), email: 'demo@icloud.com', displayName: 'Apple User', mock: true };
  }

  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In доступен только на iOS');
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken, fullName } = credential;
    if (!identityToken) throw new Error('Не удалось получить identityToken от Apple');

    const provider = new auth.AppleAuthProvider();
    const appleCredential = auth.AppleAuthProvider.credential(identityToken);
    const userCredential = await auth().signInWithCredential(appleCredential);

    const displayName = fullName?.givenName
      ? `${fullName.givenName}${fullName.familyName ? ' ' + fullName.familyName : ''}`
      : userCredential.user.displayName;

    return {
      success: true,
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName,
    };
  } catch (error) {
    if (error?.code === 'ERR_REQUEST_CANCELED') return { cancelled: true };
    console.warn('[signInWithApple]', error?.code, error?.message);
    throw new Error('Ошибка входа через Apple');
  }
}

/**
 * Sign out current user from Firebase + Google.
 */
export async function signOut() {
  try {
    await auth().signOut();
  } catch (e) {
    console.warn('[signOut firebase]', e?.message);
  }
  try {
    if (googleSigninConfigured) await GoogleSignin.signOut();
  } catch (e) {
    // ignore
  }
}

/**
 * Listen to auth state changes.
 */
export function onAuthStateChanged(cb) {
  return auth().onAuthStateChanged(cb);
}

/**
 * Currently signed-in user (or null).
 */
export function getCurrentUser() {
  return auth().currentUser;
}

/**
 * Check if we're using mock auth.
 */
export function isMockAuth() {
  return FORCE_MOCK;
}
