// «Код из сообщения». One logical input (so SMS autofill fills it without a
// tap) drawn as separate cells; the active cell has a 2 pt accent ring.
// The mockup shows four cells — Firebase sends six digits, so there are six.
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, Note } from '../../design/ui';
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

export default function CodeScreen({ navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
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
        completeSignIn(navigation);
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

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar onBack={() => navigation.goBack()} variant="fill" />
      <View style={{ paddingHorizontal: 22, paddingTop: 30 }}>
        <T v="title" accessibilityRole="header">Код из сообщения</T>
        <T v="body" c="secondary" style={{ marginTop: 7 }}>
          Отправили на {prettyPhone(phone)}.{shift ? ` После входа сразу отправим отклик на «${shift.title}».` : ''}
        </T>
      </View>

      <Pressable onPress={() => input.current?.focus()} accessibilityLabel={`Код из SMS, введено ${code.length} из ${LEN}`}>
        <Animated.View style={[{ flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingTop: 32 }, shaker]}>
          {Array.from({ length: LEN }).map((_, i) => {
            const active = i === code.length && !busy;
            return (
              <View key={i} style={{
                flex: 1, height: 62, borderRadius: 14, backgroundColor: c.fill,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: error ? c.destructive : active ? c.accent : 'transparent',
                opacity: busy ? 0.5 : 1,
              }}>
                {code[i] ? <T v="title" style={{ fontWeight: '600' }}>{code[i]}</T> : active ? <View style={{ width: 2, height: 30, backgroundColor: c.accent }} /> : null}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingTop: 16 }}>
          <Icon name="exclamationmark.circle" size={14} c="destructive" />
          <T v="body" c="destructive">{error}</T>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 22, paddingTop: error ? 10 : 20 }}>
        {left > 0 ? (
          <>
            <Icon name="clock" size={14} c="secondary" />
            <T v="body" c="secondary">Новый код можно запросить через {mm}</T>
          </>
        ) : (
          <Press onPress={resend} feedback="none" hitSlop={10}><T v="body" c="accent">Отправить код ещё раз</T></Press>
        )}
      </View>
      <Press onPress={() => navigation.goBack()} feedback="none" hitSlop={10} style={{ paddingHorizontal: 22, paddingTop: 22, alignSelf: 'flex-start' }}>
        <T v="body" c="accent">Изменить номер</T>
      </Press>

      <View style={{ marginTop: 'auto', paddingBottom: insets.bottom + 12 }}>
        <Note icon="lock.shield">
          Продолжая, ты соглашаешься с <T v="small" c="accent" onPress={() => openLink(LINKS.terms)}>правилами платформы</T> и <T v="small" c="accent" onPress={() => openLink(LINKS.privacy)}>обработкой данных</T>.
        </Note>
      </View>
    </View>
  );
}
