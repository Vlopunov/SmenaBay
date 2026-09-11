// Monograms. Most companies have no logo, so the monogram is the main
// case, not a fallback. No black circles anywhere.
import React from 'react';
import { View, Image } from 'react-native';
import T from './Text';
import { useTheme } from './theme';
import { SkyView } from './Sky';
import { CategoryTile } from './category';

const LEGAL = /^(ооо|одо|оао|зао|чуп|уп|ип|тчуп|чтуп)\s+/i;
const GENERIC = /^(кафе|ресторан|бар|тц|магазин|компания|пвз)\s+/i;

/** «Ozon ПВЗ Минск» → OZ, «Склад-Логистик» → СЛ, «Кафе «Васильки»» → ВА. */
export function companyLetters(name = '') {
  let n = String(name).trim().replace(LEGAL, '');
  const quoted = n.match(/[«"]([^»"]+)[»"]/);
  if (quoted) n = quoted[1];
  else n = n.replace(GENERIC, '');
  const first = n.split(/\s+/).filter(Boolean)[0] || '';
  if (first.includes('-')) {
    const [a, b] = first.split('-');
    return `${a?.[0] || ''}${b?.[0] || ''}`.toUpperCase();
  }
  return first.slice(0, 2).toUpperCase();
}

export function personInitials(first = '', last = '') {
  if (!last && first.includes(' ')) [first, last] = first.split(/\s+/);
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase();
}

/** One person — one tone forever: index = (sum of name char codes) mod 6. */
export function toneIndex(key = '') {
  let sum = 0;
  for (let i = 0; i < key.length; i += 1) sum += key.charCodeAt(i);
  return sum % 6;
}

const realUri = (u) => typeof u === 'string' && /^(https?:|file:)/.test(u) && !u.includes('pravatar.cc');

/** People are circles: 20 · 34 · 42 · 56 · 84. `online` adds the «в сети» dot. */
export function PersonMono({ first = '', last = '', uri, size = 42, online, ring, style }) {
  const t = useTheme();
  const tone = t.tones[toneIndex(`${first} ${last}`.trim())];
  const dot = Math.max(9, Math.round(size * 0.26));
  return (
    <View style={[{ width: size, height: size }, style]}>
      {realUri(uri) ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.c.surface2 }} />
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tone.bg, alignItems: 'center', justifyContent: 'center' }}>
          <T v="body" display weight="800" c={tone.ink} maxFontSizeMultiplier={1.2} style={{ fontSize: Math.round(size * 0.36), lineHeight: Math.round(size * 0.44) }}>
            {personInitials(first, last)}
          </T>
        </View>
      )}
      {online ? (
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: t.c.success, borderWidth: 2, borderColor: ring || t.c.surface }} />
      ) : null}
    </View>
  );
}

const COMPANY_RADIUS = [[20, 6], [30, 9], [34, 11], [42, 13], [44, 14], [56, 18]];
const companyRadius = (size) => (COMPANY_RADIUS.find(([s]) => size <= s) || [0, Math.round(size * 0.32)])[1];

/**
 * Companies are squircles.
 *  · `sky` — in the context of a shift the tile carries that shift's sky;
 *  · `category` — outside it, the category pictogram on a neutral tile;
 *  · neither — letters on a neutral tile (catalogue, settings).
 * A real logo replaces the letters inside the same tile, inset 6 pt.
 */
export function CompanyMono({ name = '', logo, size = 44, sky, category, style }) {
  const t = useTheme();
  const r = companyRadius(size);
  const fontSize = Math.round(size * 0.38);
  if (realUri(logo)) {
    return (
      <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: t.c.surface, borderWidth: 1, borderColor: t.c.line, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
        <Image source={{ uri: logo }} style={{ width: size - 12, height: size - 12, borderRadius: Math.max(2, r - 6) }} resizeMode="contain" />
      </View>
    );
  }
  if (sky) {
    const s = t.sky(sky);
    return (
      <SkyView sky={s} radius={r} style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
        <T v="body" display weight="800" c={s.ink} maxFontSizeMultiplier={1.2} style={{ fontSize, lineHeight: Math.round(fontSize * 1.15) }}>{companyLetters(name)}</T>
      </SkyView>
    );
  }
  if (category) return <CategoryTile kind={category} size={size} style={style} />;
  return (
    <View style={[{ width: size, height: size, borderRadius: r, backgroundColor: t.c.surface2, alignItems: 'center', justifyContent: 'center' }, style]}>
      <T v="body" display weight="800" c="ink3" maxFontSizeMultiplier={1.2} style={{ fontSize, lineHeight: Math.round(fontSize * 1.15) }}>{companyLetters(name)}</T>
    </View>
  );
}
