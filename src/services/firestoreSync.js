/**
 * Firestore Sync Layer
 *
 * Bridges the existing Zustand store with Firestore.
 * - On app start: loads data from Firestore into Zustand arrays
 * - On mutations: writes changes to Firestore in background
 *
 * Toggle: USE_FIRESTORE in firestore.js
 * When false: app uses mock data as before (no Firestore calls)
 * When true: app loads from and writes to Firestore
 */

import { USE_FIRESTORE } from './firestore';
import * as fs from './firestore';

/**
 * Load all data from Firestore into Zustand store
 * Call this on app startup when USE_FIRESTORE is true
 */
export async function loadFromFirestore(set, get) {
  if (!USE_FIRESTORE) return;

  try {
    // console.log('📡 Loading data from Firestore...');

    const [workers, companies, shiftsData, applicationsData, reviewsData] = await Promise.all([
      fs.getAllWorkers().catch(() => []),
      fs.getAllCompanies().catch(() => []),
      fs.getShifts({}).catch(() => []),
      fs.getApplications({}).catch(() => []),
      fs.getReviews('').catch(() => []),
    ]);

    // Merge with existing state instead of replacing — preserves local-only
    // users (e.g. just-registered) if their Firestore doc hasn't been
    // committed yet, and avoids wiping the in-memory store on a failed read.
    const merge = (local, remote) => {
      const map = new Map();
      local.forEach(u => map.set(u.id, u));
      remote.forEach(u => map.set(u.id, { ...map.get(u.id), ...u }));
      return Array.from(map.values());
    };

    set(state => ({
      workers: merge(state.workers, workers),
      companies: merge(state.companies, companies),
      shifts: shiftsData.length ? shiftsData : state.shifts,
      applications: applicationsData.length ? applicationsData : state.applications,
      reviews: reviewsData.length ? reviewsData : state.reviews,
    }));

    // Load notifications for current user
    const user = get().currentUser;
    if (user) {
      const notifications = await fs.getNotifications(user.id);
      const conversations = await fs.getConversations(user.id);
      set({ notifications, conversations });
    }

    // console.log('✅ Data loaded from Firestore');
    // console.log(`   Workers: ${workers.length}, Companies: ${companies.length}, Shifts: ${shiftsData.length}`);
  } catch (error) {
    // console.error('❌ Failed to load from Firestore:', error);
  }
}

/**
 * Sync wrappers — call these after Zustand mutations to persist to Firestore
 */

export async function syncCreateShift(shift) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.createShift(shift);
  } catch (e) { /* silent */ }
}

export async function syncUpdateShift(shiftId, updates) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.updateShift(shiftId, updates);
  } catch (e) { /* silent */ }
}

export async function syncCreateApplication(app) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.createApplication(app);
  } catch (e) { /* silent */ }
}

export async function syncUpdateApplication(appId, updates) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.updateApplication(appId, updates);
  } catch (e) { /* silent */ }
}

export async function syncCreateReview(review) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.createReview(review);
  } catch (e) { /* silent */ }
}

export async function syncCreateUser(userId, data) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.createUser(userId, data);
  } catch (e) { console.warn('[syncCreateUser]', e?.message); }
}

export async function syncUpdateUser(userId, updates) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.updateUser(userId, updates);
  } catch (e) { /* silent */ }
}

export async function syncCreateNotification(data) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.createNotification(data);
  } catch (e) { /* silent */ }
}

export async function syncSendMessage(conversationId, senderId, text, imageUri) {
  if (!USE_FIRESTORE) return;
  try {
    await fs.sendMessage(conversationId, senderId, text, imageUri);
  } catch (e) { /* silent */ }
}

/**
 * Real-time listeners DISABLED.
 *
 * Under React Native new architecture (Fabric + Bridgeless), RN Firebase
 * Firestore .onSnapshot() listeners are unstable on Android — known issue
 * causing native crashes under load. We use one-shot reads in
 * loadFromFirestore() instead. Live updates can be re-enabled once RN
 * Firebase fully supports new arch (tracked in their repo).
 *
 * This is a no-op so callers can keep the same shape.
 */
export function setupRealtimeListeners(_set, _get) {
  return () => {};
}
