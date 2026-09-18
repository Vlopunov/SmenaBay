// Yandex Maps in a WebView (the provider that actually covers Belarus).
// A pin shows the MONEY, not a dot — it is the only reason to look at the
// map. Normal: surface capsule; urgent: with a bolt; selected: brand,
// scale 1.12 (spring.snappy feel via CSS); no seats: surface.2, struck
// through. Picking a pin moves the map so the pin sits above the card.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Platform } from 'react-native';
import T from '../design/Text';
import { useTheme } from '../design/theme';
import { geoConfig } from '../services/backend';

let WebView = null;
if (Platform.OS !== 'web') WebView = require('react-native-webview').WebView;

const BOLT = '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M13 3 5.5 13.5H11l-1 7.5L18 10.5h-5.5z" fill="currentColor"/></svg>';

/**
 * The JS API key belongs to the server, so the map asks for it once per app
 * run — this component mounts again every time someone switches back to the
 * map. `key: null` is a real answer: the map loads unkeyed, as it always has.
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

function buildHtml(markers, theme, lift, key) {
  const { c, dark } = theme;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU${key ? `&apikey=${encodeURIComponent(key)}` : ''}"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#map{width:100%;height:100%;background:${c.map}}
${dark ? '[class*="ground-pane"]{filter:invert(1) hue-rotate(180deg) brightness(.8) contrast(.88) saturate(.7)}' : '[class*="ground-pane"]{filter:saturate(.75) brightness(1.02)}'}
[class*="copyrights-pane"]{opacity:.5}
.pin{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;transition:transform .25s cubic-bezier(.23,1,.32,1);transform-origin:50% 100%}
.cap{display:flex;align-items:center;gap:4px;padding:7px 12px;border-radius:13px;background:${c.surface};color:${c.ink};
 font:800 15px/1 ui-rounded,-apple-system,system-ui;font-variant-numeric:tabular-nums;white-space:nowrap;box-shadow:0 6px 14px -4px rgba(40,30,18,.4)}
.cap svg{color:${c.urgent}}
.tail{width:11px;height:11px;border-radius:2px;background:${c.surface};transform:rotate(45deg);margin-top:-6px}
.pin.full .cap{background:${c.surface2};color:${c.inkDisabled};text-decoration:line-through;box-shadow:none}
.pin.full .tail{background:${c.surface2}}
.pin.sel{transform:translate(-50%,-100%) scale(1.12)}
.pin.sel .cap{background:${c.brand};color:${c.onBrand};box-shadow:0 6px 14px -4px rgba(11,53,80,.5)}
.pin.sel .cap svg{color:${c.onBrand}}
.pin.sel .tail{background:${c.brand}}
</style></head><body><div id="map"></div><script>
var markers=${JSON.stringify(markers)};var map,objs={},selected=null,LIFT=${lift};
function cls(m){return 'pin'+(m.full?' full':'')+(m.id===selected?' sel':'');}
function html(m){return '<div class="'+cls(m)+'"><div class="cap">'+(m.urgent&&!m.full?'${BOLT}':'')+'<span>'+m.pay+' BYN</span></div><div class="tail"></div></div>';}
function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}
function inView(){if(!map)return;var b=map.getBounds();var ids=markers.filter(function(m){return m.lat>=b[0][0]&&m.lat<=b[1][0]&&m.lng>=b[0][1]&&m.lng<=b[1][1];}).map(function(m){return m.id;});post({type:'view',ids:ids});}
function draw(){if(!map)return;map.geoObjects.removeAll();objs={};
 markers.forEach(function(m){
  var L=ymaps.templateLayoutFactory.createClass(html(m));
  var p=new ymaps.Placemark([m.lat,m.lng],{},{iconLayout:L,iconShape:{type:'Rectangle',coordinates:[[-44,-46],[44,0]]},zIndex:m.id===selected?1000:(m.full?1:10)});
  p.events.add('click',function(){post({type:'select',id:m.id});});
  map.geoObjects.add(p);objs[m.id]=p;});}
function panAbove(m){var proj=map.options.get('projection');var z=map.getZoom();var px=proj.toGlobalPixels([m.lat,m.lng],z);px[1]+=LIFT;map.panTo(proj.fromGlobalPixels(px,z),{duration:500,delay:0,timingFunction:'ease-out'});}
window.setMarkers=function(list,sel){markers=list;selected=sel;draw();inView();};
window.select=function(id,pan){selected=id;draw();var m=markers.filter(function(x){return x.id===id;})[0];if(m&&pan&&map){panAbove(m);}};
ymaps.ready(function(){
 map=new ymaps.Map('map',{center:[53.9,27.5667],zoom:12,controls:[]},{suppressMapOpenBlock:true});
 map.events.add('boundschange',inView);
 draw();
 if(markers.length>1){map.setBounds(map.geoObjects.getBounds(),{checkZoomRange:true,zoomMargin:[120,40,300,40]}).then(inView);}else{inView();}
});
</script></body></html>`;
}

export default function ShiftsMap({ shifts, selectedId, onSelect, onViewChange, lift = 110 }) {
  const theme = useTheme();
  const web = useRef(null);
  const markers = useMemo(() => shifts
    .filter((s) => s.location?.lat && s.location?.lng)
    .map((s) => ({ id: s.id, lat: s.location.lat, lng: s.location.lng, pay: s.pay, urgent: !!s.urgent, full: s.full })), [shifts]);

  // Wait for the key before drawing: rebuilding the HTML afterwards would
  // reload the map and throw away where the person had scrolled it.
  const [key, setKey] = useState(apiKey);
  useEffect(() => {
    if (apiKey) return undefined;
    let alive = true;
    loadApiKey().then(() => { if (alive) setKey(apiKey); });
    return () => { alive = false; };
  }, []);

  // Built once per theme; later changes are pushed in, so the map keeps its
  // position while filters change.
  const html = useMemo(() => buildHtml(markers, theme, lift, key?.key), [theme.dark, key]);

  useEffect(() => {
    web.current?.injectJavaScript(`window.setMarkers && window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(selectedId || null)}); true;`);
  }, [markers]);
  useEffect(() => {
    web.current?.injectJavaScript(`window.select && window.select(${JSON.stringify(selectedId || null)}, true); true;`);
  }, [selectedId]);

  if (!WebView) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.c.map }}>
        <T v="body" c="ink2">Карта доступна в приложении</T>
      </View>
    );
  }

  // The same colour the WebView shows while it loads, so the wait for the
  // key looks like the map loading, which is what it is.
  if (!key) return <View style={{ flex: 1, backgroundColor: theme.c.map }} />;

  return (
    <WebView
      ref={web}
      source={{ html }}
      originWhitelist={['*']}
      style={{ flex: 1, backgroundColor: theme.c.map }}
      onMessage={(e) => {
        try {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.type === 'select') onSelect?.(data.id);
          if (data.type === 'view') onViewChange?.(data.ids);
        } catch {}
      }}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      bounces={false}
      setSupportMultipleWindows={false}
    />
  );
}
