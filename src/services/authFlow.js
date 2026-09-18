// Registration happens at the moment of applying, not at launch
// (handoff: «Регистрация не встречает на входе»). This holds the in-flight
// sign-in so that after the SMS code the person lands exactly where they
// were, with the action they started already done.
//
// Not persisted: a Firebase confirmation object can't be serialised, and a
// half-finished sign-in shouldn't survive an app restart anyway.
import { create } from 'zustand';
import { Alert } from 'react-native';
import useStore from '../store/useStore';

export const useAuthFlow = create((set) => ({
  phone: '',
  verification: null,
  // { type: 'apply', shiftId } | { type: 'signin' } | { type: 'verify-phone', then } | { type: 'employer', form }
  intent: { type: 'signin' },
  social: null,
  start: (phone, verification, intent) => set({ phone, verification, intent: intent || { type: 'signin' } }),
  setSocial: (social) => set({ social }),
  reset: () => set({ phone: '', verification: null, intent: { type: 'signin' }, social: null }),
}));

/** Run what the person was doing before we asked for their number. */
export async function runIntent(intent, navigation) {
  const store = useStore.getState();
  const user = store.currentUser;
  if (intent?.type === 'apply' || intent?.then?.type === 'apply') {
    const shiftId = intent.shiftId || intent.then.shiftId;
    if (user?.role !== 'worker') {
      Alert.alert('Это номер заказчика', 'Откликаться на смены можно из аккаунта исполнителя.');
      navigation.popToTop();
      return;
    }
    const result = await store.applyToShift(shiftId);
    navigation.navigate('ShiftDetail', { shiftId, applyResult: result?.error || 'sent', t: Date.now() });
    return;
  }
  // Only confirming a number (e.g. from the new-shift form): go back to the
  // form with everything still filled in.
  if (intent?.type === 'verify-phone') { navigation.goBack(); return; }
  navigation.popToTop();
}

/**
 * Called once the SMS code is confirmed. Signs the person in if the number
 * is known, finishes a phone verification for someone already signed in, or
 * sends a new worker to the one-field name step.
 */
export async function completeSignIn(navigation) {
  const { phone, intent } = useAuthFlow.getState();
  const store = useStore.getState();

  if (intent?.type === 'verify-phone' && store.currentUser) {
    store.updateProfile({ phone, phoneVerified: true });
    await runIntent(intent, navigation);
    useAuthFlow.getState().reset();
    return;
  }

  if (intent?.type === 'employer') {
    // The account is the Firebase user; the server either has a profile for
    // it already or this call creates the company.
    const existing = await store.hasProfile().catch(() => false);
    if (!existing) {
      await store.registerEmployer({ ...intent.form, phone, phoneVerified: true });
    }
    useAuthFlow.getState().reset();
    navigation.popToTop();
    return;
  }

  // Signed in. If the server knows this number, we are done; if not, this
  // is a new worker and the name step finishes registration.
  let known = false;
  try {
    known = await store.hasProfile();
  } catch (e) {
    Alert.alert('Не получилось войти', e?.message || 'Проверь интернет и попробуй ещё раз.');
    return;
  }

  if (known) {
    const user = store.currentUser;
    if (user && !user.phoneVerified) store.updateProfile({ phoneVerified: true });
    await runIntent(intent, navigation);
    useAuthFlow.getState().reset();
    return;
  }
  navigation.navigate('Name');
}

/** New worker: the name step finishes registration, then resumes the intent. */
export async function finishWorkerRegistration({ firstName, lastName }, navigation) {
  const { phone, intent, social } = useAuthFlow.getState();
  const store = useStore.getState();
  try {
    await store.registerWorker({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || '',
      phoneVerified: !!phone,
      city: 'Минск',
      categories: [],
      authMethod: social ? social.provider : 'phone',
      authUid: social?.uid || null,
      email: social?.email || null,
    });
  } catch (e) {
    Alert.alert('Не получилось создать профиль', e?.message || 'Проверь интернет и попробуй ещё раз.');
    return;
  }
  await runIntent(intent, navigation);
  useAuthFlow.getState().reset();
}
