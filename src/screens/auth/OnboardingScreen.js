import React from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SIZES, FAMILIES } from '../../constants/theme';
import { MonoTag, Money, PrimaryButton } from '../../components/ui/Atoms';

/**
 * Editorial-style welcome screen.
 * Big "00" canary signal in the corner, layered headline with serif italic accent.
 */
export default function OnboardingScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.paper} />

      <View style={styles.topBar}>
        <Text style={styles.wordmark}>
          смена<Text style={styles.dot}>·</Text>бел
        </Text>
        <MonoTag>Издание №01 · Минск</MonoTag>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.hero}>
          <View style={styles.heroNumber}>
            <Text style={styles.heroDigits} adjustsFontSizeToFit numberOfLines={1}>00</Text>
          </View>

          <Text style={styles.heroH1} adjustsFontSizeToFit numberOfLines={3}>
            Получай{'\n'}
            <Text style={styles.serif}>деньги</Text> за{'\n'}свою смену.
          </Text>

          <View style={styles.heroMeta}>
            <Text style={styles.metaLabel}>в среднем</Text>
            <Money amount="68" size={28} color={COLORS.fg} />
            <Text style={styles.metaLabel}>· за смену</Text>
          </View>
        </View>

        <View style={styles.features}>
          <Feature num="01" title="Найди смену рядом" text="Сотни смен в Минске и других городах: ПВЗ, общепит, склад, ритейл, клининг." />
          <Feature
            num="02"
            title={<>Откликнись в <Text style={styles.serif}>один тап</Text></>}
            text="Выбираешь смену, отправляешь заявку. Работодатель отвечает в чате."
          />
          <Feature num="03" title="Получай за смену" text="Прозрачная оплата, рейтинги, отзывы. Без серых схем." />
        </View>

        <View style={styles.ticker}>
          <View style={styles.tickerRow}>
            <View>
              <Text style={styles.tickerLabel}>СМЕН В ЛЕНТЕ</Text>
              <Text style={styles.tickerValue}>142</Text>
            </View>
            <View>
              <Text style={styles.tickerLabel}>СРОЧНЫХ</Text>
              <Text style={[styles.tickerValue, { color: COLORS.live }]}>09</Text>
            </View>
            <View>
              <Text style={styles.tickerLabel}>ВЫПЛАТА</Text>
              <Text style={[styles.tickerValue, { color: COLORS.signal, fontSize: 22 }]}>сразу</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + SIZES.md }]}>
        <PrimaryButton title="Начать" icon="arrow" onPress={() => navigation.replace('RoleSelect')} />
        <View style={styles.legal}>
          <Text style={styles.legalText}>Продолжая, ты соглашаешься с </Text>
          <Text style={styles.legalLink}>условиями</Text>
          <Text style={styles.legalText}> и </Text>
          <Text style={styles.legalLink}>политикой</Text>
        </View>
      </View>
    </View>
  );
}

function Feature({ num, title, text }) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureNum}>{num}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.paper },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  wordmark: { fontFamily: FAMILIES.display, fontSize: 18, color: COLORS.ink, letterSpacing: -0.6 },
  dot: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic', color: COLORS.live },

  hero: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 28 },
  heroNumber: {
    position: 'absolute',
    top: 4,
    right: 18,
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: COLORS.signal,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '6deg' }],
  },
  heroDigits: { fontFamily: FAMILIES.display, fontSize: 78, color: COLORS.ink, letterSpacing: -3, lineHeight: 80, includeFontPadding: false },
  heroH1: { fontFamily: FAMILIES.display, fontSize: 38, lineHeight: 40, letterSpacing: -1.5, color: COLORS.ink, marginTop: 8, maxWidth: '78%' },
  serif: { fontFamily: FAMILIES.serifItalic, fontStyle: 'italic', color: COLORS.ink },
  heroMeta: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 24 },
  metaLabel: { fontFamily: FAMILIES.mono, fontSize: 11, color: COLORS.fgMuted, letterSpacing: 1, textTransform: 'uppercase' },

  features: { paddingHorizontal: 22, paddingTop: 20, gap: 22 },
  feature: { flexDirection: 'row', alignItems: 'flex-start', gap: 18 },
  featureNum: { fontFamily: FAMILIES.mono, fontSize: 13, color: COLORS.fgFaint, letterSpacing: 0.5, paddingTop: 4 },
  featureTitle: { fontFamily: FAMILIES.display, fontSize: 22, letterSpacing: -0.8, color: COLORS.ink, lineHeight: 24 },
  featureText: { fontFamily: FAMILIES.text, fontSize: 14, color: COLORS.fgMuted, lineHeight: 20, marginTop: 6 },

  ticker: { marginHorizontal: 22, marginTop: 32, backgroundColor: COLORS.graphite, borderRadius: SIZES.radiusBlock, padding: 20 },
  tickerRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  tickerLabel: { fontFamily: FAMILIES.mono, fontSize: 9.5, color: 'rgba(244,241,234,0.55)', letterSpacing: 1, textTransform: 'uppercase' },
  tickerValue: { fontFamily: FAMILIES.display, fontSize: 30, color: COLORS.fgInv, letterSpacing: -0.8, marginTop: 6 },

  ctaBar: { paddingHorizontal: 22, paddingTop: 12, backgroundColor: COLORS.paper, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.line },
  legal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  legalText: { fontFamily: FAMILIES.text, fontSize: 11, color: COLORS.fgFaint },
  legalLink: { fontFamily: FAMILIES.textSemi, fontSize: 11, color: COLORS.ink, textDecorationLine: 'underline' },
});
