// Points (addresses) of the company. Adding one: move the map under a fixed
// pin or search, the address resolves from the pin (OpenStreetMap
// Nominatim), give the point a short name, save.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, FlatList, TextInput, Modal, Keyboard, Platform, KeyboardAvoidingView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, Separator, Button, EmptyState, Glass } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { plural, shiftEnd } from '../../design/format';
import useStore from '../../store/useStore';

let WebView = null;
if (Platform.OS !== 'web') WebView = require('react-native-webview').WebView;

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const ABBR = [[/^проспект\s/i, 'пр. '], [/^улица\s/i, 'ул. '], [/^переулок\s/i, 'пер. '], [/^площадь\s/i, 'пл. '], [/^бульвар\s/i, 'бул. '], [/\sпроспект$/i, ' пр.'], [/\sулица$/i, ' ул.']];

function shortAddress(item) {
  const a = item.address || {};
  let road = a.road || a.pedestrian || a.neighbourhood || '';
  ABBR.forEach(([re, rep]) => { road = road.replace(re, rep); });
  if (/ пр\.$| ул\.$/.test(road)) road = road.replace(/(.+) (пр\.|ул\.)$/, '$2 $1');
  const line = [road, a.house_number].filter(Boolean).join(', ');
  return line || String(item.display_name || '').split(',').slice(0, 2).join(',');
}

async function search(q) {
  try {
    const r = await fetch(`${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&viewbox=23.1,51.2,32.8,56.2&bounded=1&accept-language=ru`);
    const data = await r.json();
    return data.map((it) => ({ address: shortAddress(it), city: it.address?.city || it.address?.town || '', lat: +it.lat, lng: +it.lon }));
  } catch { return []; }
}

