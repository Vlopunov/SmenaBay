// Chat about a shift (handoff screen 7). The shift context is pinned under
// the header — time, money, status — so «во сколько?» never needs asking.
// Three ready phrases sit above the input: typing on the move is awkward.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, TextInput, KeyboardAvoidingView, Platform, Image, Modal, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import T from '../../design/Text';
import Icon from '../../design/Icon';
import { NavBar, Press, Monogram, PersonAvatar, Separator, RoundButton } from '../../design/ui';
import { useTheme } from '../../design/theme';
import { haptic } from '../../design/haptics';
import { showActions } from '../../design/ActionSheet';
import { presence, clock, dayLabel, timeRange, money, daySection } from '../../design/format';
import ReportMenu from '../../components/ReportMenu';
import useStore from '../../store/useStore';

const WORKER_PHRASES = ['Буду вовремя', 'Опоздаю на 10 минут', 'Как найти вход?', 'Я на месте'];
const EMPLOYER_PHRASES = ['Ждём вас', 'Возьмите паспорт', 'Вход со двора', 'Перезвоните, пожалуйста'];

function Bubble({ msg, mine, onImage }) {
  const { c } = useTheme();
  if (msg.isSystem || msg.senderId === 'system') {
    return (
      <View style={{ alignSelf: 'center', maxWidth: '86%', paddingVertical: 6, flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
        <Icon name="checkmark.circle" size={13} c="secondary" style={{ marginTop: 2 }} />
        <T v="small" c="secondary" style={{ textAlign: 'center' }}>{msg.text}</T>
      </View>
    );
  }
  return (
    <View style={{
      maxWidth: '80%', alignSelf: mine ? 'flex-end' : 'flex-start',
      backgroundColor: mine ? c.accent : c.fill,
      borderTopLeftRadius: 18, borderTopRightRadius: 18,
      borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6,
      paddingHorizontal: msg.imageUri ? 4 : 14, paddingTop: msg.imageUri ? 4 : 11, paddingBottom: 8,
    }}>
      {msg.imageUri ? (
        <Press feedback="none" onPress={() => onImage(msg.imageUri)} accessibilityLabel="Фото, открыть">
          <Image source={{ uri: msg.imageUri }} style={{ width: 220, height: 220, borderRadius: 14, backgroundColor: c.fillSecondary }} />
        </Press>
      ) : null}
      {msg.text ? <T v="body" c={mine ? 'onAccent' : 'label'} style={msg.imageUri ? { paddingHorizontal: 10, paddingTop: 6 } : null}>{msg.text}</T> : null}
      <T v="label" c={mine ? c.onAccent : 'secondary'} style={{ alignSelf: 'flex-end', marginTop: 4, opacity: mine ? 0.7 : 1, fontWeight: '400', paddingHorizontal: msg.imageUri ? 10 : 0 }}>
        {clock(msg.createdAt)}{mine && msg.read ? ' · прочитано' : ''}
      </T>
    </View>
  );
}

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const me = useStore((s) => s.currentUser);
  const conv = useStore((s) => s.conversations.find((x) => x.id === conversationId));
  const shift = useStore((s) => (conv ? s.getShiftById(conv.shiftId) : null));
  const company = useStore((s) => (conv ? s.getCompanyById(conv.companyId) : null));
  const worker = useStore((s) => (conv ? s.getWorkerById(conv.workerId) : null));
  const approved = useStore((s) => (conv ? s.applications.some((a) => a.shiftId === conv.shiftId && a.workerId === conv.workerId && a.status === 'approved') : false));
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

  if (!conv || !me) return <View style={{ flex: 1, backgroundColor: c.ledger }} />;

  const title = isWorker
    ? `${company?.contactPerson ? `${company.contactPerson.split(' ')[0]} · ` : ''}${company?.companyName || ''}`
    : `${worker?.firstName || ''} ${worker?.lastName || ''}`.trim();
  const sub = presence(isWorker ? company?.lastSeen : worker?.lastSeen) || (isWorker ? 'заказчик' : 'исполнитель');

  const send = (value) => {
    const v = (value ?? text).trim();
    if (!v) return;
    sendMessage(conversationId, v);
    haptic.light();
    setText('');
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

  const phrases = isWorker ? WORKER_PHRASES : EMPLOYER_PHRASES;

  return (
    <View style={{ flex: 1, backgroundColor: c.ledger }}>
      <NavBar
        variant="fill"
        onBack={() => navigation.goBack()}
        center={(
          <Press
            feedback="none"
            onPress={() => (isWorker ? navigation.navigate('PublicCompanyProfile', { companyId: conv.companyId }) : navigation.navigate('PublicWorkerProfile', { workerId: conv.workerId }))}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginLeft: 10 }}
            accessibilityLabel={`${title}, профиль`}
          >
            {isWorker ? <Monogram name={company?.companyName} logo={company?.logo} size={36} /> : <PersonAvatar first={worker?.firstName} last={worker?.lastName} uri={worker?.avatar} size={36} />}
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="rowTitle" style={{ fontSize: 16, lineHeight: 21 }} numberOfLines={1}>{title}</T>
              <T v="caption" c="secondary" numberOfLines={1}>{sub}</T>
            </View>
          </Press>
        )}
        right={<ReportMenu targetType="user" targetId={partnerId} targetName={title} />}
      />

      {shift ? (
        <Press feedback="scale" onPress={() => navigation.navigate(isWorker ? 'ShiftDetail' : 'ShiftManage', { shiftId: shift.id })} style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 4, borderRadius: 14, backgroundColor: c.fill, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityLabel={`Смена ${shift.title}`}>
          <View style={{ flex: 1 }}>
            <T v="bodyStrong" numberOfLines={1}>{shift.title} · {dayLabel(shift.date).toLowerCase()}</T>
            <T v="caption" c="secondary" numberOfLines={1}>{timeRange(shift)} · {money(shift.pay)} BYN · {approved ? 'подтверждена' : 'отклик на рассмотрении'}</T>
          </View>
          <Icon name="chevron.right" size={13} c="tertiary" weight="semibold" />
        </Press>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={list}
          inverted
          data={rows}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
          keyboardDismissMode="interactive"
          renderItem={({ item }) => (item.day
            ? <T v="small" c="secondary" style={{ alignSelf: 'center', paddingVertical: 8 }}>{daySection(new Date(item.day))}</T>
            : <Bubble msg={item} mine={item.senderId === me.id} onImage={setPreview} />)}
          ListEmptyComponent={(
            <View style={{ transform: [{ scaleY: -1 }], paddingVertical: 40, alignItems: 'center', gap: 6 }}>
              <T v="bodyStrong">Напиши первым</T>
              <T v="caption" c="secondary" style={{ textAlign: 'center', paddingHorizontal: 30 }}>
                {isWorker ? 'Уточни детали смены — заказчик увидит сообщение сразу.' : 'Напомни, что взять и где вход.'}
              </T>
            </View>
          )}
        />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
          {phrases.map((p) => (
            <Press key={p} onPress={() => send(p)} style={{ height: 34, borderRadius: 17, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: c.fill }} accessibilityLabel={`Отправить: ${p}`}>
              <T v="body" style={{ fontSize: 14 }}>{p}</T>
            </Press>
          ))}
        </View>
        <Separator />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
          <View style={{ flex: 1, minHeight: 40, borderRadius: 20, backgroundColor: c.fill, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 6 }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Сообщение"
              placeholderTextColor={c.labelTertiary}
              multiline
              style={{ flex: 1, fontSize: 16, lineHeight: 21, color: c.label, paddingTop: 9, paddingBottom: 9, maxHeight: 120 }}
              accessibilityLabel="Сообщение"
            />
            {!text.trim() ? (
              <Press feedback="none" onPress={attach} hitSlop={8} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Прикрепить фото">
                <Icon name="camera" size={18} c="secondary" />
              </Press>
            ) : null}
          </View>
          <RoundButton icon="paperplane.fill" variant={text.trim() ? 'accent' : 'fill'} size={40} iconSize={16} onPress={() => send()} accessibilityLabel="Отправить" />
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreview(null)} accessibilityLabel="Закрыть фото">
          {preview ? <Image source={{ uri: preview }} style={{ width: '100%', height: '80%' }} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </View>
  );
}
