// «Код из SMS» (screen 7). One logical input (so SMS autofill fills it
// without a tap) drawn as six cells across the full width — a 54×60 touch
// target each; the active cell has a 2 pt brand ring and a caret. The
// keypad is the system numberPad, raised at once.
import React, { useEffect, useRef, useState } from 'react';
import {
  View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withRepeat, withDelay, cancelAnimation, Easing, useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, CircleButton } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { motion } from '../../design/tokens';
import { haptic } from '../../design/haptics';
import { prettyPhone } from '../../design/PhoneField';
import { LINKS, openLink } from '../../constants/links';
import { verifyCode, sendVerificationCode } from '../../services/auth';
import { useAuthFlow, completeSignIn } from '../../services/authFlow';
import useStore from '../../store/useStore';

const LEN = 6;
const REJECT = Easing.bezier(...motion.reject.bezier);

/** Blinking caret of the active cell; still under Reduce Motion. */
function Caret({ color }) {
  const reduced = useReducedMotion();
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return undefined;
    o.value = withRepeat(withSequence(
      withDelay(450, withTiming(0, { duration: 90 })),
      withDelay(360, withTiming(1, { duration: 90 })),
    ), -1);
    return () => cancelAnimation(o);
  }, [reduced, o]);
  const st = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ width: 2, height: 28, borderRadius: 1, backgroundColor: color }, st]} />;
}

/** A message with a check (handoff glyph): the code arrives on its own. */
function SmsGlyph({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <Path d="M9.5 7.5h5" />
      <Path d="m9 13.5 1.8 1.8L15 11" />
    </Svg>
  );
}

export default function CodeScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const compact = useWindowDimensions().width < 380;
  const G = compact ? 20 : 24;
  const { phone, verification, intent } = useAuthFlow();
  const start = useAuthFlow((s) => s.start);
  const shift = useStore((s) => (intent?.shiftId || intent?.then?.shiftId ? s.getShiftById(intent.shiftId || intent.then.shiftId) : null));

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [left, setLeft] = useState(60);
  const input = useRef(null);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft(left - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const fail = (message) => {
    setError(message);
    setCode('');
    haptic.error();
    if (!reduced) {
      const q = motion.reject.duration / 8;
      shake.value = withSequence(
        withTiming(-7, { duration: q, easing: REJECT }), withTiming(7, { duration: q * 2, easing: REJECT }),
        withTiming(-7, { duration: q * 2, easing: REJECT }), withTiming(7, { duration: q * 2, easing: REJECT }),
        withTiming(0, { duration: q, easing: REJECT }),
      );
    }
  };

  const onChange = async (t) => {
    const v = t.replace(/\D/g, '').slice(0, LEN);
    setCode(v);
    if (error) setError('');
    if (v.length === LEN && !busy) {
      setBusy(true);
      try {
        await verifyCode(verification, v);
        haptic.success();
        // Still busy: the profile has to come back from the server before
        // the next screen can know who this is.
        await completeSignIn(navigation);
      } catch (e) {
        fail(e.message);
      } finally {
        setBusy(false);
      }
    }
  };

  const resend = async () => {
    try {
      const v = await sendVerificationCode(phone);
      start(phone, v, intent);
      setLeft(60);
      setError('');
    } catch (e) {
      fail(e.message);
    }
  };

  const shaker = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  const link = { fontSize: 14.5, lineHeight: 19 };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 4, paddingHorizontal: G, paddingBottom: insets.bottom + 20 }}
        >
          <View style={{ alignSelf: 'flex-start' }}>
            <CircleButton icon="chevron.left" color={c.ink} onPress={() => navigation.goBack()} accessibilityLabel="Назад" />
          </View>

          <T v="titleScreen" style={{ marginTop: 24, lineHeight: 32 }} accessibilityRole="header">Код из SMS</T>
          <T v="body" c="ink2" style={{ marginTop: 8, fontSize: 15, lineHeight: 22 }}>
            Отправили на <T v="body" c="ink" weight="600" style={{ fontSize: 15, lineHeight: 22 }}>{prettyPhone(phone)}</T>
            {shift ? `. После входа сразу отправим отклик на «${shift.title}».` : ''}
          </T>

          <Pressable
            onPress={() => input.current?.focus()}
            accessibilityRole="button"
            accessibilityLabel={`Код из SMS, введено ${code.length} из ${LEN}`}
            accessibilityHint="Открывает клавиатуру"
          >
            <Animated.View style={[{ flexDirection: 'row', gap: compact ? 6 : 8, marginTop: 22 }, shaker]}>
              {Array.from({ length: LEN }).map((_, i) => {
                const active = i === code.length && !busy;
                const ring = !!error || active;
                return (
                  <View
                    key={i}
                    style={{
                      flex: 1, height: 60, borderRadius: 13, backgroundColor: c.surface,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: ring ? 2 : 1, borderColor: error ? c.error : active ? c.brand : c.line,
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    {code[i]
                      ? <T display weight="700" style={{ fontSize: 26, lineHeight: 30 }} maxFontSizeMultiplier={1.2}>{code[i]}</T>
                      : active ? <Caret color={c.brand} /> : null}
                  </View>
                );
              })}
            </Animated.View>
          </Pressable>
          <TextInput
            ref={input}
            value={code}
            onChangeText={onChange}
            autoFocus
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={LEN}
            caretHidden
            style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
          />

          {error ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }} accessibilityLiveRegion="polite">
              <Icon name="exclamationmark.circle" size={14} c="error" />
              <T v="caption" c="error" style={{ flex: 1, fontSize: 13.5, lineHeight: 18 }}>{error}</T>
            </View>
          ) : null}

          <View style={{ marginTop: error ? 12 : 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            {left > 0 ? (
              <T v="body" c="ink2" style={link}>Новый код через {mm}</T>
            ) : (
              <Press onPress={resend} feedback="none" hitSlop={12} accessibilityLabel="Отправить код снова">
                <T v="body" c="brand" weight="600" style={link}>Отправить снова</T>
              </Press>
            )}
            <Press onPress={() => navigation.goBack()} feedback="none" hitSlop={12}>
              <T v="body" c="brand" weight="600" style={link}>Изменить номер</T>
            </Press>
          </View>

          <View style={{ marginTop: 26, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 13, backgroundColor: c.successTint, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SmsGlyph color={c.success} />
            <T v="caption" c="success" weight="500" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>Код появится над клавиатурой, когда придёт SMS</T>
          </View>

          <T v="caption" c="ink2" style={{ marginTop: 18, fontSize: 12.5, lineHeight: 19, textAlign: 'center' }}>
            Продолжая, ты принимаешь{' '}
            <T v="caption" c="brand" style={{ fontSize: 12.5, lineHeight: 19 }} onPress={() => openLink(LINKS.terms)} accessibilityRole="link">условия использования</T>
            {' '}и{' '}
            <T v="caption" c="brand" style={{ fontSize: 12.5, lineHeight: 19 }} onPress={() => openLink(LINKS.privacy)} accessibilityRole="link">политику конфиденциальности</T>.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
