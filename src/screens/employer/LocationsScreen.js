// «Точки» — screen 31. A map on top as an overview, the list below. The
// entrance hint is named for what it is: the line a worker reads in the
// pass. Adding a point: move the map under a fixed pin or search, the
// address resolves from the pin (through our /api/geo, which holds the map
// keys), give the point a short name and, optionally, the entrance hint,
// save.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, FlatList, TextInput, Modal, Keyboard, Platform, KeyboardAvoidingView, Alert, ActivityIndicator, Image,
  StyleSheet, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { CircleButton, Press, Button, Card, EmptyState, SearchField, Divider } from '../../design/ui';
import { Pictogram, categoryFromBusiness } from '../../design/category';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, shiftEnd } from '../../design/format';
import useStore from '../../store/useStore';
import { geoConfig, geoGeocode, geoReverse, geoSuggest, staticMapUrl } from '../../services/backend';

let WebView = null;
if (Platform.OS !== 'web') WebView = require('react-native-webview').WebView;

const MAP_H = 170;

/**
 * The JS API key for the picker's map comes from the server, once per app
 * run. `key: null` is a real answer: the map then loads unkeyed, as before.
 */
let apiKey = null;
let apiKeyRequest = null;
function loadApiKey() {
  if (!apiKeyRequest) {
    apiKeyRequest = geoConfig()
      .then((r) => { apiKey = { key: r?.jsApiKey || null }; })
      .catch(() => { apiKey = { key: null }; });
  }
  return apiKeyRequest;
}

// ── Overview map ───────────────────────────────────────────────
// A static map from our server (the same source as MiniMap) framed around
// every point, with our pins placed by Mercator projection.
const TILE = 256;
function project(lat, lng, z) {
  const size = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * size, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size };
}

function PointsMap({ points, kind, width }) {
  const t = useTheme();
  const { c } = t;
  const [failed, setFailed] = useState(false);
  const frame = useMemo(() => {
    if (!points.length || width <= 0) return null;
    const iw = Math.min(650, Math.round(width * 1.5));
    const ih = Math.min(450, Math.round(MAP_H * 1.5));
    const k = Math.max(width / iw, MAP_H / ih); // pt per map pixel (cover)
    const lat = (Math.min(...points.map((p) => p.lat)) + Math.max(...points.map((p) => p.lat))) / 2;
    const lng = (Math.min(...points.map((p) => p.lng)) + Math.max(...points.map((p) => p.lng))) / 2;
    const place = (z) => {
      const o = project(lat, lng, z);
      return points.map((p) => { const q = project(p.lat, p.lng, z); return { id: p.id, x: width / 2 + (q.x - o.x) * k, y: MAP_H / 2 + (q.y - o.y) * k }; });
    };
    // One point: street level. Several: the closest zoom that frames them all.
    let z = 15;
    let pins = place(z);
    if (points.length > 1) {
      for (let zz = 16; zz >= 4; zz -= 1) {
        z = zz;
        pins = place(zz);
        if (pins.every((p) => p.x >= 26 && p.x <= width - 26 && p.y >= 24 && p.y <= MAP_H - 24)) break;
      }
    }
    return { pins, uri: staticMapUrl({ lat, lng, width: iw, height: ih, z }) };
  }, [points, width]);
  if (!frame) return null;
  return (
    <View
      accessible
      accessibilityLabel={`Карта: ${points.length} ${plural(points.length, ['точка', 'точки', 'точек'])}`}
      style={[{ height: MAP_H, borderRadius: 20, overflow: 'hidden', backgroundColor: c.map }, t.dark && { borderWidth: 1, borderColor: c.line }]}
    >
      {frame.uri && !failed ? (
        <Image source={{ uri: frame.uri }} onError={() => setFailed(true)} style={{ width: '100%', height: MAP_H }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={{ position: 'absolute', left: -20, right: -20, top: 54, height: 11, backgroundColor: c.mapRoad, transform: [{ rotate: '-5deg' }] }} />
          <View style={{ position: 'absolute', left: -20, right: -20, top: 120, height: 6, backgroundColor: c.mapRoad, transform: [{ rotate: '-5deg' }] }} />
          <View style={{ position: 'absolute', left: '28%', top: -20, bottom: -20, width: 9, backgroundColor: c.mapRoad, transform: [{ rotate: '7deg' }] }} />
          <View style={{ position: 'absolute', left: '67%', top: -20, bottom: -20, width: 5, backgroundColor: c.mapRoad, transform: [{ rotate: '7deg' }] }} />
        </View>
      )}
      {t.dark ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity: 0.38 }]} /> : null}
      {frame.pins.map((p) => (
        <View
          key={p.id}
          pointerEvents="none"
          style={[{
            position: 'absolute', left: p.x - 16, top: p.y - 16, width: 32, height: 32, borderRadius: 16,
            backgroundColor: c.brand, borderWidth: 3, borderColor: c.surface, alignItems: 'center', justifyContent: 'center',
          }, { shadowColor: c.brandShadow, shadowOpacity: t.dark ? 0.5 : 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 3 } }]}
        >
          <Pictogram kind={kind} size={15} color={c.onBrand} />
        </View>
      ))}
    </View>
  );
}

