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
      fs.getAllWorkers(),
      fs.getAllCompanies(),
      fs.getShifts({}),
      fs.getApplications({}),
      fs.getReviews(''), // empty targetId gets all - we'll filter client-side
    ]);

    // Get all reviews by fetching for each target
    // For now, load shifts reviews
    const allReviews = reviewsData;

    set({
      workers,
      companies,
      shifts: shiftsData,
      applications: applicationsData,
      reviews: allReviews,
    });

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
 * Set up real-time listeners for live updates
 * Call on app startup after auth
 */
export function setupRealtimeListeners(set, get) {
  if (!USE_FIRESTORE) return () => {};

  const user = get().currentUser;
  if (!user) return () => {};

  const unsubscribers = [];

  // Listen to shifts changes
  unsubscribers.push(
    fs.onShiftsChange(shifts => {
      set({ shifts });
    })
  );

  // Listen to notifications
  unsubscribers.push(
    fs.onNotificationsChange(user.id, notifications => {
      set({ notifications });
    })
  );

  // Listen to conversations
  unsubscribers.push(
    fs.onConversationsChange(user.id, conversations => {
      set(s => ({
        conversations: [
          ...conversations,
          ...s.conversations.filter(c => !conversations.find(nc => nc.id === c.id)),
        ],
      }));
    })
  );

  // console.log('📡 Real-time listeners active');

  // Return cleanup function
  return () => {
    unsubscribers.forEach(unsub => unsub());
    // console.log('📡 Real-time listeners stopped');
  };
}
