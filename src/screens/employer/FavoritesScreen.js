import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';

export default function FavoritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const favorites = useStore(s => s.favorites);
  const workers = useStore(s => s.workers);
  const toggleFavorite = useStore(s => s.toggleFavorite);

  const favoriteWorkers = useMemo(
    () => workers.filter(w => favorites.includes(w.id)),
    [workers, favorites],
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
      <Image
        source={{ uri: worker.avatar || 'https://i.pravatar.cc/200?img=0' }}
        style={styles.avatar}
      />
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
      <TouchableOpacity
        style={styles.heartBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        onPress={() => toggleFavorite(worker.id)}
      >
        <Ionicons name="heart" size={22} color={COLORS.error} />
      </TouchableOpacity>
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
});
