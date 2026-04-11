import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function LocationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore(s => s.currentUser);
  const addLocation = useStore(s => s.addLocation);
  const deleteLocation = useStore(s => s.deleteLocation);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const locations = currentUser?.locations || [];

  const handleAdd = () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    if (!trimmedName || !trimmedAddress) {
      Alert.alert('Ошибка', 'Заполните название и адрес');
      return;
    }
    addLocation({ name: trimmedName, address: trimmedAddress });
    setName('');
    setAddress('');
    setShowForm(false);
  };

  const handleDelete = (locId, locName) => {
    Alert.alert(
      'Удалить локацию',
      `Вы уверены, что хотите удалить «${locName}»?`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: () => {
            const result = deleteLocation(locId);
            if (result?.error === 'has_active_shifts') {
              Alert.alert('Ошибка', 'Нельзя удалить — есть активные смены');
            }
          },
        },
      ],
    );
  };

  const renderLocation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.name)}
        activeOpacity={0.6}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="location-outline" size={48} color={COLORS.textTertiary} />
      </View>
      <Text style={styles.emptyTitle}>Нет локаций</Text>
      <Text style={styles.emptySubtitle}>Добавьте адреса, где проходят смены</Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Управление локациями</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* List */}
      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={renderLocation}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.list,
          locations.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Form (inline expandable) */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Новая локация</Text>
          <TextInput
            style={styles.input}
            placeholder="Название"
            placeholderTextColor={COLORS.textTertiary}
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Адрес"
            placeholderTextColor={COLORS.textTertiary}
            value={address}
            onChangeText={setAddress}
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowForm(false);
                setName('');
                setAddress('');
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.cancelBtnText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleAdd}
              activeOpacity={0.7}
            >
              <Text style={styles.saveBtnText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Add Button */}
      {!showForm && (
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + SIZES.base }]}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={COLORS.textInverse} />
            <Text style={styles.addButtonText}>Добавить локацию</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.base,
    paddingVertical: SIZES.md,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
  },
  list: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES.xl,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.base,
    marginBottom: SIZES.md,
    ...SHADOWS.sm,
  },
  cardContent: {
    flex: 1,
  },
  locationName: {
    fontSize: SIZES.body,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
  },
  locationAddress: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: SIZES.radiusSm,
    backgroundColor: COLORS.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SIZES.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES['4xl'],
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  emptyTitle: {
    fontSize: SIZES.title,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  formCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.base,
    ...SHADOWS.md,
  },
  formTitle: {
    fontSize: SIZES.subtitle,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  input: {
    height: SIZES.inputHeight,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMd,
    paddingHorizontal: SIZES.base,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SIZES.md,
    marginTop: SIZES.xs,
  },
  cancelBtn: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.surface,
  },
  cancelBtnText: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    color: COLORS.textSecondary,
  },
  saveBtn: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMd,
    backgroundColor: COLORS.accent,
  },
  saveBtnText: {
    fontSize: SIZES.body,
    ...FONTS.medium,
    color: COLORS.textInverse,
  },
  bottomArea: {
    paddingHorizontal: SIZES.lg,
    paddingTop: SIZES.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SIZES.sm,
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.accent,
    borderRadius: SIZES.radiusLg,
    ...SHADOWS.md,
  },
  addButtonText: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.semibold,
    color: COLORS.textInverse,
  },
});