// ── Add-a-point picker ─────────────────────────────────────────
function pickerHtml({ brand, ground, ring, dark, key }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU${key ? `&apikey=${encodeURIComponent(key)}` : ''}"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:${ground}}
${dark ? '[class*="ground-pane"]{filter:invert(1) hue-rotate(180deg) brightness(.82) contrast(.9)}' : ''}
.pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:999;pointer-events:none;display:flex;flex-direction:column;align-items:center}
.head{width:22px;height:22px;border-radius:11px;background:${brand};border:3px solid ${ring};box-shadow:0 4px 10px rgba(0,0,0,.3)}
.stem{width:2px;height:14px;background:${brand}}
.shadow{position:absolute;left:50%;top:50%;width:8px;height:4px;border-radius:50%;background:rgba(0,0,0,.25);transform:translate(-50%,-50%)}</style></head>
<body><div id="map"></div><div class="shadow"></div><div class="pin"><div class="head"></div><div class="stem"></div></div>
<script>var map,t;function post(d){window.ReactNativeWebView.postMessage(JSON.stringify(d))}
ymaps.ready(function(){map=new ymaps.Map('map',{center:[53.9,27.5667],zoom:15,controls:[]},{suppressMapOpenBlock:true});
map.events.add('actionend',function(){clearTimeout(t);t=setTimeout(function(){var c=map.getCenter();post({type:'center',lat:c[0],lng:c[1]})},300)});
map.events.add('actionbegin',function(){post({type:'moving'})});
post({type:'ready'})});
window.moveTo=function(a,b){if(map)map.setCenter([a,b],16,{duration:300})};</script></body></html>`;
}

function Picker({ visible, onClose, onSave }) {
  const t = useTheme();
  const { c, dark } = t;
  const insets = useSafeAreaInsets();
  const web = useRef(null);
  const timer = useRef(null);
  const seq = useRef(0);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null); // { address, city, lat, lng }
  const [resolving, setResolving] = useState(false);
  const [lost, setLost] = useState(false); // the last lookup came back empty
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [key, setKey] = useState(apiKey);
  const html = useMemo(() => pickerHtml({ brand: c.brand, ground: c.map, ring: c.surface, dark, key: key?.key }), [dark, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const located = Number.isFinite(place?.lat) && Number.isFinite(place?.lng);

  // Wait for the key before building the map: a later rebuild would reload
  // it and lose wherever the person had already dragged the pin.
  useEffect(() => {
    if (apiKey) return undefined;
    let alive = true;
    loadApiKey().then(() => { if (alive) setKey(apiKey); });
    return () => { alive = false; };
  }, []);

  const onMessage = async (e) => {
    const d = JSON.parse(e.nativeEvent.data);
    if (d.type === 'moving') { setResolving(true); return; }
    if (d.type === 'ready' || d.type === 'center') {
      const lat = d.lat ?? 53.9; const lng = d.lng ?? 27.5667;
      setResolving(true);
      const r = await geoReverse(lat, lng);
      setResolving(false);
      // Nothing under the pin, or nothing came back: leave the last address
      // alone and say so. The search field is still a way to a point.
      if (r?.address) { setPlace({ address: r.address, city: r.city || '', lat, lng }); setLost(false); }
      else setLost(true);
    }
  };

  const onSearch = (text) => {
    setQ(text);
    clearTimeout(timer.current);
    if (text.trim().length < 3) { setHits([]); return; }
    timer.current = setTimeout(async () => {
      // Answers can overtake each other; only the newest one may show.
      const n = seq.current + 1;
      seq.current = n;
      const items = await geoSuggest(text.trim());
      if (seq.current === n) setHits(items);
    }, 400);
  };

  /** A geocoder answer, or the address by itself when there wasn't one. */
  const settle = (g, address, city) => {
    const ok = Number.isFinite(g?.lat) && Number.isFinite(g?.lng);
    setPlace({ address: g?.address || address, city: g?.city || city, lat: ok ? g.lat : null, lng: ok ? g.lng : null });
    setLost(!ok);
    if (ok) web.current?.injectJavaScript(`moveTo(${g.lat},${g.lng});true;`);
  };

  const pick = async (h) => {
    const address = h.address || h.title || '';
    setHits([]); setQ(h.title || address); Keyboard.dismiss();
    if (Number.isFinite(h.lat) && Number.isFinite(h.lng)) {
      setPlace({ address, city: h.city || '', lat: h.lat, lng: h.lng });
      setLost(false);
      web.current?.injectJavaScript(`moveTo(${h.lat},${h.lng});true;`);
      return;
    }
    // A hint can arrive without coordinates; the geocoder gets them from
    // the address. When it can't, the address alone still makes a point.
    setResolving(true);
    const g = await geoGeocode(address);
    setResolving(false);
    settle(g, address, h.city || '');
  };

  // Nothing to pick: take what the person typed and give the geocoder one
  // chance at coordinates, so a hand-typed address still lands on the map.
  const submit = async () => {
    if (hits[0]) { pick(hits[0]); return; }
    const text = q.trim();
    if (text.length < 3) return;
    Keyboard.dismiss();
    setResolving(true);
    const g = await geoGeocode(text);
    setResolving(false);
    settle(g, text, '');
  };

  const reset = () => { setQ(''); setHits([]); setPlace(null); setLost(false); setName(''); setHint(''); };
  const field = { height: 48, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, fontSize: 16, color: c.ink };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={() => { reset(); onClose(); }}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        {WebView && key ? <WebView ref={web} source={{ html }} originWhitelist={['*']} onMessage={onMessage} style={{ flex: 1, backgroundColor: c.map }} javaScriptEnabled domStorageEnabled /> : <View style={{ flex: 1, backgroundColor: c.map }} />}
        <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 14 : insets.top + 10, left: 16, right: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <SearchField value={q} onChangeText={onSearch} placeholder="Улица и дом" onSubmitEditing={submit} style={[{ flex: 1 }, t.sh.e1]} />
            <Press onPress={() => { reset(); onClose(); }} hitSlop={4} accessibilityLabel="Отмена" style={[{ height: 44, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.surface, justifyContent: 'center' }, t.sh.e1]}>
              <T v="bodyStrong" c="brand" style={{ fontSize: 15 }}>Отмена</T>
            </Press>
          </View>
          {hits.length ? (
            <View style={[{ borderRadius: 16, backgroundColor: c.surface }, t.sh.e1]}>
              <View style={{ borderRadius: 16, overflow: 'hidden' }}>
                {hits.map((h, i) => (
                  <View key={`${h.address || h.title || ''}${i}`}>
                    <Press feedback="highlight" onPress={() => pick(h)} style={{ paddingHorizontal: 14, paddingVertical: 11 }}>
                      <T v="bodyStrong" style={{ fontSize: 15 }}>{h.title || h.address}</T>
                      {h.subtitle ? <T v="caption" c="ink2" style={{ marginTop: 1 }}>{h.subtitle}</T> : null}
                    </Press>
                    {i < hits.length - 1 ? <Divider inset={14} /> : null}
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View style={[{ backgroundColor: c.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 18, paddingBottom: insets.bottom + 12, gap: 10 }, t.sh.e3]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
              <View style={{ flex: 1 }}>
                <T v="caption" c="ink2" weight="600" style={{ fontSize: 12.5 }}>Адрес точки</T>
                <T v="rowTitle" numberOfLines={2} style={{ marginTop: 2, fontSize: 16.5 }}>
                  {place?.address || (lost ? 'Адрес не определился — впиши его в поиске' : 'Передвинь карту под булавку')}
                </T>
                {place?.address && !located ? (
                  <T v="caption" c="ink2">Точка сохранится без карты</T>
                ) : place?.city ? <T v="caption" c="ink2">{place.city}</T> : null}
              </View>
              {resolving ? <ActivityIndicator color={c.ink2} /> : null}
            </View>
            <TextInput value={name} onChangeText={setName} placeholder="Название, например «ПВЗ на Немиге»" placeholderTextColor={c.inkDisabled} accessibilityLabel="Название точки" style={field} />
            <TextInput value={hint} onChangeText={setHint} maxLength={80} placeholder="Как найти вход, например «Вход со двора»" placeholderTextColor={c.inkDisabled} accessibilityLabel="Подсказка про вход" style={field} />
            <T v="caption" c="ink2" style={{ fontSize: 12, lineHeight: 16, paddingHorizontal: 2 }}>Подсказку про вход исполнитель прочитает в пропуске. Её можно не заполнять.</T>
            <Button
              title="Сохранить точку"
              style={{ marginTop: 2 }}
              disabled={!place?.address || resolving}
              onPress={() => { onSave({ ...place, name: name.trim() || place.address, hint: hint.trim() }); reset(); }}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Screen ─────────────────────────────────────────────────────
export default function LocationsScreen({ navigation }) {
  const t = useTheme();
  const { c } = t;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const g = width < 380 ? 16 : 20;
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const addLocation = useStore((s) => s.addLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const [adding, setAdding] = useState(false);
  const [mapW, setMapW] = useState(width - 2 * g);
  const locations = me?.locations || [];
  const points = useMemo(() => locations.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)), [locations]);
  const kind = categoryFromBusiness(me?.businessCategory) || 'pvz';

  const activeAt = useCallback((id) => {
    const now = new Date();
    return shifts.filter((s) => s.locationId === id && (s.status === 'active' || s.status === 'filled') && shiftEnd(s) > now).length;
  }, [shifts]);

  const menu = (l) => showActions({
    title: l.address,
    message: l.hint || undefined,
    options: [{
      label: 'Удалить точку', destructive: true,
      onPress: () => {
        const r = deleteLocation(l.id);
        if (r?.error === 'has_active_shifts') Alert.alert('Здесь есть активные смены', 'Сначала заверши или отмени смены на этой точке.');
        else haptic.medium();
      },
    }],
  });

  const addRow = (
    <Press
      onPress={() => setAdding(true)}
      accessibilityLabel="Добавить точку, поиск по карте"
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.surface, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.lineStrong }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="plus" size={19} c="ink2" weight="bold" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="rowTitle" c="ink3" style={{ fontSize: 15.5, lineHeight: 19 }}>Добавить точку</T>
        <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }}>Поиск по карте</T>
      </View>
    </Press>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: g, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <CircleButton icon="chevron.left" color={c.ink} iconSize={20} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
        <T v="rowTitle" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontSize: 17, lineHeight: 21 }}>Точки</T>
        <Press onPress={() => setAdding(true)} hitSlop={8} accessibilityLabel="Добавить точку" style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 }}>
          <T v="bodyStrong" c="brand" style={{ fontSize: 15 }}>Добавить</T>
        </Press>
      </View>
      <FlatList
        data={locations}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: g, paddingBottom: insets.bottom + 30 }}
        ItemSeparatorComponent={() => <View style={{ height: 9 }} />}
        ListHeaderComponent={points.length ? (
          <View style={{ marginTop: 12, marginBottom: 14 }} onLayout={(e) => setMapW(Math.round(e.nativeEvent.layout.width))}>
            <PointsMap points={points} kind={kind} width={mapW} />
          </View>
        ) : <View style={{ height: 10 }} />}
        ListEmptyComponent={(
          <Card style={{ marginTop: 4 }}>
            <EmptyState
              icon="mappin.and.ellipse"
              title="Пока ни одной точки"
              text="Добавь адрес — без него смену не опубликовать."
              action="Добавить точку"
              onAction={() => setAdding(true)}
            />
          </Card>
        )}
        renderItem={({ item: l }) => {
          const n = activeAt(l.id);
          const where = l.hint || (l.name && l.name !== l.address ? l.name : null);
          return (
            <Card
              radius={18}
              onPress={() => menu(l)}
              onLongPress={() => menu(l)}
              accessibilityLabel={`${l.address}${where ? `, ${where}` : ''}, ${n ? `${n} ${plural(n, ['смена', 'смены', 'смен'])}` : 'смен нет'}`}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: c.brandTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="mappin.and.ellipse" size={20} c="brand" weight="semibold" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="rowTitle" style={{ fontSize: 15.5, lineHeight: 19 }} numberOfLines={2}>{l.address}</T>
                <T v="caption" c="ink2" style={{ marginTop: 2, fontSize: 12.5, lineHeight: 16 }} numberOfLines={2}>
                  {[where, n ? `${n} ${plural(n, ['смена', 'смены', 'смен'])}` : 'смен нет'].filter(Boolean).join(' · ')}
                </T>
              </View>
              <Icon name="chevron.right" size={14} c="ink2" weight="semibold" style={{ opacity: 0.6 }} />
            </Card>
          );
        }}
        ListFooterComponent={(
          <View style={{ marginTop: locations.length ? 9 : 0 }}>
            {locations.length ? addRow : null}
            <T v="caption" c="ink2" style={{ marginTop: 14, paddingHorizontal: 4, fontSize: 12.5, lineHeight: 18 }}>
              Подсказка про вход — то, что исполнитель прочитает в пропуске. Заполни её, когда добавляешь точку, — и она попадёт во все смены на ней.
            </T>
          </View>
        )}
      />
      <Picker
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(p) => {
          addLocation({ name: p.name, address: p.address, city: p.city || me?.city, lat: p.lat, lng: p.lng, ...(p.hint ? { hint: p.hint } : {}) });
          haptic.success();
          setAdding(false);
        }}
      />
    </View>
  );
}