async function reverse(lat, lng) {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=ru`);
    const it = await r.json();
    return { address: shortAddress(it), city: it.address?.city || it.address?.town || '' };
  } catch { return null; }
}

function pickerHtml(accent, dark) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU"></script>
<style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%;background:${dark ? '#1b1b1d' : '#eceae6'}}
${dark ? '[class*="ground-pane"]{filter:invert(1) hue-rotate(180deg) brightness(.82) contrast(.9)}' : ''}
.pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);z-index:999;pointer-events:none;display:flex;flex-direction:column;align-items:center}
.head{width:22px;height:22px;border-radius:11px;background:${accent};border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3)}
.stem{width:2px;height:14px;background:${accent}}
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
  const { c, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const web = useRef(null);
  const timer = useRef(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState([]);
  const [place, setPlace] = useState(null); // { address, city, lat, lng }
  const [resolving, setResolving] = useState(false);
  const [name, setName] = useState('');
  const html = useMemo(() => pickerHtml(c.accent, dark), [dark]);

  const onMessage = async (e) => {
    const d = JSON.parse(e.nativeEvent.data);
    if (d.type === 'moving') { setResolving(true); return; }
    if (d.type === 'ready' || d.type === 'center') {
      const lat = d.lat ?? 53.9; const lng = d.lng ?? 27.5667;
      setResolving(true);
      const r = await reverse(lat, lng);
      setResolving(false);
      if (r) setPlace({ ...r, lat, lng });
    }
  };

  const onSearch = (text) => {
    setQ(text);
    clearTimeout(timer.current);
    if (text.trim().length < 3) { setHits([]); return; }
    timer.current = setTimeout(async () => setHits(await search(`${text}, Беларусь`)), 400);
  };

  const pick = (h) => {
    setHits([]); setQ(h.address); Keyboard.dismiss();
    setPlace(h);
    web.current?.injectJavaScript(`moveTo(${h.lat},${h.lng});true;`);
  };

  const reset = () => { setQ(''); setHits([]); setPlace(null); setName(''); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={() => { reset(); onClose(); }}>
      <View style={{ flex: 1, backgroundColor: c.ledger }}>
        {WebView ? <WebView ref={web} source={{ html }} originWhitelist={['*']} onMessage={onMessage} style={{ flex: 1 }} javaScriptEnabled domStorageEnabled /> : <View style={{ flex: 1 }} />}
        <View style={{ position: 'absolute', top: Platform.OS === 'ios' ? 14 : insets.top + 10, left: 16, right: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Glass radius={22} style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14 }}>
                <Icon name="magnifyingglass" size={15} c="tertiary" />
                <TextInput value={q} onChangeText={onSearch} placeholder="Улица и дом" placeholderTextColor={c.labelTertiary} returnKeyType="search" onSubmitEditing={() => hits[0] && pick(hits[0])} style={{ flex: 1, fontSize: 15, color: c.label }} />
              </View>
            </Glass>
            <Press feedback="none" onPress={() => { reset(); onClose(); }} hitSlop={8}><T v="body" c="accent" style={{ fontSize: 17 }}>Отмена</T></Press>
          </View>
          {hits.length ? (
            <View style={{ borderRadius: 16, backgroundColor: c.elevated, overflow: 'hidden' }}>
              {hits.map((h, i) => (
                <View key={`${h.lat}${h.lng}${i}`}>
                  <Press feedback="highlight" onPress={() => pick(h)} style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                    <T v="value">{h.address}</T>
                    {h.city ? <T v="caption" c="secondary">{h.city}</T> : null}
                  </Press>
                  {i < hits.length - 1 ? <Separator style={{ marginLeft: 16 }} /> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
          <View style={{ backgroundColor: c.sheet, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 12, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}>
              <View style={{ flex: 1 }}>
                <T v="caption" c="secondary">Адрес точки</T>
                <T v="rowTitle" numberOfLines={2}>{place?.address || 'Передвинь карту под булавку'}</T>
                {place?.city ? <T v="caption" c="secondary">{place.city}</T> : null}
              </View>
              {resolving ? <ActivityIndicator color={c.labelSecondary} /> : null}
            </View>
            <TextInput value={name} onChangeText={setName} placeholder="Название, например «ПВЗ на Немиге»" placeholderTextColor={c.labelTertiary} style={{ height: 50, borderRadius: 25, backgroundColor: c.fillSecondary, paddingHorizontal: 18, fontSize: 16, color: c.label }} />
            <Button title="Сохранить точку" disabled={!place?.address || resolving} onPress={() => { onSave({ ...place, name: name.trim() || place.address }); reset(); }} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function LocationsScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const shifts = useStore((s) => s.shifts);
  const addLocation = useStore((s) => s.addLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const [adding, setAdding] = useState(false);
  const locations = me?.locations || [];

  const activeAt = useCallback((id) => {
    const now = new Date();
    return shifts.filter((s) => s.locationId === id && (s.status === 'active' || s.status === 'filled') && shiftEnd(s) > now).length;
  }, [shifts]);

  const menu = (l) => showActions({
    title: l.address,
    options: [{
      label: 'Удалить точку', destructive: true,
      onPress: () => {
        const r = deleteLocation(l.id);
        if (r?.error === 'has_active_shifts') Alert.alert('Здесь есть активные смены', 'Сначала заверши или отмени смены на этой точке.');
        else haptic.medium();
      },
    }],
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar variant="fill" onBack={() => navigation.goBack()} />
      <FlatList
        data={locations}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        ListHeaderComponent={(
          <>
            <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 }}>
              <T v="title" accessibilityRole="header">Точки</T>
              <T v="caption" c="secondary" style={{ marginTop: 2 }}>Адреса, где проходят смены — их видят исполнители</T>
            </View>
            <Separator />
          </>
        )}
        ListEmptyComponent={<EmptyState title="Пока ни одной точки" text="Добавь адрес — без него смену не опубликовать." />}
        renderItem={({ item: l, index }) => {
          const n = activeAt(l.id);
          return (
            <View>
              <Press feedback="highlight" onPress={() => menu(l)} onLongPress={() => menu(l)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 22, paddingVertical: 14 }}>
                <Icon name="mappin.and.ellipse" size={18} c="secondary" />
                <View style={{ flex: 1 }}>
                  <T v="value" style={{ fontSize: 16, lineHeight: 21 }}>{l.address}</T>
                  <T v="caption" c="secondary">{[l.name !== l.address ? l.name : null, n ? `${n} ${plural(n, ['активная смена', 'активные смены', 'активных смен'])}` : 'Смен нет'].filter(Boolean).join(' · ')}</T>
                </View>
                <Icon name="ellipsis" size={15} c="tertiary" />
              </Press>
              {index < locations.length - 1 ? <Separator inset /> : null}
            </View>
          );
        }}
      />
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 12 }}>
        <Button title="Добавить точку" icon="plus" onPress={() => setAdding(true)} />
      </View>
      <Picker
        visible={adding}
        onClose={() => setAdding(false)}
        onSave={(p) => { addLocation({ name: p.name, address: p.address, city: p.city || me?.city, lat: p.lat, lng: p.lng }); haptic.success(); setAdding(false); }}
      />
    </View>
  );
}
