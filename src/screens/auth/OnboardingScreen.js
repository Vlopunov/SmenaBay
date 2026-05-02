import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, StatusBar, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'search',
    color: '#4F46E5',
    bg: '#EEF2FF',
    title: 'Найдите подработку рядом',
    desc: 'Сотни смен в вашем городе: ПВЗ, HoReCa, склады, ритейл и другие. Фильтруйте по категории, оплате и расположению.',
  },
  {
    icon: 'flash',
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Откликайтесь в 1 тап',
    desc: 'Выберите смену, нажмите «Откликнуться» — и ждите подтверждения. Общайтесь с заказчиком прямо в чате.',
  },
  {
    icon: 'shield-checkmark',
    color: '#059669',
    bg: '#D1FAE5',
    title: 'Безопасно и прозрачно',
    desc: 'Рейтинги, отзывы и верификация. Видите репутацию заказчика до отклика. Ваши данные защищены.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('RoleSelect');
    }
  };

  const handleSkip = () => {
    navigation.replace('RoleSelect');
  };

  const renderSlide = ({ item, index }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
        <Ionicons name={item.icon} size={64} color={item.color} />
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideDesc}>{item.desc}</Text>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipText}>{isLast ? '' : 'Пропустить'}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: COLORS.accent }]}
              />
            );
          })}
        </View>

        {/* Button */}
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.7}>
          {isLast ? (
            <Text style={styles.nextBtnText}>Начать</Text>
          ) : (
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: SIZES.lg, paddingVertical: SIZES.md },
  skipText: { fontSize: SIZES.body, color: COLORS.textTertiary, ...FONTS.medium },

  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SIZES['2xl'] },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center', marginBottom: SIZES['2xl'],
  },
  slideTitle: {
    fontSize: 28, ...FONTS.bold, color: COLORS.textPrimary,
    textAlign: 'center', letterSpacing: -0.5,
  },
  slideDesc: {
    fontSize: SIZES.bodyLarge, color: COLORS.textSecondary,
    textAlign: 'center', marginTop: SIZES.md, lineHeight: 24,
  },

  bottom: { paddingHorizontal: SIZES.lg, paddingBottom: SIZES.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SIZES.xl },
  dot: { height: 8, borderRadius: 4 },

  nextBtn: {
    height: 56, backgroundColor: COLORS.accent, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  nextBtnText: { fontSize: SIZES.bodyLarge, ...FONTS.bold, color: COLORS.white },
});
