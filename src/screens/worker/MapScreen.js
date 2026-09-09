import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform,
  ActivityIndicator, FlatList, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Все', icon: 'apps-outline' },
  { key: 'pvz', label: 'ПВЗ', icon: 'cube-outline' },
  { key: 'horeca', label: 'HoReCa', icon: 'restaurant-outline' },
  { key: 'warehouse', label: 'Склад', icon: 'file-tray-stacked-outline' },
  { key: 'retail', label: 'Ритейл', icon: 'storefront-outline' },
  { key: 'cleaning', label: 'Клининг', icon: 'sparkles-outline' },
];

const EXTRA_FILTERS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'noexp', label: 'Без опыта' },
  { key: 'urgent', label: 'Срочные' },
  { key: 'highpay', label: 'от 70 BYN' },
];

export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const shifts = useStore(s => s.shifts);
  const companies = useStore(s => s.companies);
  const blockedUsers = useStore(s => s.blockedUsers);
  const webViewRef = useRef(null);

  const [category, setCategory] = useState('all');
  const [extraFilters, setExtraFilters] = useState([]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  const toggleExtra = (key) => {
    setExtraFilters(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const matchesCategory = useCallback((shift, company) => {
    if (category === 'all') return true;
    const title = shift.title.toLowerCase();
    const bcat = company?.businessCategory || '';
    switch (category) {
      case 'pvz': return title.includes('пвз') || bcat === 'ПВЗ';
      case 'horeca': return bcat === 'HoReCa' || title.includes('официант') || title.includes('повар') || title.includes('бармен');
      case 'warehouse': return bcat === 'Склад/Логистика' || title.includes('склад') || title.includes('грузчик') || title.includes('комплектовщик') || title.includes('сборщик');
      case 'retail': return bcat === 'Ритейл' || title.includes('продавец') || title.includes('кассир');
      case 'cleaning': return bcat === 'Клининг' || title.includes('уборщик') || title.includes('клининг');
      default: return true;
    }
  }, [category]);

  const activeShifts = useMemo(() => {
    let result = shifts
      // Blocked employers' pins are hidden (Guideline 1.2).
      .filter(s => s.status === 'active' && !blockedUsers.includes(s.companyId))
      .map(s => {
        const company = companies.find(c => c.id === s.companyId);
        const loc = company?.locations?.find(l => l.id === s.locationId);
        return { ...s, company, location: loc };
      })
      .filter(s => s.location?.lat && s.location?.lng);

    // City
    if (currentUser?.city) {
      result = result.filter(s => s.company?.city === currentUser.city);
    }

    // Category
    result = result.filter(s => matchesCategory(s, s.company));

    // Extra filters
    if (extraFilters.includes('today')) result = result.filter(s => s.date === today);
    if (extraFilters.includes('tomorrow')) result = result.filter(s => s.date === tomorrow);
    if (extraFilters.includes('noexp')) result = result.filter(s => s.requirements?.noExperienceOk);
    if (extraFilters.includes('urgent')) result = result.filter(s => s.urgent);
    if (extraFilters.includes('highpay')) result = result.filter(s => s.pay >= 70);

    return result;
  }, [shifts, companies, currentUser, category, extraFilters, matchesCategory, today, tomorrow, blockedUsers]);

  const markersJson = JSON.stringify(activeShifts.map(s => ({
    id: s.id,
    lat: s.location.lat,
    lng: s.location.lng,
    title: s.title,
    pay: s.pay,
    company: s.company?.companyName || '',
    urgent: s.urgent,
  })));

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.full"></script>
  <style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var markers=${markersJson};
    ymaps.ready(function(){
      var map=new ymaps.Map('map',{center:[53.9,27.5667],zoom:12,controls:['zoomControl']});
      markers.forEach(function(m){
        var color=m.urgent?'islands#redCircleDotIcon':'islands#blueCircleDotIcon';
        var p=new ymaps.Placemark([m.lat,m.lng],{
          balloonContentHeader:m.title,
          balloonContentBody:m.company+'<br><b>'+m.pay+' BYN</b>'+(m.urgent?'<br><span style="color:red">Срочно!</span>':''),
          hintContent:m.title+' — '+m.pay+' BYN'
        },{
          preset:color
        });
        p.events.add('click',function(){
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'shift',id:m.id}));
        });
        map.geoObjects.add(p);
      });
      if(markers.length>0){
        map.setBounds(map.geoObjects.getBounds(),{checkZoomRange:true,zoomMargin:40});
      }
    });
  </script>
