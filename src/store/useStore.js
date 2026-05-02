import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOCK_WORKERS, MOCK_COMPANIES, MOCK_SHIFTS, MOCK_APPLICATIONS,
  MOCK_REVIEWS, MOCK_NOTIFICATIONS,
} from '../data/mockData';
import {
  syncCreateShift, syncUpdateShift, syncCreateApplication, syncUpdateApplication,
  syncCreateReview, syncUpdateUser, syncCreateNotification, syncSendMessage,
  loadFromFirestore, setupRealtimeListeners,
} from '../services/firestoreSync';

const useStore = create(
  persist(
    (set, get) => ({
  // ===== AUTH =====
  currentUser: null,   // worker or company object
  isAuthenticated: false,

  // Initialize from Firestore (call on app startup)
  initializeFromFirestore: async () => {
    await loadFromFirestore(set, get);
    return setupRealtimeListeners(set, get);
  },

  // Update current user's lastSeen timestamp
  updateLastSeen: () => {
    const user = get().currentUser;
    if (!user) return;
    const now = new Date().toISOString();
    if (user.role === 'worker') {
      set(s => ({
        currentUser: { ...s.currentUser, lastSeen: now },
        workers: s.workers.map(w => w.id === user.id ? { ...w, lastSeen: now } : w),
      }));
    } else {
      set(s => ({
        currentUser: { ...s.currentUser, lastSeen: now },
        companies: s.companies.map(c => c.id === user.id ? { ...c, lastSeen: now } : c),
      }));
    }
  },

  login: (phone) => {
    const now = new Date().toISOString();
    const worker = get().workers.find(w => w.phone === phone);
    if (worker) {
      const updated = { ...worker, lastSeen: now };
      set(s => ({
        currentUser: updated,
        isAuthenticated: true,
        workers: s.workers.map(w => w.id === worker.id ? updated : w),
      }));
      return updated;
    }
    const company = get().companies.find(c => c.phone === phone);
    if (company) {
      const updated = { ...company, lastSeen: now };
      set(s => ({
        currentUser: updated,
        isAuthenticated: true,
        companies: s.companies.map(c => c.id === company.id ? updated : c),
      }));
      return updated;
    }
    return null;
  },

  registerWorker: (data) => {
    const newWorker = {
      id: 'w_' + Date.now(),
      role: 'worker',
      rating: 0,
      shiftsCompleted: 0,
      badges: ['newbie'],
      documents: { passport: false, medicalBook: false },
      verified: false,
      phoneVerified: false,
      phoneVisible: true,
      registeredAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    set(s => ({
      workers: [...s.workers, newWorker],
      currentUser: newWorker,
      isAuthenticated: true,
    }));
    return newWorker;
  },

  registerEmployer: (data) => {
    const newCompany = {
      id: 'c_' + Date.now(),
      role: 'employer',
      rating: 0,
      reviewsCount: 0,
      totalShiftsPublished: 0,
      plan: 'free',
      planExpiresAt: null,
      locations: [],
      phoneVerified: false,
      phoneVisible: true,
      registeredAt: new Date().toISOString().split('T')[0],
      ...data,
    };
    set(s => ({
      companies: [...s.companies, newCompany],
      currentUser: newCompany,
      isAuthenticated: true,
    }));
    return newCompany;
  },

  logout: () => set({ currentUser: null, isAuthenticated: false }),
  // Note: favorites are not cleared on logout — they persist per-user

  updateProfile: (updates) => {
    const user = get().currentUser;
    const updated = { ...user, ...updates };
    if (user.role === 'worker') {
      set(s => ({
        currentUser: updated,
        workers: s.workers.map(w => w.id === user.id ? updated : w),
      }));
    } else {
      set(s => ({
        currentUser: updated,
        companies: s.companies.map(c => c.id === user.id ? updated : c),
      }));
    }
    syncUpdateUser(user.id, updates);
  },

  // ===== DATA =====
  workers: [...MOCK_WORKERS],
  companies: [...MOCK_COMPANIES],
  shifts: [...MOCK_SHIFTS],
  applications: [...MOCK_APPLICATIONS],
  reviews: [...MOCK_REVIEWS],
  notifications: [...MOCK_NOTIFICATIONS],

  // ===== SHIFTS =====
  getActiveShifts: (city) => {
    return get().shifts
      .filter(s => s.status === 'active')
      .filter(s => {
        if (!city) return true;
        const company = get().companies.find(c => c.id === s.companyId);
        return company?.city === city;
      })
      .sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        return new Date(a.date) - new Date(b.date);
      });
  },

  getShiftById: (id) => get().shifts.find(s => s.id === id),

  getCompanyById: (id) => get().companies.find(c => c.id === id),

  getWorkerById: (id) => get().workers.find(w => w.id === id),

  getLocationById: (id) => {
    for (const c of get().companies) {
      const loc = c.locations.find(l => l.id === id);
      if (loc) return loc;
    }
    return null;
  },

  createShift: (data) => {
    const user = get().currentUser;
    if (user && !user.phoneVerified) return { error: 'phone_not_verified' };
    // Check plan limits
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthShifts = get().shifts.filter(
      s => s.companyId === user.id && s.createdAt >= monthStart && s.status !== 'cancelled'
    ).length;
    const limits = { free: 3, business: 30, premium: Infinity };
    if (monthShifts >= (limits[user.plan] || 3)) {
      return { error: 'limit' };
    }

    const dates = Array.isArray(data.date) ? data.date : [data.date];
    const newShifts = dates.map(date => ({
      id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      companyId: user.id,
      status: 'active',
      spotsTaken: 0,
      createdAt: new Date().toISOString().split('T')[0],
      ...data,
      date,
      durationHours: calcDuration(data.timeStart, data.timeEnd),
      payPerHour: +(data.pay / calcDuration(data.timeStart, data.timeEnd)).toFixed(2),
    }));

    set(s => ({
      shifts: [...s.shifts, ...newShifts],
      companies: s.companies.map(c =>
        c.id === user.id
          ? { ...c, totalShiftsPublished: c.totalShiftsPublished + newShifts.length }
          : c
      ),
      currentUser: {
        ...s.currentUser,
        totalShiftsPublished: s.currentUser.totalShiftsPublished + newShifts.length,
      },
    }));
    return { success: true, shifts: newShifts };
  },

  cancelShift: (shiftId) => {
    // Capture affected workers (pending/approved) before updating statuses
    const affectedApps = get().applications.filter(
      a => a.shiftId === shiftId && (a.status === 'pending' || a.status === 'approved')
    );
    const affectedWorkerIds = affectedApps.map(a => a.workerId);
    const shift = get().getShiftById(shiftId);

    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, status: 'cancelled' } : sh
      ),
      applications: s.applications.map(a =>
        a.shiftId === shiftId && (a.status === 'pending' || a.status === 'approved')
          ? { ...a, status: 'rejected', respondedAt: new Date().toISOString().split('T')[0] }
          : a
      ),
    }));

    // Notify only affected workers
    affectedWorkerIds.forEach(workerId => {
      get().addNotification(workerId, 'shift_cancelled',
        'Смена отменена', `Смена «${shift?.title}» отменена заказчиком`, shiftId);
    });
  },

  completeShift: (shiftId) => {
    const shift = get().getShiftById(shiftId);
    const approvedApps = get().applications.filter(
      a => a.shiftId === shiftId && a.status === 'approved'
    );
    const approvedWorkerIds = approvedApps.map(a => a.workerId);

    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, status: 'completed' } : sh
      ),
      workers: s.workers.map(w =>
        approvedWorkerIds.includes(w.id)
          ? { ...w, shiftsCompleted: w.shiftsCompleted + 1 }
          : w
      ),
    }));
  },

  duplicateShift: (shiftId) => {
    const shift = get().getShiftById(shiftId);
    if (!shift) return null;
    const { id, date, status, spotsTaken, createdAt, ...rest } = shift;
    return rest; // Return template for create form
  },

  editShift: (shiftId, updates) => {
    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, ...updates } : sh
      ),
    }));
  },

  // ===== APPLICATIONS =====
  applyToShift: (shiftId) => {
    const user = get().currentUser;
    if (user && !user.phoneVerified) return { error: 'phone_not_verified' };

    const shiftCheck = get().getShiftById(shiftId);
    if (shiftCheck && shiftCheck.status !== 'active') return { error: 'shift_not_active' };
    if (shiftCheck && shiftCheck.spotsTaken >= shiftCheck.spotsTotal) return { error: 'shift_full' };

    const existing = get().applications.find(
      a => a.shiftId === shiftId && a.workerId === user.id && a.status !== 'cancelled_by_worker'
    );
    if (existing) return { error: 'already_applied' };

    const app = {
      id: 'a_' + Date.now(),
      shiftId,
      workerId: user.id,
      status: 'pending',
      appliedAt: new Date().toISOString().split('T')[0],
      respondedAt: null,
    };
    set(s => ({ applications: [...s.applications, app] }));

    // Notify employer
    const shift = get().getShiftById(shiftId);
    if (shift) {
      get().addNotification(shift.companyId, 'new_application',
        'Новый отклик', `Новый отклик на «${shift.title}» от ${user.firstName} ${user.lastName[0]}.`,
        shiftId);
    }
    return { success: true };
  },

  cancelApplication: (appId) => {
    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'cancelled_by_worker' } : a
      ),
    }));
  },

  approveApplication: (appId) => {
    const app = get().applications.find(a => a.id === appId);
    if (!app) return;

    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'approved', respondedAt: new Date().toISOString().split('T')[0] } : a
      ),
      shifts: s.shifts.map(sh =>
        sh.id === app.shiftId ? { ...sh, spotsTaken: sh.spotsTaken + 1 } : sh
      ),
    }));

    // Notify worker
    const shift = get().getShiftById(app.shiftId);
    get().addNotification(app.workerId, 'application_approved',
      'Отклик подтверждён', `Ваш отклик на «${shift?.title}» подтверждён!`, app.shiftId);

    // Auto-create chat conversation with system message
    if (shift) {
      const conv = get().getOrCreateConversation(app.shiftId, app.workerId, shift.companyId);
      get().sendSystemMessage(conv.id, `Заявка подтверждена! Смена «${shift.title}» — ${shift.date}, ${shift.timeStart}–${shift.timeEnd}`);
    }

    // Check if shift is now filled
    const updatedShift = get().getShiftById(app.shiftId);
    if (updatedShift && updatedShift.spotsTaken >= updatedShift.spotsTotal) {
      // Capture pending applications before rejecting them
      const pendingApps = get().applications.filter(
        a => a.shiftId === app.shiftId && a.status === 'pending'
      );

      set(s => ({
        shifts: s.shifts.map(sh =>
          sh.id === app.shiftId ? { ...sh, status: 'filled' } : sh
        ),
        applications: s.applications.map(a =>
          a.shiftId === app.shiftId && a.status === 'pending'
            ? { ...a, status: 'rejected', respondedAt: new Date().toISOString().split('T')[0] }
            : a
        ),
      }));

      // Notify each auto-rejected worker
      pendingApps.forEach(a => {
        get().addNotification(a.workerId, 'application_rejected',
          'Отклик отклонён', `Смена "${updatedShift.title}" уже заполнена`, app.shiftId);
      });
    }
  },

  rejectApplication: (appId) => {
    const app = get().applications.find(a => a.id === appId);
    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'rejected', respondedAt: new Date().toISOString().split('T')[0] } : a
      ),
    }));
    if (app) {
      const shift = get().getShiftById(app.shiftId);
      get().addNotification(app.workerId, 'application_rejected',
        'Отклик отклонён', `К сожалению, ваш отклик на «${shift?.title}» отклонён`, app.shiftId);
    }
  },

  getApplicationsForShift: (shiftId) =>
    get().applications.filter(a => a.shiftId === shiftId),

  getApplicationsForWorker: (workerId) =>
    get().applications.filter(a => a.workerId === (workerId || get().currentUser?.id)),

  getApplicationForShiftAndWorker: (shiftId, workerId) =>
    get().applications.find(
      a => a.shiftId === shiftId && a.workerId === (workerId || get().currentUser?.id)
        && a.status !== 'cancelled_by_worker'
    ),

  // ===== REVIEWS =====
  getReviewsFor: (targetId) =>
    get().reviews.filter(r => r.targetId === targetId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  getReviewForShift: (shiftId, authorId, targetId) =>
    get().reviews.find(r =>
      r.shiftId === shiftId && r.authorId === authorId && (targetId ? r.targetId === targetId : true)
    ),

  addReview: (review) => {
    // Duplicate prevention
    const duplicate = get().reviews.find(
      r => r.shiftId === review.shiftId && r.authorId === review.authorId && r.targetId === review.targetId
    );
    if (duplicate) return;

    const newReview = {
      id: 'r_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      ...review,
    };
    set(s => ({ reviews: [...s.reviews, newReview] }));
    syncCreateReview(newReview);

    // Update target rating
    const allReviews = get().getReviewsFor(review.targetId);
    if (allReviews.length === 0) return;
    const avg = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;
    const rounded = +avg.toFixed(1);

    if (review.type === 'worker_about_company') {
      set(s => ({
        companies: s.companies.map(c =>
          c.id === review.targetId
            ? { ...c, rating: rounded, reviewsCount: allReviews.length }
            : c
        ),
        currentUser: s.currentUser?.id === review.targetId
          ? { ...s.currentUser, rating: rounded, reviewsCount: allReviews.length }
          : s.currentUser,
      }));
    } else {
      set(s => ({
        workers: s.workers.map(w =>
          w.id === review.targetId ? { ...w, rating: rounded } : w
        ),
        currentUser: s.currentUser?.id === review.targetId
          ? { ...s.currentUser, rating: rounded }
          : s.currentUser,
      }));
    }

    // Notify target
    get().addNotification(review.targetId, 'review_received',
      'Новый отзыв', `Новый отзыв: ★${review.overallRating}`, review.shiftId);
  },

  // ===== NOTIFICATIONS =====
  getNotificationsForUser: (userId) =>
    get().notifications
      .filter(n => n.userId === (userId || get().currentUser?.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  getUnreadCount: () =>
    get().notifications.filter(n => n.userId === get().currentUser?.id && !n.read).length,

  markNotificationRead: (notifId) => {
    set(s => ({
      notifications: s.notifications.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      ),
    }));
  },

  markAllRead: () => {
    const userId = get().currentUser?.id;
    set(s => ({
      notifications: s.notifications.map(n =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
  },

  addNotification: (userId, type, title, body, relatedShiftId = null) => {
    const notif = {
      id: 'n_' + Date.now() + Math.random().toString(36).slice(2, 4),
      userId,
      type,
      title,
      body,
      relatedShiftId,
      read: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set(s => ({ notifications: [...s.notifications, notif] }));
    syncCreateNotification(notif);
  },

  // ===== LOCATIONS =====
  addLocation: (location) => {
    const user = get().currentUser;
    const newLoc = {
      id: 'loc_' + Date.now(),
      companyId: user.id,
      ...location,
    };
    set(s => ({
      companies: s.companies.map(c =>
        c.id === user.id ? { ...c, locations: [...c.locations, newLoc] } : c
      ),
      currentUser: {
        ...s.currentUser,
        locations: [...s.currentUser.locations, newLoc],
      },
    }));
    return newLoc;
  },

  deleteLocation: (locId) => {
    const activeShifts = get().shifts.filter(
      s => s.locationId === locId && ['active', 'filled', 'in_progress'].includes(s.status)
    );
    if (activeShifts.length > 0) return { error: 'has_active_shifts' };

    const user = get().currentUser;
    set(s => ({
      companies: s.companies.map(c =>
        c.id === user.id ? { ...c, locations: c.locations.filter(l => l.id !== locId) } : c
      ),
      currentUser: {
        ...s.currentUser,
        locations: s.currentUser.locations.filter(l => l.id !== locId),
      },
    }));
    return { success: true };
  },

  // ===== FAVORITES =====
  favorites: {},
  toggleFavorite: (workerId) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const userFavs = s.favorites[userId] || [];
      return {
        favorites: {
          ...s.favorites,
          [userId]: userFavs.includes(workerId)
            ? userFavs.filter(id => id !== workerId)
            : [...userFavs, workerId],
        },
      };
    });
  },
  isFavorite: (workerId) => {
    const userId = get().currentUser?.id;
    return userId ? (get().favorites[userId] || []).includes(workerId) : false;
  },

  // ===== SAVED SHIFTS (worker bookmarks) =====
  savedShifts: {},
  toggleSavedShift: (shiftId) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    set(s => {
      const saved = s.savedShifts[userId] || [];
      return {
        savedShifts: {
          ...s.savedShifts,
          [userId]: saved.includes(shiftId)
            ? saved.filter(id => id !== shiftId)
            : [...saved, shiftId],
        },
      };
    });
  },
  isSavedShift: (shiftId) => {
    const userId = get().currentUser?.id;
    return userId ? (get().savedShifts[userId] || []).includes(shiftId) : false;
  },

  // ===== INVITATIONS (employer → worker) =====
  invitations: [],
  inviteWorkerToShift: (workerId, shiftId) => {
    const existing = get().invitations.find(
      inv => inv.workerId === workerId && inv.shiftId === shiftId
    );
    if (existing) return { error: 'already_invited' };

    const inv = {
      id: 'inv_' + Date.now(),
      workerId,
      shiftId,
      employerId: get().currentUser?.id,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set(s => ({ invitations: [...s.invitations, inv] }));

    const shift = get().getShiftById(shiftId);
    const company = get().currentUser;
    get().addNotification(workerId, 'shift_invite',
      'Приглашение на смену',
      `${company?.companyName} приглашает вас на смену «${shift?.title}»`,
      shiftId);
    return { success: true };
  },

  // ===== CONVERSATIONS (chat) =====
  conversations: (() => {
    // Seed conversations from approved applications
    const convs = [];
    const approvedApps = MOCK_APPLICATIONS.filter(a => a.status === 'approved');
    const seen = new Set();
    approvedApps.forEach(a => {
      const shift = MOCK_SHIFTS.find(s => s.id === a.shiftId);
      if (!shift) return;
      const key = `${a.shiftId}_${a.workerId}_${shift.companyId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const worker = MOCK_WORKERS.find(w => w.id === a.workerId);
      const company = MOCK_COMPANIES.find(c => c.id === shift.companyId);
      const msgs = [];
      // System message
      msgs.push({
        id: 'msg_seed_' + convs.length + '_0',
        senderId: 'system',
        text: `Заявка подтверждена! Смена «${shift.title}» — ${shift.date}, ${shift.timeStart}–${shift.timeEnd}`,
        createdAt: new Date(Date.now() - (convs.length + 1) * 3600000 - 60000).toISOString(),
        read: true,
        isSystem: true,
      });
      // Welcome message from company
      msgs.push({
        id: 'msg_seed_' + convs.length + '_1',
        senderId: shift.companyId,
        text: `Здравствуйте, ${worker?.firstName}! Ждём вас на смену. Вход с торца здания.`,
        createdAt: new Date(Date.now() - (convs.length + 1) * 3600000).toISOString(),
        read: true,
      });
      // Some conversations have replies
      if (convs.length < 3) {
        msgs.push({
          id: 'msg_seed_' + convs.length + '_2',
          senderId: a.workerId,
          text: 'Спасибо! Буду вовремя 👍',
          createdAt: new Date(Date.now() - convs.length * 3600000).toISOString(),
          read: true,
        });
      }
      convs.push({
        id: 'conv_seed_' + convs.length,
        shiftId: a.shiftId,
        workerId: a.workerId,
        companyId: shift.companyId,
        messages: msgs,
        createdAt: new Date(Date.now() - (convs.length + 2) * 3600000).toISOString(),
        lastMessageAt: msgs[msgs.length - 1].createdAt,
      });
    });
    return convs;
  })(),

  getConversationsForUser: () => {
    const userId = get().currentUser?.id;
    if (!userId) return [];
    return get().conversations
      .filter(c => c.workerId === userId || c.companyId === userId)
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  },

  getOrCreateConversation: (shiftId, workerId, companyId) => {
    const existing = get().conversations.find(
      c => c.shiftId === shiftId && c.workerId === workerId && c.companyId === companyId
    );
    if (existing) return existing;

    const conv = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      shiftId,
      workerId,
      companyId,
      messages: [],
      createdAt: new Date().toISOString(),
      lastMessageAt: null,
    };
    set(s => ({ conversations: [...s.conversations, conv] }));
    return conv;
  },

  sendMessage: (conversationId, text, imageUri) => {
    const userId = get().currentUser?.id;
    if (!userId || (!text?.trim() && !imageUri)) return;

    const msg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      senderId: userId,
      text: text?.trim() || '',
      createdAt: new Date().toISOString(),
      read: false,
      ...(imageUri ? { imageUri } : {}),
    };

    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], lastMessageAt: msg.createdAt }
          : c
      ),
    }));
    syncSendMessage(conversationId, userId, text?.trim() || '', imageUri);
    return msg;
  },

  sendSystemMessage: (conversationId, text) => {
    const msg = {
      id: 'msg_sys_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
      senderId: 'system',
      text,
      createdAt: new Date().toISOString(),
      read: false,
      isSystem: true,
    };
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, msg], lastMessageAt: msg.createdAt }
          : c
      ),
    }));
  },

  getUnreadChatCount: () => {
    const userId = get().currentUser?.id;
    if (!userId) return 0;
    return get().conversations
      .filter(c => c.workerId === userId || c.companyId === userId)
      .reduce((total, c) => {
        return total + c.messages.filter(m => m.senderId !== userId && !m.read).length;
      }, 0);
  },

  markConversationRead: (conversationId) => {
    const userId = get().currentUser?.id;
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map(m =>
                m.senderId !== userId && !m.read ? { ...m, read: true } : m
              ),
            }
          : c
      ),
    }));
  },

  // ===== PLANS =====
  changePlan: (plan) => {
    if (!['free', 'business', 'premium'].includes(plan)) return;
    const expires = plan === 'free' ? null : (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    })();
    get().updateProfile({ plan, planExpiresAt: expires });
  },

  // ===== COMPANY SHIFTS =====
  getCompanyShifts: (companyId) =>
    get().shifts.filter(s => s.companyId === (companyId || get().currentUser?.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date)),

  getCompanyStats: () => {
    const user = get().currentUser;
    if (!user || user.role !== 'employer') return {};
    const shifts = get().shifts.filter(s => s.companyId === user.id);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const completedAndFilled = shifts.filter(s => ['completed', 'filled'].includes(s.status));
    const totalSpots = completedAndFilled.reduce((sum, s) => sum + s.spotsTotal, 0);
    const takenSpots = completedAndFilled.reduce((sum, s) => sum + s.spotsTaken, 0);
    const fillRate = totalSpots > 0 ? Math.round((takenSpots / totalSpots) * 100) : 0;
    const cancelledCount = shifts.filter(s => s.status === 'cancelled').length;
    const cancelRate = shifts.length > 0 ? Math.round((cancelledCount / shifts.length) * 100) : 0;

    // Top workers: count approved apps for completed shifts
    const companyShiftIds = shifts.filter(s => s.status === 'completed').map(s => s.id);
    const workerCounts = {};
    get().applications
      .filter(a => a.status === 'approved' && companyShiftIds.includes(a.shiftId))
      .forEach(a => { workerCounts[a.workerId] = (workerCounts[a.workerId] || 0) + 1; });
    const topWorkers = Object.entries(workerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([workerId, count]) => ({ worker: get().workers.find(w => w.id === workerId), count }))
      .filter(item => item.worker);

    return {
      activeShifts: shifts.filter(s => ['active', 'in_progress'].includes(s.status)).length,
      pendingApplications: get().applications.filter(
        a => a.status === 'pending' && shifts.some(s => s.id === a.shiftId)
      ).length,
      monthShifts: shifts.filter(s => s.createdAt >= monthStart).length,
      rating: user.rating,
      fillRate,
      cancelRate,
      topWorkers,
    };
  },
}),
    {
      name: 'smenabel-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        favorites: state.favorites,
        savedShifts: state.savedShifts,
      }),
    },
  ),
);

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

export default useStore;
