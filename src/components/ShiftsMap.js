// Yandex Maps in a WebView (the provider that actually covers Belarus).
// Pins show the MONEY, not the job title — on a map people look for «where
// nearby pays more». Selected pin: accent, 36 pt, with the bolt if urgent;
// others: elevated capsule with a hairline, 32 pt; no seats left: 0.5.
import React, { useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import T from '../design/Text';
import { useTheme } from '../design/theme';

let WebView = null;
if (Platform.OS !== 'web') WebView = require('react-native-webview').WebView;

const BOLT = '<svg viewBox="0 0 24 24" width="11" height="11"><path d="M13.6 2L5.2 13.6h4.7L9.2 22 18.8 9.8h-5.1z" fill="currentColor"/></svg>';

function buildHtml(markers, theme) {
  const { c, dark } = theme;
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#map{width:100%;height:100%;background:${dark ? '#1b1b1d' : '#eceae6'}}
${dark ? '[class*="ground-pane"]{filter:invert(1) hue-rotate(180deg) brightness(.82) contrast(.9)}' : ''}
[class*="copyrights-pane"]{opacity:.55}
.pin{position:absolute;transform:translate(-50%,-100%);display:flex;flex-direction:column;align-items:center;font:600 14px -apple-system,system-ui;font-variant-numeric:tabular-nums;white-space:nowrap}
.cap{display:flex;align-items:baseline;gap:3px;height:32px;padding:0 11px;border-radius:16px;align-items:center;
 background:${dark ? '#1C1C1E' : '#FFFFFF'};color:${c.label};border:1px solid ${c.separator};box-shadow:0 2px 8px rgba(0,0,0,.14)}
.cap .u{font:600 10px -apple-system,system-ui;letter-spacing:.4px;color:${c.labelSecondary}}
.tail{width:6px;height:6px;border-radius:3px;margin-top:2px;background:${dark ? '#1C1C1E' : '#FFFFFF'};border:1px solid ${c.separator}}
.pin.full{opacity:.5}
.pin.sel .cap{height:36px;padding:0 13px;border-radius:18px;background:${c.accent};color:${c.onAccent};border-color:transparent;box-shadow:0 6px 16px rgba(18,83,158,.35);font-size:16px}
.pin.sel .cap .u{color:${c.onAccent};opacity:.75}
.pin.sel .tail{background:${c.accent};border-color:transparent}
.pin svg{align-self:center;margin-right:1px}
</style></head><body><div id="map"></div><script>
var markers=${JSON.stringify(markers)};var map,objs={},selected=null;
function cls(m){return 'pin'+(m.full?' full':'')+(m.id===selected?' sel':'');}
function html(m){return '<div class="'+cls(m)+'"><div class="cap">'+(m.id===selected&&m.urgent?'${BOLT}':'')+'<span>'+m.pay+'</span><span class="u">BYN</span></div><div class="tail"></div></div>';}
function post(o){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify(o));}
function inView(){if(!map)return;var b=map.getBounds();var ids=markers.filter(function(m){return m.lat>=b[0][0]&&m.lat<=b[1][0]&&m.lng>=b[0][1]&&m.lng<=b[1][1];}).map(function(m){return m.id;});post({type:'view',ids:ids});}
function draw(){if(!map)return;map.geoObjects.removeAll();objs={};
 markers.forEach(function(m){
  var L=ymaps.templateLayoutFactory.createClass(html(m));
  var p=new ymaps.Placemark([m.lat,m.lng],{},{iconLayout:L,iconShape:{type:'Rectangle',coordinates:[[-38,-42],[38,0]]},zIndex:m.id===selected?1000:(m.full?1:10)});
  p.events.add('click',function(){post({type:'select',id:m.id});});
  map.geoObjects.add(p);objs[m.id]=p;});}
window.setMarkers=function(list,sel){markers=list;selected=sel;draw();inView();};
window.select=function(id,pan){selected=id;draw();var m=markers.filter(function(x){return x.id===id;})[0];if(m&&pan){map.panTo([m.lat,m.lng],{duration:300,delay:0});}};
ymaps.ready(function(){
 map=new ymaps.Map('map',{center:[53.9,27.5667],zoom:12,controls:[]},{suppressMapOpenBlock:true});
 map.events.add('boundschange',inView);
 draw();
 if(markers.length>1){map.setBounds(map.geoObjects.getBounds(),{checkZoomRange:true,zoomMargin:[80,40,260,40]}).then(inView);}else{inView();}
});
</script></body></html>`;
}

export default function ShiftsMap({ shifts, selectedId, onSelect, onViewChange }) {
  const theme = useTheme();
  const web = useRef(null);
  const markers = useMemo(() => shifts
    .filter((s) => s.location?.lat && s.location?.lng)
    .map((s) => ({ id: s.id, lat: s.location.lat, lng: s.location.lng, pay: s.pay, urgent: !!s.urgent, full: s.full })), [shifts]);

  // The page is built once per theme; later changes are pushed in, so the map
  // keeps its position while filters change.
  const html = useMemo(() => buildHtml(markers, theme), [theme.dark]);

  useEffect(() => {
    web.current?.injectJavaScript(`window.setMarkers && window.setMarkers(${JSON.stringify(markers)}, ${JSON.stringify(selectedId || null)}); true;`);
  }, [markers]);
  useEffect(() => {
    web.current?.injectJavaScript(`window.select && window.select(${JSON.stringify(selectedId || null)}, true); true;`);
  }, [selectedId]);

  if (!WebView) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.c.fill }}>
        <T v="body" c="secondary">Карта доступна в приложении</T>
      </View>
    );
  }

  return (
    <WebView
      ref={web}
      source={{ html }}
      originWhitelist={['*']}
      style={{ flex: 1, backgroundColor: theme.dark ? '#1b1b1d' : '#eceae6' }}
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
