import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, Image, ScrollView,
  Modal, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { COLORS, SIZES, SHADOWS, FONTS } from '../../constants/theme';
import useStore from '../../store/useStore';
import OnlineDot, { formatLastSeen } from '../../components/OnlineDot';
import Avatar from '../../components/Avatar';
import ReportMenu from '../../components/ReportMenu';

const WORKER_QUICK = [
  { text: 'Буду вовремя', icon: 'checkmark-circle-outline' },
  { text: 'Опаздываю', icon: 'time-outline' },
  { text: 'Я на месте', icon: 'location-outline' },
  { text: 'Где вход?', icon: 'help-circle-outline' },
  { text: 'Понял, спасибо!', icon: 'thumbs-up-outline' },
];

const EMPLOYER_QUICK = [
  { text: 'Ждём вас!', icon: 'hand-right-outline' },
  { text: 'Возьмите паспорт', icon: 'document-outline' },
  { text: 'Хорошо', icon: 'checkmark-outline' },
  { text: 'Перезвоните, пожалуйста', icon: 'call-outline' },
];

const { width: SCREEN_W } = Dimensions.get('window');

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;
  const insets = useSafeAreaInsets();

  const currentUser = useStore(s => s.currentUser);
  const conversations = useStore(s => s.conversations);
  const workers = useStore(s => s.workers);
  const companies = useStore(s => s.companies);
  const shifts = useStore(s => s.shifts);
  const sendMessage = useStore(s => s.sendMessage);
  const markConversationRead = useStore(s => s.markConversationRead);
  const getLocationById = useStore(s => s.getLocationById);

  const conv = conversations.find(c => c.id === conversationId);
  const isWorker = currentUser?.role === 'worker';
  const partner = isWorker
    ? companies.find(c => c.id === conv?.companyId)
    : workers.find(w => w.id === conv?.workerId);
  const shift = shifts.find(s => s.id === conv?.shiftId);
  const location = shift ? getLocationById(shift.locationId) : null;

  const [text, setText] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const [showShiftCard, setShowShiftCard] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (conv) markConversationRead(conversationId);
  }, [conv?.messages?.length]);

  if (!conv) return null;

  const partnerId = isWorker ? conv?.companyId : conv?.workerId;
  const partnerName = isWorker
    ? partner?.companyName
    : `${partner?.firstName || ''} ${partner?.lastName || ''}`;
  const partnerAvatar = isWorker ? partner?.logo : partner?.avatar;

  const messages = [...conv.messages].reverse();
  const quickReplies = isWorker ? WORKER_QUICK : EMPLOYER_QUICK;

  const handleSend = (msgText) => {
    const t = msgText || text;
    if (!t.trim()) return;
    sendMessage(conversationId, t);
    setText('');
    setShowQuick(false);
  };

  const pickImage = async (fromCamera) => {
    try {
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Нет доступа', 'Разрешите доступ к камере в настройках');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Нет доступа', 'Разрешите доступ к фото в настройках');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
      }

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      // Compress: resize to max 800px width, JPEG 60% quality
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width || 800, 800) } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
      );

      sendMessage(conversationId, '', manipulated.uri);
    } catch (e) {
      // silently fail
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Сегодня';
    const d = new Date(dateStr);
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  };

  const renderMessage = ({ item: msg }) => {
    if (msg.isSystem) {
      return (
        <View style={styles.systemMsgRow}>
          <View style={styles.systemBubble}>
            <Ionicons name="information-circle" size={14} color={COLORS.accent} />
            <Text style={styles.systemText}>{msg.text}</Text>
          </View>
        </View>
      );
    }

    const isMine = msg.senderId === currentUser?.id;
    const hasImage = !!msg.imageUri;

    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, hasImage && styles.bubbleImage]}>
          {hasImage && (
            <TouchableOpacity onPress={() => setPreviewImage(msg.imageUri)} activeOpacity={0.9}>
              <Image source={{ uri: msg.imageUri }} style={styles.msgImage} />
            </TouchableOpacity>
          )}
          {msg.text ? (
            <Text style={[styles.msgText, isMine && styles.msgTextMine, hasImage && { marginTop: 6 }]}>{msg.text}</Text>
          ) : null}
          <View style={styles.msgMeta}>
            <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>{formatTime(msg.createdAt)}</Text>
            {isMine && (
              <Ionicons
                name={msg.read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={msg.read ? '#60A5FA' : 'rgba(255,255,255,0.5)'}
                style={{ marginLeft: 3 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
          <Avatar uri={partnerAvatar} name={partnerName} size={36} />
          <OnlineDot lastSeen={partner?.lastSeen} size={12} />
        </View>
        <TouchableOpacity
          style={styles.navInfo}
          onPress={() => {
            if (isWorker && conv.companyId) navigation.navigate('PublicCompanyProfile', { companyId: conv.companyId });
            else if (!isWorker && conv.workerId) navigation.navigate('PublicWorkerProfile', { workerId: conv.workerId });
          }}
        >
          <Text style={styles.navName} numberOfLines={1}>{partnerName}</Text>
          <Text style={styles.navShift} numberOfLines={1}>
            {formatLastSeen(partner?.lastSeen) || shift?.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.infoBtn} onPress={() => setShowShiftCard(!showShiftCard)}>
          <Ionicons name={showShiftCard ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textTertiary} />
        </TouchableOpacity>
        <ReportMenu
          targetType="user"
          targetId={partnerId}
          targetName={partnerName}
          style={styles.infoBtn}
        />
      </View>

      {/* Shift card */}
      {showShiftCard && shift && (
        <TouchableOpacity
          style={styles.shiftCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ShiftDetail', { shiftId: shift.id })}
        >
          <View style={styles.shiftCardRow}>
            <Ionicons name="calendar-outline" size={15} color={COLORS.accent} />
            <Text style={styles.shiftCardText}>{formatDate(shift.date)}, {shift.timeStart}–{shift.timeEnd}</Text>
          </View>
          <View style={styles.shiftCardRow}>
            <Ionicons name="location-outline" size={15} color={COLORS.accent} />
            <Text style={styles.shiftCardText} numberOfLines={1}>{location?.address || '—'}</Text>
          </View>
          <View style={styles.shiftCardRow}>
            <Ionicons name="cash-outline" size={15} color={COLORS.success} />
            <Text style={[styles.shiftCardText, { color: COLORS.success, ...FONTS.semibold }]}>{shift.pay} BYN</Text>
          </View>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          inverted
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Начните общение</Text>
            </View>
          }
        />

        {/* Quick replies */}
        {showQuick && (
          <View style={styles.quickPanel}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickScroll}>
              {quickReplies.map((qr, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.quickChip}
                  onPress={() => handleSend(qr.text)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={qr.icon} size={14} color={COLORS.accent} />
                  <Text style={styles.quickText}>{qr.text}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + SIZES.sm }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowQuick(!showQuick)}>
            <Ionicons name={showQuick ? 'close-circle' : 'flash'} size={22} color={showQuick ? COLORS.textTertiary : COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              Alert.alert('Отправить фото', '', [
                { text: 'Камера', onPress: () => pickImage(true) },
                { text: 'Галерея', onPress: () => pickImage(false) },
                { text: 'Отмена', style: 'cancel' },
              ]);
            }}
          >
            <Ionicons name="camera-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Сообщение..."
            placeholderTextColor={COLORS.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!text.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image preview modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={[styles.previewClose, { top: insets.top + 10 }]} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          {previewImage && (
            <Image source={{ uri: previewImage }} style={styles.previewImg} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F0F5' },

  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SIZES.sm, paddingVertical: SIZES.sm,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  navAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.skeleton },
  navInfo: { flex: 1, marginLeft: SIZES.sm },
  navName: { fontSize: SIZES.bodyLarge, ...FONTS.semibold, color: COLORS.textPrimary },
  navShift: { fontSize: SIZES.caption, color: COLORS.accent },
  infoBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  shiftCard: {
    backgroundColor: COLORS.white, marginHorizontal: SIZES.md, marginTop: SIZES.sm,
    borderRadius: SIZES.radiusMd, padding: SIZES.md, gap: 6, ...SHADOWS.sm,
  },
  shiftCardRow: { flexDirection: 'row', alignItems: 'center', gap: SIZES.sm },
  shiftCardText: { fontSize: SIZES.small, color: COLORS.textPrimary, flex: 1 },

  messagesList: { paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm },

  systemMsgRow: { alignItems: 'center', marginVertical: SIZES.sm },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accentSoft, paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull, maxWidth: '90%',
  },
  systemText: { fontSize: SIZES.caption, color: COLORS.accent, ...FONTS.medium, flexShrink: 1 },

  msgRow: { marginBottom: SIZES.sm, flexDirection: 'row', justifyContent: 'flex-start' },
  msgRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm, borderRadius: 16 },
  bubbleTheirs: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, ...SHADOWS.sm },
  bubbleMine: { backgroundColor: COLORS.accent, borderBottomRightRadius: 4 },
  bubbleImage: { paddingHorizontal: 4, paddingTop: 4 },

  msgImage: { width: SCREEN_W * 0.55, height: SCREEN_W * 0.4, borderRadius: 12, backgroundColor: COLORS.skeleton },

  msgText: { fontSize: SIZES.body, color: COLORS.textPrimary, lineHeight: 21 },
  msgTextMine: { color: COLORS.white },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  msgTime: { fontSize: 10, color: COLORS.textTertiary },
  msgTimeMine: { color: 'rgba(255,255,255,0.6)' },

  emptyChat: { alignItems: 'center', paddingVertical: SIZES['3xl'], transform: [{ scaleY: -1 }] },
  emptyChatText: { fontSize: SIZES.small, color: COLORS.textTertiary },

  quickPanel: { backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingVertical: SIZES.sm },
  quickScroll: { paddingHorizontal: SIZES.md, gap: SIZES.sm },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusFull, backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  quickText: { fontSize: SIZES.small, ...FONTS.medium, color: COLORS.accent },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: SIZES.xs, paddingTop: SIZES.sm,
    backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.borderLight,
    gap: 2,
  },
  iconBtn: { width: 36, height: 40, justifyContent: 'center', alignItems: 'center' },
  textInput: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: COLORS.surface, borderRadius: 20,
    paddingHorizontal: SIZES.md, paddingVertical: SIZES.sm,
    fontSize: SIZES.body, color: COLORS.textPrimary,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.accent, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },

  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  previewClose: { position: 'absolute', right: 16, zIndex: 10, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  previewImg: { width: '100%', height: '80%' },
});
