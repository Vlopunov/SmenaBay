/**
 * Firestore Service — CRUD operations using @react-native-firebase/firestore.
 *
 * Collections:
 * - users (workers + employers in one collection, differentiated by role)
 * - shifts
 * - applications
 * - reviews
 * - conversations
 * - notifications
 */

import { db, firestoreNS } from './firebase';

const FieldValue = firestoreNS.FieldValue;
const serverTimestamp = () => FieldValue.serverTimestamp();
const arrayUnion = (item) => FieldValue.arrayUnion(item);
const increment = (n) => FieldValue.increment(n);

export const USE_FIRESTORE = true;

// ===== USERS =====

export async function getUser(userId) {
  const snap = await db.collection('users').doc(userId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function getUserByPhone(phone) {
  const snap = await db.collection('users').where('phone', '==', phone).limit(1).get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function createUser(userId, data) {
  await db.collection('users').doc(userId).set({
    ...data,
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  });
  return { id: userId, ...data };
}

export async function updateUser(userId, updates) {
  await db.collection('users').doc(userId).update({
    ...updates,
    lastSeen: serverTimestamp(),
  });
}

export async function getAllWorkers() {
  const snap = await db.collection('users').where('role', '==', 'worker').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllCompanies() {
  const snap = await db.collection('users').where('role', '==', 'employer').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ===== SHIFTS =====

export async function getShifts(filters = {}) {
  let q = db.collection('shifts');
  if (filters.status) q = q.where('status', '==', filters.status);
  if (filters.companyId) q = q.where('companyId', '==', filters.companyId);
  if (filters.city) q = q.where('city', '==', filters.city);
  q = q.orderBy('createdAt', 'desc');
  if (filters.limit) q = q.limit(filters.limit);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getShift(shiftId) {
  const snap = await db.collection('shifts').doc(shiftId).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function createShift(data) {
  const ref = await db.collection('shifts').add({
    ...data,
    spotsTaken: 0,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

export async function updateShift(shiftId, updates) {
  await db.collection('shifts').doc(shiftId).update(updates);
}

// ===== APPLICATIONS =====

export async function getApplications(filters = {}) {
  let q = db.collection('applications');
  if (filters.shiftId) q = q.where('shiftId', '==', filters.shiftId);
  if (filters.workerId) q = q.where('workerId', '==', filters.workerId);
  if (filters.status) q = q.where('status', '==', filters.status);

  const snap = await q.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createApplication(data) {
  const ref = await db.collection('applications').add({
    ...data,
    status: 'pending',
    appliedAt: serverTimestamp(),
    respondedAt: null,
  });
  return { id: ref.id, ...data, status: 'pending' };
}

export async function updateApplication(appId, updates) {
  await db.collection('applications').doc(appId).update({
    ...updates,
    respondedAt: serverTimestamp(),
  });
}

// ===== REVIEWS =====

export async function getReviews(targetId) {
  const snap = await db.collection('reviews')
    .where('targetId', '==', targetId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createReview(data) {
  const ref = await db.collection('reviews').add({
    ...data,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

// ===== CONVERSATIONS =====

export async function getConversations(userId) {
  const [snap1, snap2] = await Promise.all([
    db.collection('conversations').where('workerId', '==', userId).get(),
    db.collection('conversations').where('companyId', '==', userId).get(),
  ]);
  const convs = [
    ...snap1.docs.map(d => ({ id: d.id, ...d.data() })),
    ...snap2.docs.map(d => ({ id: d.id, ...d.data() })),
  ];
  return convs.sort(
    (a, b) => (b.lastMessageAt?.toMillis?.() || 0) - (a.lastMessageAt?.toMillis?.() || 0)
  );
}

export async function getOrCreateConversation(shiftId, workerId, companyId) {
  const snap = await db.collection('conversations')
    .where('shiftId', '==', shiftId)
    .where('workerId', '==', workerId)
    .where('companyId', '==', companyId)
    .limit(1)
    .get();

  if (!snap.empty) {
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }

  const ref = await db.collection('conversations').add({
    shiftId,
    workerId,
    companyId,
    messages: [],
    createdAt: serverTimestamp(),
    lastMessageAt: null,
  });
  return { id: ref.id, shiftId, workerId, companyId, messages: [] };
}

export async function sendMessage(conversationId, senderId, text, imageUri = null) {
  const msg = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
    senderId,
    text: text || '',
    createdAt: new Date().toISOString(),
    read: false,
    ...(imageUri ? { imageUri } : {}),
  };

  await db.collection('conversations').doc(conversationId).update({
    messages: arrayUnion(msg),
    lastMessageAt: serverTimestamp(),
  });
  return msg;
}

// ===== NOTIFICATIONS =====

export async function getNotifications(userId) {
  const snap = await db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createNotification(data) {
  const ref = await db.collection('notifications').add({
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, ...data };
}

export async function markNotificationRead(notifId) {
  await db.collection('notifications').doc(notifId).update({ read: true });
}

export async function markAllNotificationsRead(userId) {
  const notifs = await getNotifications(userId);
  const batch = db.batch();
  notifs.filter(n => !n.read).forEach(n => {
    batch.update(db.collection('notifications').doc(n.id), { read: true });
  });
  await batch.commit();
}

// ===== REAL-TIME LISTENERS =====

export function onShiftsChange(callback) {
  return db.collection('shifts')
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

export function onConversationsChange(userId, callback) {
  return db.collection('conversations')
    .where('workerId', '==', userId)
    .onSnapshot(snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

export function onNotificationsChange(userId, callback) {
  return db.collection('notifications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snap => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}
