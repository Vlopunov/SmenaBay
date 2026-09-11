// Chat about a shift (screen 18). The shift is pinned under the header —
// time, money, status — so «во сколько?» never needs asking. System
// messages sit in the centre, neutral. Ready phrases above the input follow
// the shift's state: typing on the move is awkward.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, FlatList, TextInput, KeyboardAvoidingView, Keyboard, Platform, Image, Modal, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { Press, Material } from '../../design/ui';
import { PersonMono, CompanyMono } from '../../design/Monogram';
import { SkyView, skyKey } from '../../design/Sky';
import { StatusBadge } from '../../design/Status';
import { categoryOf } from '../../design/category';
import { useNow } from '../../design/PassCard';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import {
  presence, clock, dayLabel, shortDate, timeRange, money, daySection, countdown,
} from '../../design/format';
import { openReportMenu } from '../../components/ReportMenu';
import useStore from '../../store/useStore';

/** Read ticks: one when sent, two when read. */
function Ticks({ read, color, size = 14 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      {read ? (
        <>
          <Path d="m3 13 3.5 3.5L13 9" />
          <Path d="m11 13 3.5 3.5L21 9" />
        </>
      ) : <Path d="m6 12.5 3.8 3.8L18 8" />}
    </Svg>
  );
}

// The worker talks to the company's contact person; a company without one
// is shown as the company. The employer talks to the worker.
function partnerOf(isWorker, company, worker) {
  if (!isWorker) {
    const name = `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim() || 'Исполнитель';
    return { kind: 'person', first: worker?.firstName, last: worker?.lastName, uri: worker?.avatar, name, lastSeen: worker?.lastSeen };
  }
  const contact = company?.contactPerson?.trim();
  if (contact) {
    const [first, ...rest] = contact.split(/\s+/);
    return { kind: 'person', first, last: rest.join(' '), name: contact, lastSeen: company?.lastSeen };
  }
  return { kind: 'company', name: company?.companyName || 'Заказчик', logo: company?.logo, lastSeen: company?.lastSeen };
}

// Phrases follow the shift: before the day — «Буду вовремя»; on the day
// and while it runs — «Я на месте»; after it — thanks.
function phrasesFor(isWorker, shift, now) {
  if (shift?.status === 'cancelled') return [];
  const phase = shift ? countdown(shift, now).phase : 'before';
  const ended = phase === 'ended' || shift?.status === 'completed';
  const onTheDay = phase === 'running' || (shift && dayLabel(shift.date, now) === 'Сегодня');
  if (isWorker) {
    if (ended) return ['Спасибо за смену!'];
    if (onTheDay) return ['Я на месте', 'Задержусь на 10 минут', 'Как найти вход?'];
    return ['Буду вовремя', 'Задержусь на 10 минут', 'Как найти вход?'];
  }
  if (ended) return ['Спасибо за работу!'];
  if (onTheDay) return ['Ждём вас', 'Вход со двора', 'Перезвоните, пожалуйста'];
  return ['Ждём вас', 'Возьмите паспорт', 'Вход со двора'];
}

// The pinned shift's badge: the same states as everywhere else (§9.2).
function stateFor(shift, appStatus, now) {
  if (!shift) return null;
  if (shift.status === 'cancelled' || appStatus === 'cancelled_by_worker') return 'cancelled';
  const phase = countdown(shift, now).phase;
  if (appStatus === 'completed' || shift.status === 'completed' || (phase === 'ended' && appStatus === 'approved')) return 'done';
  if (appStatus === 'approved') return phase === 'running' ? 'running' : 'confirmed';
  if (appStatus === 'pending') return 'pending';
  if (appStatus === 'rejected') return 'rejected';
  return null;
}

// On iOS the input sits on the keyboard, so the home-indicator inset goes.
function useKeyboardShown() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const a = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setShown(true));
    const b = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setShown(false));
    return () => { a.remove(); b.remove(); };
  }, []);
  return shown;
}

function Bubble({ msg, mine, author, onImage }) {
  const { c } = useTheme();
  if (msg.isSystem || msg.senderId === 'system') {
    return (
      <View style={{ alignSelf: 'center', maxWidth: '88%', marginVertical: 2, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 9, backgroundColor: c.surface2 }}>
        <T v="caption" c="ink3" weight="500" style={{ fontSize: 11.5, lineHeight: 15, textAlign: 'center' }}>
          {msg.text}{msg.createdAt ? ` · ${clock(msg.createdAt)}` : ''}
        </T>
      </View>
    );
  }
  const img = !!msg.imageUri;
  const time = clock(msg.createdAt);
  return (
    <View
      accessible={!img}
      accessibilityLabel={img ? undefined : `${mine ? 'Ты' : author}: ${msg.text}, ${time}${mine ? (msg.read ? ', прочитано' : ', отправлено') : ''}`}
      style={[{
        maxWidth: '80%', alignSelf: mine ? 'flex-end' : 'flex-start',
        backgroundColor: mine ? c.brand : c.surface,
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        borderBottomRightRadius: mine ? 5 : 16, borderBottomLeftRadius: mine ? 16 : 5,
        paddingHorizontal: img ? 4 : 13, paddingTop: img ? 4 : 10, paddingBottom: 8,
      }, !mine && { borderWidth: 1, borderColor: c.line }]}
    >
      {img ? (
        <Press feedback="none" onPress={() => onImage(msg.imageUri)} accessibilityLabel="Фото, открыть">
          <Image source={{ uri: msg.imageUri }} style={{ width: 220, height: 220, borderRadius: 12, backgroundColor: c.surface2 }} />
        </Press>
      ) : null}
      {msg.text ? (
        <T v="body" c={mine ? 'onBrand' : 'ink'} style={[{ fontSize: 15, lineHeight: 21 }, img && { paddingHorizontal: 9, paddingTop: 6 }]}>{msg.text}</T>
      ) : null}
      <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: mine ? 'flex-end' : 'flex-start', gap: 4, paddingHorizontal: img ? 9 : 0 }}>
        <T v="caption" c={mine ? 'onBrand' : 'ink2'} style={{ fontSize: 11, lineHeight: 13, opacity: mine ? 0.7 : 1 }}>{time}</T>
        {mine ? <View style={{ opacity: 0.85 }}><Ticks read={msg.read} color={c.onBrand} /></View> : null}
      </View>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const now = useNow(30000);
  const keyboard = useKeyboardShown();
  const me = useStore((s) => s.currentUser);
  const conv = useStore((s) => s.conversations.find((x) => x.id === conversationId));
  const shift = useStore((s) => (conv ? s.getShiftById(conv.shiftId) : null));
  const company = useStore((s) => (conv ? s.getCompanyById(conv.companyId) : null));
  const worker = useStore((s) => (conv ? s.getWorkerById(conv.workerId) : null));
  const appStatus = useStore((s) => {
    if (!conv) return null;
    const apps = s.applications.filter((a) => a.shiftId === conv.shiftId && a.workerId === conv.workerId);
    return (apps.find((a) => a.status !== 'cancelled_by_worker') || apps[0])?.status || null;
  });
  const sendMessage = useStore((s) => s.sendMessage);
  const markRead = useStore((s) => s.markConversationRead);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const list = useRef(null);

  const isWorker = me?.role !== 'employer';
  const partnerId = isWorker ? conv?.companyId : conv?.workerId;

  useEffect(() => { if (conv) markRead(conversationId); }, [conv?.messages?.length]);

  // Newest at the bottom: an inverted list, with a day label between days.
  const rows = useMemo(() => {
    if (!conv) return [];
    const out = [];
    let lastDay = null;
    conv.messages.forEach((m) => {
      const day = new Date(m.createdAt).toDateString();
      if (day !== lastDay) { out.push({ id: `day-${day}`, day: m.createdAt }); lastDay = day; }
      out.push(m);
    });
    return out.reverse();
  }, [conv?.messages]);

  if (!conv || !me) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  const partner = partnerOf(isWorker, company, worker);
  const seen = presence(partner.lastSeen, now);
  const online = seen === 'в сети';
  const sub = isWorker
    ? [seen || 'заказчик', partner.kind === 'person' ? company?.companyName : null].filter(Boolean).join(' · ')
    : seen || 'исполнитель';
  const reportName = isWorker ? company?.companyName || partner.name : partner.name;

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    sendMessage(conversationId, v);
    haptic.light();
    if (value == null) setText('');
    list.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const attach = () => showActions({
    options: [
      { label: 'Снять фото', onPress: () => pick('camera') },
      { label: 'Выбрать из галереи', onPress: () => pick('library') },
    ],
  });

  const pick = async (source) => {
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(source === 'camera' ? 'Нет доступа к камере' : 'Нет доступа к фото', 'Разреши доступ в Настройках, чтобы отправлять фото в чат.');
      return;
    }
    const r = source === 'camera'
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (r.canceled || !r.assets?.[0]) return;
    const m = await ImageManipulator.manipulateAsync(r.assets[0].uri, [{ resize: { width: 1200 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
    sendMessage(conversationId, '', m.uri);
    haptic.light();
  };

  const openProfile = () => (isWorker
    ? navigation.navigate('PublicCompanyProfile', { companyId: conv.companyId })
    : navigation.navigate('PublicWorkerProfile', { workerId: conv.workerId }));

  const phrases = phrasesFor(isWorker, shift, now);
  const state = stateFor(shift, appStatus, now);
  const dayWord = shift ? (() => {
    const l = dayLabel(shift.date, now);
    return l === 'Сегодня' || l === 'Завтра' || l === 'Вчера' ? l.toLowerCase() : shortDate(shift.date);
  })() : '';
  const shiftSub = shift ? `${dayWord} ${timeRange(shift)} · ${money(shift.pay)} BYN` : '';
  const dot = 11;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Header on the material: back · who · presence · «···» */}
      <Material edge="bottom" style={{ paddingTop: insets.top + 2, paddingBottom: 10, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
          <Press feedback="none" onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Назад" style={{ width: 26, height: 44, alignItems: 'flex-start', justifyContent: 'center' }}>
            <Icon name="chevron.left" size={22} c="brand" weight="semibold" />
          </Press>
          <Press
            feedback="none"
            onPress={openProfile}
            style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 11 }}
            accessibilityLabel={`${partner.name}, ${sub}. Открыть профиль`}
          >
            {partner.kind === 'person' ? (
              <PersonMono first={partner.first} last={partner.last} uri={partner.uri} size={38} online={online} ring={c.bg} />
            ) : (
              <View>
                <CompanyMono name={partner.name} logo={partner.logo} size={38} category={categoryOf(shift, company)} />
                {online ? <View style={{ position: 'absolute', right: -1, bottom: -1, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c.success, borderWidth: 2, borderColor: c.bg }} /> : null}
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" style={{ fontSize: 16, lineHeight: 20 }} numberOfLines={1}>{partner.name}</T>
              <T v="caption" c={online ? 'success' : 'ink2'} style={{ marginTop: 1, fontSize: 12, lineHeight: 16 }} numberOfLines={1}>{sub}</T>
            </View>
          </Press>
          <Press
            feedback="none"
            onPress={() => openReportMenu({ targetType: 'user', targetId: partnerId, targetName: reportName, store: useStore.getState() })}
            hitSlop={6}
            accessibilityLabel="Ещё: пожаловаться или заблокировать"
            style={{ width: 36, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Icon name="ellipsis" size={21} c="ink3" weight="semibold" />
          </Press>
        </View>
      </Material>

      {/* The shift this conversation is about */}
      {shift ? (
        <Press
          feedback="highlight"
          onPress={() => navigation.navigate(isWorker ? 'ShiftDetail' : 'ShiftManage', { shiftId: shift.id })}
          style={{ backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.line }}
          accessibilityLabel={`Смена ${shift.title}, ${shiftSub}. Открыть смену`}
        >
          <View style={{ paddingVertical: 9, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <SkyView sky={skyKey(shift, { now, ignoreClosed: true })} radius={9} style={{ width: 28, height: 28 }} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong" weight="700" style={{ fontSize: 13.5, lineHeight: 17 }} numberOfLines={1}>{shift.title}</T>
              <T v="caption" c="ink2" weight="500" style={{ marginTop: 2, fontSize: 11.5, lineHeight: 14 }} numberOfLines={1}>{shiftSub}</T>
            </View>
            {state ? <StatusBadge state={state} size="sm" style={{ alignSelf: 'center' }} /> : null}
          </View>
        </Press>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={list}
          inverted
          data={rows}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 9 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (item.day
            ? <T v="caption" c="ink2" weight="600" style={{ alignSelf: 'center', paddingVertical: 4, fontSize: 12, lineHeight: 15 }}>{daySection(new Date(item.day))}</T>
            : <Bubble msg={item} mine={item.senderId === me.id} author={partner.name} onImage={setPreview} />)}
          ListEmptyComponent={(
            <View style={{ transform: [{ scaleY: -1 }], paddingVertical: 40, alignItems: 'center', gap: 6 }}>
              <T v="rowTitle" style={{ fontSize: 16 }}>Напиши первым</T>
              <T v="caption" c="ink2" style={{ textAlign: 'center', paddingHorizontal: 30, fontSize: 13.5, lineHeight: 19 }}>
                {isWorker ? 'Уточни детали смены — заказчик увидит сообщение сразу.' : 'Напомни, что взять и где вход.'}
              </T>
            </View>
          )}
        />

        {phrases.length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: c.line }}>
            {phrases.map((p) => (
              <Press
                key={p}
                onPress={() => send(p)}
                hitSlop={{ top: 7, bottom: 7 }}
                accessibilityLabel={`Отправить: ${p}`}
                style={{ minHeight: 30, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 11, backgroundColor: c.brandTint, justifyContent: 'center' }}
              >
                <T v="bodyStrong" c="brand" style={{ fontSize: 13, lineHeight: 16 }}>{p}</T>
              </Press>
            ))}
          </View>
        ) : null}

        <Material style={{ paddingTop: 9, paddingHorizontal: 16, paddingBottom: keyboard ? 9 : Math.max(insets.bottom, 9) }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <Press feedback="none" onPress={attach} hitSlop={8} accessibilityLabel="Прикрепить фото" style={{ width: 28, height: 38, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={23} c="ink2" />
            </Press>
            <View style={{ flex: 1, minHeight: 38, borderRadius: 19, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, justifyContent: 'center' }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Сообщение"
                placeholderTextColor={c.ink2}
                multiline
                style={{ fontSize: 15, lineHeight: 20, color: c.ink, paddingTop: 8, paddingBottom: 8, maxHeight: 120 }}
                accessibilityLabel="Сообщение"
              />
            </View>
            <Press
              onPress={() => send()}
              disabled={!text.trim()}
              hitSlop={6}
              accessibilityLabel="Отправить"
              accessibilityState={{ disabled: !text.trim() }}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="arrow.right" size={19} c="onBrand" weight="bold" />
            </Press>
          </View>
        </Material>
      </KeyboardAvoidingView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreview(null)} accessibilityLabel="Закрыть фото">
          {preview ? <Image source={{ uri: preview }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}
