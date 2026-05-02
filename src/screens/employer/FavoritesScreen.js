import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar, Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';
import Avatar from '../../components/Avatar';
import { formatDate } from '../../utils/formatDate';

export default function FavoritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const favorites = useStore(s => s.favorites);
  const currentUser = useStore(s => s.currentUser);
  const workers = useStore(s => s.workers);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const shifts = useStore(s => s.shifts);
  const inviteWorkerToShift = useStore(s => s.inviteWorkerToShift);
  const [inviteWorkerId, setInviteWorkerId] = useState(null);

  const activeShifts = useMemo(
    () => shifts.filter(s => s.companyId === currentUser?.id && s.status === 'active'),
    [shifts, currentUser],
  );

  const userFavorites = favorites[currentUser?.id] || [];

  const handleInvite = (shiftId) => {
    const result = inviteWorkerToShift(inviteWorkerId, shiftId);
    setInviteWorkerId(null);
    if (result?.error === 'already_invited') {
      Alert.alert('', 'Приглашение уже отправлено');
    } else {
      Alert.alert('', 'Приглашение отправлено!');
    }
  };
  const favoriteWorkers = useMemo(
    () => workers.filter(w => userFavorites.includes(w.id)),
    [workers, userFavorites],
  );

  const renderStars = (rating) => {
    const stars = [];
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < full) {
        stars.push(<Ionicons key={i} name="star" size={13} color={COLORS.star} />);
      } else if (i === full && half) {
        stars.push(<Ionicons key={i} name="star-half" size={13} color={COLORS.star} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={13} color={COLORS.star} />);
      }
    }
    return stars;
  };

  const renderWorker = ({ item: worker }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PublicWorkerProfile', { workerId: worker.id })}
    >
      <Avatar uri={worker.avatar} name={worker.firstName} name2={worker.lastName} size={52} />
      <View style={styles.workerInfo}>
        <Text style={styles.workerName} numberOfLines={1}>
          {worker.firstName} {worker.lastName}
        </Text>
        {!!worker.city && (
          <Text style={styles.cityText} numberOfLines={1}>{worker.city}</Text>
        )}
        <View style={styles.ratingRow}>
          {worker.rating > 0 ? (
            <>
              <View style={styles.starsRow}>{renderStars(worker.rating)}</View>
              <Text style={styles.ratingValue}>{worker.rating.toFixed(1)}</Text>
            </>
          ) : (
            <Text style={styles.noRating}>Нет оценок</Text>
          )}
        </View>
        <Text style={styles.shiftsText}>{worker.shiftsCompleted} смен выполнено</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          style={styles.heartBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => toggleFavorite(worker.id)}
        >
          <Ionicons name="heart" size={22} color={COLORS.error} />
        </TouchableOpacity>
        {activeShifts.length > 0 && (
          <TouchableOpacity
            style={styles.inviteSmBtn}
            onPress={() => setInviteWorkerId(worker.id)}
          >
            <Ionicons name="paper-plane-outline" size={14} color={COLORS.accent} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Избранные исполнители</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Invite modal */}
      <Modal visible={!!inviteWorkerId} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setInviteWorkerId(null)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Выберите смену</Text>
            {activeShifts.map(shift => (
              <TouchableOpacity key={shift.id} style={styles.modalItem} onPress={() => handleInvite(shift.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalItemTitle}>{shift.title}</Text>
                  <Text style={styles.modalItemSub}>{formatDate(shift.date)}, {shift.timeStart}–{shift.timeEnd}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setInviteWorkerId(null)}>
              <Text style={styles.modalCancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* List */}
      <FlatList
        data={favoriteWorkers}
        renderItem={renderWorker}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={56} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>Нет избранных</Text>
            <Text style={styles.emptySubtitle}>Добавляйте исполнителей в избранное</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: SIZES.bodyLarge,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },

  list: {
    paddingHorizontal: SIZES.lg,
    paddingBottom: SIZES['3xl'],
    flexGrow: 1,
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.skeleton,
  },
  workerInfo: {
    flex: 1,
    marginLeft: SIZES.md,
  },
  workerName: {
    fontSize: SIZES.bodyLarge,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
  },
  cityText: {
    fontSize: SIZES.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  ratingValue: {
    fontSize: SIZES.small,
    ...FONTS.medium,
    color: COLORS.textPrimary,
    marginLeft: SIZES.xs,
  },
  noRating: {
    fontSize: SIZES.small,
    color: COLORS.textTertiary,
  },
  shiftsText: {
    fontSize: SIZES.caption,
    color: COLORS.textTertiary,
    marginTop: 3,
  },

  heartBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingTop: SIZES['5xl'] * 2,
  },
  emptyTitle: {
    fontSize: SIZES.title,
    ...FONTS.semibold,
    color: COLORS.textPrimary,
    marginTop: SIZES.lg,
  },
  emptySubtitle: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
  },

  inviteSmBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.accentSoft, justifyContent: 'center', alignItems: 'center',
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl, padding: SIZES.lg, paddingBottom: SIZES['3xl'] },
  modalTitle: { fontSize: SIZES.title, ...FONTS.semibold, color: COLORS.textPrimary, marginBottom: SIZES.md },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.md, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight },
  modalItemTitle: { fontSize: SIZES.body, ...FONTS.medium, color: COLORS.textPrimary },
  modalItemSub: { fontSize: SIZES.small, color: COLORS.textSecondary, marginTop: 2 },
  modalCancel: { marginTop: SIZES.lg, alignItems: 'center', paddingVertical: SIZES.md },
  modalCancelText: { fontSize: SIZES.bodyLarge, ...FONTS.medium, color: COLORS.textSecondary },
});
