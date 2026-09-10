// «Маршрут»: offer the map apps people actually use in Belarus.
import { Linking, Platform } from 'react-native';
import { showActions } from '../design/ActionSheet';

export function openRoute(location) {
  if (!location) return;
  const { lat, lng, address } = location;
  const q = encodeURIComponent(address || `${lat},${lng}`);
  const options = [
    { label: 'Яндекс Карты', onPress: () => Linking.openURL(lat ? `https://yandex.ru/maps/?rtext=~${lat},${lng}&rtt=pd` : `https://yandex.ru/maps/?text=${q}`) },
  ];
  if (Platform.OS === 'ios') {
    options.push({ label: 'Apple Карты', onPress: () => Linking.openURL(lat ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w` : `http://maps.apple.com/?q=${q}`) });
  }
  options.push({ label: 'Google Карты', onPress: () => Linking.openURL(lat ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking` : `https://www.google.com/maps/search/?api=1&query=${q}`) });
  showActions({ title: address, options });
}
