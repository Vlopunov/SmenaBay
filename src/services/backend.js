/**
 * The backend, as the app sees it: one function per thing the store does.
 *
 * Mirrors the web client (smenabay-web/src/services/firestore.ts) so both
 * apps speak to the same routes with the same field names. Everything runs
 * through /api on smenabel.by — see services/api.js for why.
 *
 * There is no realtime: `bootstrap()` returns the whole slice the store
 * needs in one round-trip, and services/sync.js polls it.
 */
import { api } from './api';

// ── Bootstrap ──────────────────────────────────────────────────
/** Every collection the store needs, scoped to the caller, in one call. */
export const bootstrap = () => api('/api/data/bootstrap');

/** The feed for someone who hasn't signed in yet. No token. */
export const publicShifts = () => api('/api/public/shifts', { auth: false });

// ── Users ──────────────────────────────────────────────────────
/** The caller's profile, or null when they have never registered. */
export async function getMyProfile() {
  const res = await api('/api/user/profile');
  return res?.profile || null;
}

/** Create the caller's profile, or fill in blanks on an existing one. */
export async function createProfile(firebaseUser, extraData = {}) {
  const res = await api('/api/user/profile', {
    method: 'POST',
    body: {
      firebaseUser: {
        uid: firebaseUser?.uid,
        phoneNumber: firebaseUser?.phoneNumber || null,
        email: firebaseUser?.email || null,
        displayName: firebaseUser?.displayName || null,
        photoURL: firebaseUser?.photoURL || null,
      },
      extraData,
    },
  });
  return res?.profile || null;
}

/** The server ignores any id here and updates the caller. */
export const updateProfile = (updates) => api('/api/user/update', { method: 'PATCH', body: { updates } });

export async function findByPhone(phone) {
  try {
    const res = await api(`/api/user/by-phone?phone=${encodeURIComponent(phone)}`);
    return res?.profile || null;
  } catch (e) {
    return null;
  }
}

/** Erases the account and everything attached to it, server-side. */
export const deleteMyAccount = () => api('/api/user/delete', { method: 'DELETE' });

// ── Images ─────────────────────────────────────────────────────
/**
 * Upload a picked photo and get back a permanent URL.
 *
 * A local file:// URI only exists on the phone that picked it, so an
 * avatar or a chat photo has to be uploaded before anyone else can see it.
 * `kind` is 'avatar' | 'chat' | 'logo'.
 */
export async function uploadImage(uri, kind = 'chat') {
  const name = uri.split('/').pop() || `${kind}.jpg`;
  const form = new FormData();
  // React Native's fetch wants this shape for a file part.
  form.append('file', { uri, name, type: 'image/jpeg' });
  form.append('kind', kind);
  const res = await api('/api/upload', { method: 'POST', body: form, timeout: 60000 });
  return res?.url || null;
}

// ── Safety ─────────────────────────────────────────────────────
/** Blocks follow the person, not the phone, so they live on the server. */
export const blockUser = (userId) => api('/api/blocks', { method: 'POST', body: { userId } });
// The id also rides in the query: some HTTP stacks drop a DELETE body.
export const unblockUser = (userId) =>
  api(`/api/blocks?userId=${encodeURIComponent(userId)}`, { method: 'DELETE', body: { userId } });

/** A report someone can actually act on (Guideline 1.2). */
export const reportContent = (report) => api('/api/reports', { method: 'POST', body: report });

// ── Push ───────────────────────────────────────────────────────
export const registerPushToken = (token, platform) =>
  api('/api/push/register', { method: 'POST', body: { token, platform } });

export const unregisterPushToken = (token) =>
  api('/api/push/register', { method: 'DELETE', body: { token } });

// ── Shifts ─────────────────────────────────────────────────────
export async function createShift(data) {
  const res = await api('/api/shifts', { method: 'POST', body: { data } });
  return res?.shift || null;
}

export const updateShift = (shiftId, updates) =>
  api(`/api/shifts/${encodeURIComponent(shiftId)}`, { method: 'PATCH', body: { updates } });

// ── Applications ───────────────────────────────────────────────
export async function createApplication(shiftId) {
  const res = await api('/api/applications', { method: 'POST', body: { data: { shiftId } } });
  return res?.application || null;
}

export const updateApplication = (appId, updates) =>
  api(`/api/applications/${encodeURIComponent(appId)}`, { method: 'PATCH', body: { updates } });

/**
 * Approve in one server-side transaction: the seat count and the
 * application move together, so two employers tapping at once can't
 * oversell a shift. → { filled, newSpotsTaken }
 */
export const approveApplication = (appId, shiftId) =>
  api(`/api/applications/${encodeURIComponent(appId)}/approve`, { method: 'POST', body: { shiftId } });

// ── Reviews ────────────────────────────────────────────────────
export async function createReview(data) {
  const res = await api('/api/reviews', { method: 'POST', body: { data } });
  return res?.review || null;
}

// ── Chat ───────────────────────────────────────────────────────
export async function getOrCreateConversation(shiftId, workerId, companyId) {
  const res = await api('/api/messages', {
    method: 'POST',
    body: { action: 'getOrCreate', shiftId, workerId, companyId },
  });
  return res?.conversation || null;
}

export async function sendMessage(conversationId, text, imageUri = null, system = false) {
  const res = await api('/api/messages', {
    method: 'POST',
    body: { conversationId, text, imageUri, system },
  });
  return res?.message || null;
}

export const markConversationRead = (conversationId) =>
  api('/api/messages', { method: 'PATCH', body: { conversationId, action: 'markRead' } });

// ── Notifications ──────────────────────────────────────────────
export async function createNotification(data) {
  const res = await api('/api/notifications', { method: 'POST', body: { data } });
  return res?.notification || null;
}

export const markNotificationRead = (notifId) =>
  api(`/api/notifications/${encodeURIComponent(notifId)}`, { method: 'PATCH', body: { read: true } });

export const markAllNotificationsRead = () =>
  api('/api/notifications', { method: 'PATCH', body: { action: 'markAllRead' } });
