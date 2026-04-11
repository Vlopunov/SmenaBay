import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Alert, StatusBar, Modal, ActivityIndicator, Keyboard, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
let WebView;
if (Platform.OS !== 'web') {
  WebView = require('react-native-webview').WebView;
}
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

/* ─── Yandex Maps HTML ─── */
const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;overflow:hidden}
    .pin{position:absolute;top:50%;left:50%;transform:translate(-50%,-100%);z-index:999;pointer-events:none;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}
    .pin svg{width:36px;height:36px}
    .dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background:rgba(79,70,229,.35);border-radius:50%;z-index:998;pointer-events:none}
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="pin"><svg viewBox="0 0 24 24" fill="#4F46E5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"/></svg></div>
  <div class="dot"></div>
  <script>
    var map,timer;
    ymaps.ready(function(){
      map=new ymaps.Map('map',{center:[53.9,27.5667],zoom:13,controls:['zoomControl']});
      map.events.add('actionend',function(){
        clearTimeout(timer);
        timer=setTimeout(function(){geocode(map.getCenter())},350);
      });
      geocode([53.9,27.5667]);
      post({type:'ready'});
    });
    function geocode(c){
      ymaps.geocode(c,{results:1}).then(function(r){
        var o=r.geoObjects.get(0);
        if(o) post({type:'address',address:o.getAddressLine(),lat:c[0],lng:c[1]});
      }).catch(function(){});
    }
    window.searchAddress=function(q){
      ymaps.geocode(q,{results:6,boundedBy:[[53.6,27.2],[54.2,28.0]],strictBounds:false}).then(function(r){
        var arr=[];
        r.geoObjects.each(function(o){
          arr.push({address:o.getAddressLine(),name:o.properties.get('name'),lat:o.geometry.getCoordinates()[0],lng:o.geometry.getCoordinates()[1]});
        });
        post({type:'suggestions',results:arr});
      }).catch(function(){});
    };
    window.moveTo=function(lat,lng){
      if(map){map.setCenter([lat,lng],16,{duration:300})}
    };
    function post(d){window.ReactNativeWebView.postMessage(JSON.stringify(d))}
  </script>