</body>
</html>`;

  const onMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'shift' && data.id) {
        navigation.navigate('ShiftDetail', { shiftId: data.id });
      }
    } catch {}
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Карта смен</Text>
          <Text style={styles.shiftCount}>{activeShifts.length} смен</Text>
        </View>

        {/* Category filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORY_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.catChip, category === f.key && styles.catChipActive]}
              onPress={() => setCategory(f.key)}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={category === f.key ? COLORS.white : COLORS.textSecondary}
              />
              <Text style={[styles.catText, category === f.key && styles.catTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Extra filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.extraRow}
        >
          {EXTRA_FILTERS.map(f => {
            const active = extraFilters.includes(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.extraChip, active && styles.extraChipActive]}
                onPress={() => toggleExtra(f.key)}
              >
                <Text style={[styles.extraText, active && styles.extraTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Map */}
      <View style={styles.mapWrap}>
        {Platform.OS === 'web' ? (
          <View style={styles.webFallback}>
            <Ionicons name="map-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.webFallbackText}>Карта доступна в мобильном приложении</Text>
          </View>
        ) : WebView ? (
          <WebView
            ref={webViewRef}
            key={markersJson}
            source={{ html: mapHtml }}
            style={styles.map}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.accent} />
                <Text style={styles.loadingText}>Загрузка карты...</Text>
              </View>
            )}
          />
        ) : null}

        {/* No results overlay */}
        {activeShifts.length === 0 && (
          <View style={styles.noResults}>
            <View style={styles.noResultsCard}>
              <Ionicons name="search-outline" size={24} color={COLORS.textTertiary} />
              <Text style={styles.noResultsText}>Нет смен по выбранным фильтрам</Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setCategory('all'); setExtraFilters([]); }}
              >
                <Text style={styles.resetText}>Сбросить фильтры</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.white,
    paddingTop: SIZES.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.lg, marginBottom: SIZES.sm,
  },
  headerTitle: { fontSize: SIZES.heading, ...FONTS.bold, color: COLORS.textPrimary, letterSpacing: -0.3 },
  shiftCount: {
    fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent,
    backgroundColor: COLORS.accentSoft, paddingHorizontal: SIZES.sm, paddingVertical: 2,
    borderRadius: SIZES.radiusFull, overflow: 'hidden',
  },

  categoryRow: { paddingHorizontal: SIZES.lg, gap: SIZES.sm, paddingBottom: SIZES.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SIZES.md, height: 34,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surface,
  },
  catChipActive: { backgroundColor: COLORS.accent },
  catText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.textSecondary },
  catTextActive: { color: COLORS.white },

  extraRow: { paddingHorizontal: SIZES.lg, gap: SIZES.sm, paddingBottom: SIZES.md },
  extraChip: {
    paddingHorizontal: SIZES.md, height: 28, justifyContent: 'center',
    borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.border,
  },
  extraChipActive: { backgroundColor: COLORS.textPrimary, borderColor: COLORS.textPrimary },
  extraText: { fontSize: SIZES.caption, ...FONTS.medium, color: COLORS.textSecondary },
  extraTextActive: { color: COLORS.white },

  mapWrap: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.md },
  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  webFallbackText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.md },

  noResults: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  noResultsCard: {
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.xl, alignItems: 'center', ...SHADOWS.md, marginHorizontal: SIZES['2xl'],
  },
  noResultsText: {
    fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.sm, textAlign: 'center',
  },
  resetBtn: { marginTop: SIZES.md, paddingHorizontal: SIZES.lg, paddingVertical: SIZES.sm, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.accent },
  resetText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.white },
});
