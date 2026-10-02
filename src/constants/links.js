/**
 * Canonical external URLs.
 *
 * Kept in one place because App Store Connect metadata (Privacy Policy URL,
 * Support URL) must match what the app actually opens — a mismatch is a
 * common metadata rejection.
 */
import { Linking, Alert } from 'react-native';

export const LINKS = {
  site: 'https://smenabel.by',
  privacy: 'https://smenabel.by/privacy',
  terms: 'https://smenabel.by/terms',
  // Also the App Store «Support URL» and Google Play's account-deletion URL
  // (https://smenabel.by/support#delete-account).
  support: 'https://smenabel.by/support',
  supportEmail: 'mailto:support@smenabel.by',
};

/**
 * Open an external URL, telling the user if it can't be opened instead of
 * failing silently.
 */
export async function openLink(url) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('unsupported');
    await Linking.openURL(url);
  } catch (e) {
    Alert.alert('Не удалось открыть ссылку', url);
  }
}