</body>
</html>
`;

export default function LocationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const addLocation = useStore(s => s.addLocation);
  const deleteLocation = useStore(s => s.deleteLocation);

  const [showMap, setShowMap] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const webViewRef = useRef(null);
  const searchTimer = useRef(null);

  const locations = currentUser?.locations || [];

  /* ─── Map message handler ─── */
  const onMapMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setMapReady(true);
      } else if (data.type === 'address') {
        setSelectedAddress(data.address);
        setSelectedCoords({ lat: data.lat, lng: data.lng });
        setSuggestions([]);
      } else if (data.type === 'suggestions') {
        setSuggestions(data.results || []);
      }
    } catch (e) {}
  }, []);

  /* ─── Search with debounce ─── */
  const handleSearch = useCallback((text) => {
    setSearchQuery(text);
    if (Platform.OS === 'web') {
      // On web, directly set the address from the search input
      setSelectedAddress(text);
      return;
    }
    clearTimeout(searchTimer.current);
    if (text.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      webViewRef.current?.injectJavaScript(`searchAddress(${JSON.stringify(text)});true;`);
    }, 400);
  }, []);

  /* ─── Select suggestion ─── */
  const selectSuggestion = useCallback((item) => {
    setSearchQuery(item.name || item.address);
    setSelectedAddress(item.address);
    setSelectedCoords({ lat: item.lat, lng: item.lng });
    setSuggestions([]);
    Keyboard.dismiss();
    webViewRef.current?.injectJavaScript(`moveTo(${item.lat},${item.lng});true;`);
  }, []);

  /* ─── Save location ─── */
  const handleSave = () => {
    if (!selectedAddress) {
      Alert.alert('Ошибка', 'Выберите адрес на карте или найдите через поиск');
      return;
    }
    const name = locationName.trim() || selectedAddress.split(',')[0];
    addLocation({
      name,
      address: selectedAddress,
      lat: selectedCoords?.lat,
      lng: selectedCoords?.lng,
    });
    closeModal();
  };

  /* ─── Open/close modal ─── */
  const openModal = () => {
    setShowMap(true);
    setMapReady(false);
    setSearchQuery('');
    setSuggestions([]);
    setSelectedAddress('');
    setSelectedCoords(null);
    setLocationName('');
  };

  const closeModal = () => {
    setShowMap(false);
    setSearchQuery('');
    setSuggestions([]);
    setSelectedAddress('');
    setSelectedCoords(null);
    setLocationName('');
  };

  /* ─── Delete location ─── */
  const handleDelete = (locId, locName) => {
    Alert.alert('Удалить локацию', `Удалить «${locName}»?`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: () => {
          const result = deleteLocation(locId);
          if (result?.error === 'has_active_shifts') {
            Alert.alert('Ошибка', 'Нельзя удалить — есть активные смены');
          }
        },
      },
    ]);
  };

  /* ─── Render location card ─── */
  const renderLocation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Ionicons name="location" size={20} color={COLORS.accent} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.locationName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.locationAddress} numberOfLines={2}>{item.address}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.name)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Локации</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Locations list */}
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderLocation}
        contentContainerStyle={[styles.list, locations.length === 0 && { flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="map-outline" size={40} color={COLORS.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Нет сохранённых локаций</Text>
            <Text style={styles.emptySubtitle}>
              Добавьте адреса, где проходят ваши смены
            </Text>
          </View>
        }
        ListHeaderComponent={
          locations.length > 0 ? (
            <Text style={styles.listCount}>{locations.length} {locations.length === 1 ? 'локация' : locations.length < 5 ? 'локации' : 'локаций'}</Text>
          ) : null
        }
      />

      {/* Add button */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + SIZES.base }]}>
        <TouchableOpacity style={styles.addButton} onPress={openModal} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color={COLORS.white} />
          <Text style={styles.addButtonText}>Добавить локацию</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Map Picker Modal ─── */}
      <Modal visible={showMap} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Выберите на карте</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={COLORS.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Поиск адреса..."
                placeholderTextColor={COLORS.textTertiary}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe
                src={`https://yandex.ru/map-widget/v1/?ll=27.5667%2C53.9&z=13&l=map&pt=${selectedCoords ? `${selectedCoords.lng}%2C${selectedCoords.lat}%2Cpm2rdm` : ''}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="map"
              />
            ) : WebView ? (
              <WebView
                ref={webViewRef}
                source={{ html: MAP_HTML }}
                style={styles.map}
                onMessage={onMapMessage}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                renderLoading={() => (
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                    <Text style={styles.mapLoadingText}>Загрузка карты...</Text>
                  </View>
                )}
              />
            ) : null}

            {/* Suggestions overlay */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsOverlay}>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.suggestionItem, index < suggestions.length - 1 && styles.suggestionBorder]}
                    onPress={() => selectSuggestion(item)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="location-outline" size={18} color={COLORS.accent} style={{ marginTop: 2 }} />
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName} numberOfLines={1}>
                        {item.name || item.address.split(',')[0]}
                      </Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Bottom panel */}
          <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + SIZES.md }]}>
            {/* Selected address display */}
            <View style={styles.addressRow}>
              <View style={styles.addressDot} />
              <Text style={styles.addressText} numberOfLines={2}>
                {selectedAddress || 'Перемещайте карту для выбора адреса'}
              </Text>
            </View>

            {/* Name input */}
            <TextInput
              style={styles.nameInput}
              placeholder="Название (напр. «Офис на Немиге»)"
              placeholderTextColor={COLORS.textTertiary}
              value={locationName}
              onChangeText={setLocationName}
            />

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, !selectedAddress && styles.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={!selectedAddress}
            >
              <Ionicons name="checkmark" size={20} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Сохранить локацию</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.base, paddingVertical: SIZES.sm,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },

  /* List */
  list: { paddingHorizontal: SIZES.lg, paddingBottom: 120 },
  listCount: { fontSize: SIZES.small, color: COLORS.textTertiary, ...FONTS.medium, marginBottom: SIZES.md },

  /* Card */
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg,
    padding: SIZES.base, marginBottom: SIZES.sm, ...SHADOWS.sm,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
  },
  cardContent: { flex: 1, marginLeft: SIZES.md },
  locationName: { fontSize: SIZES.body, ...FONTS.semibold, color: COLORS.textPrimary },
  locationAddress: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.errorLight, justifyContent: 'center', alignItems: 'center', marginLeft: SIZES.sm,
  },

  /* Empty */
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: SIZES['5xl'] },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.lg,
  },
  emptyTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary },
  emptySubtitle: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.xs, textAlign: 'center', paddingHorizontal: SIZES['2xl'] },

  /* Bottom add button */
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SIZES.lg, paddingTop: SIZES.sm, backgroundColor: COLORS.background },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.accent, borderRadius: SIZES.radiusLg, ...SHADOWS.md,
  },
  addButtonText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },

  /* ─── Modal ─── */
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.base, paddingVertical: SIZES.sm,
  },
  modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },

  /* Search */
  searchContainer: { paddingHorizontal: SIZES.lg, marginBottom: SIZES.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: SIZES.sm,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.base, height: 44,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary, height: 44 },

  /* Map */
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center',
  },
  mapLoadingText: { fontSize: SIZES.body, color: COLORS.textSecondary, marginTop: SIZES.md },

  /* Suggestions */
  suggestionsOverlay: {
    position: 'absolute', top: 0, left: SIZES.lg, right: SIZES.lg,
    backgroundColor: COLORS.white, borderRadius: SIZES.radiusMd,
    ...SHADOWS.lg, maxHeight: 280, zIndex: 10,
  },
  suggestionItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.sm,
    paddingHorizontal: SIZES.base, paddingVertical: SIZES.md,
  },
  suggestionBorder: { borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  suggestionAddress: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },

  /* Bottom panel */
  bottomPanel: {
    backgroundColor: COLORS.white, paddingHorizontal: SIZES.lg, paddingTop: SIZES.base,
    borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl, ...SHADOWS.lg,
  },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm, marginBottom: SIZES.md },
  addressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent },
  addressText: { flex: 1, fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.medium },
  nameInput: {
    backgroundColor: COLORS.surface, borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.base, height: 44, fontSize: SIZES.body,
    color: COLORS.textPrimary, marginBottom: SIZES.md,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SIZES.sm,
    height: SIZES.buttonHeight, backgroundColor: COLORS.accent, borderRadius: SIZES.radiusMd,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.white },
});
