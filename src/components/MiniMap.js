// The small map on a shift: a real static map, drawn by our server, with
// our money pin on top. The «Маршрут» button next to it opens a maps app.
import React, { useState } from 'react';
import { View, Image, useWindowDimensions } from 'react-native';
import T from '../design/Text';
import { useTheme } from '../design/theme';
import { staticMapUrl } from '../services/backend';

export default function MiniMap({ lat, lng, pay, height = 104, radiusTop = 20 }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const [failed, setFailed] = useState(false);
  // 1.5× the area at scale 1: sharp enough, and the required Yandex
  // attribution comes out a third smaller than at scale 2.
  const w = Math.min(650, Math.round((width - 40) * 1.5));
  const h = Math.min(450, Math.round(height * 1.5));
  // Null without coordinates: the card then shows the plain map colour.
  const uri = staticMapUrl({ lat, lng, width: w, height: h, z: 15 });
  return (
    <View style={{ height, backgroundColor: t.c.map, borderTopLeftRadius: radiusTop, borderTopRightRadius: radiusTop, overflow: 'hidden' }}>
      {uri && !failed ? (
        <Image source={{ uri }} onError={() => setFailed(true)} style={{ width: '100%', height }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : null}
      {t.dark ? <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(17,22,28,0.38)' }} /> : null}
      {pay != null ? (
        <View style={{ position: 'absolute', left: 0, right: 0, top: height / 2 - 30, alignItems: 'center' }} pointerEvents="none">
          <View style={[{ paddingVertical: 5, paddingHorizontal: 9, borderRadius: 11, backgroundColor: t.c.brand }, t.sh.brand]}>
            <T v="moneyInline" c="onBrand" style={{ fontSize: 13, lineHeight: 16 }}>{pay} BYN</T>
          </View>
          <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: t.c.brand, transform: [{ rotate: '45deg' }], marginTop: -5 }} />
        </View>
      ) : null}
    </View>
  );
}
