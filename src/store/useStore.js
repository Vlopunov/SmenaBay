import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as backend from '../services/backend';
import { startSync, pullOnce, pullAll } from '../services/sync';
import { ApiError, isOffline } from '../services/api';
import { signOut as authSignOut, deleteAccount as authDeleteAccount } from '../services/auth';
import { toast } from '../design/Toast';
import { shortDate } from '../design/format';

/**
 * A write the person already sees on screen.
 *
 * Screens stay instant: the store updates first and the server catches up.
 * If the server refuses, the change is rolled back and the person is told —
 * silently keeping a row the server rejected is how two devices start
 * disagreeing about who has the shift.
 */
function push(promise, { rollback, message } = {}) {
  return promise.catch((e) => {
    if (rollback) rollback();
    if (isOffline(e)) toast.error('Нет связи. Изменение не сохранилось.');
    else toast.error(message || (e instanceof ApiError ? e.message : 'Не удалось сохранить.'));
    return null;
  });
}

/** Temporary id for a row the server hasn't acknowledged yet. */
const tmpId = () => 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

const useStore = create(
  persist(
    (set, get) => ({
  // ===== AUTH =====
  currentUser: null,   // worker or company object
  isAuthenticated: false,

  /**
   * Start talking to the server: pull the world, then keep pulling.
   * Returns a stop function (App.js calls it on unmount).
   */
  startSync: async () => {
    try {
      return startSync(set, get);
    } catch (e) {
      console.warn('[sync start]', e?.message);
      return () => {};
    }
  },

  /** Pull once, now — pull-to-refresh and «попробовать ещё раз» use this. */
  refresh: () => pullOnce(set, get),

  /**
   * «в сети» comes from this stamp, so it has to reach the server — but not
   * on every heartbeat: once every two minutes is enough for a presence dot
   * and costs a fraction of the traffic.
   */
  updateLastSeen: () => {
    const user = get().currentUser;
    if (!user) return;
    const now = new Date().toISOString();
    const key = user.role === 'worker' ? 'workers' : 'companies';
    set(s => ({
      currentUser: { ...s.currentUser, lastSeen: now },
      [key]: s[key].map(u => (u.id === user.id ? { ...u, lastSeen: now } : u)),
    }));
    const last = get()._lastSeenSentAt || 0;
    if (Date.now() - last < 120000) return;
    set({ _lastSeenSentAt: Date.now() });
    backend.updateProfile({ lastSeen: now }).catch(() => {});
  },
  _lastSeenSentAt: 0,

  /**
   * The one way into the app: a Firebase user (phone, Apple or Google)
   * becomes a server profile. The profile's id IS the Firebase uid, so
   * every device that signs in as this person sees the same account.
   *
   * `extraData` fills blanks on first creation (role, name, company) and is
   * ignored for fields the profile already has.
   */
  signIn: async (firebaseUser, extraData = {}) => {
    const profile = await backend.createProfile(firebaseUser, extraData);
    if (!profile) throw new ApiError('no_profile', 'Сервер не вернул профиль. Попробуй ещё раз.', 500);
    set({ currentUser: profile, isAuthenticated: true });
    // Non-blocking: a slow pull must not hold up the screen behind it.
    pullAll(set, get).catch(() => {});
    return profile;
  },

  /** True when the signed-in Firebase user has no profile yet. */
  hasProfile: async () => {
    const profile = await backend.getMyProfile();
    if (profile) set({ currentUser: profile, isAuthenticated: true });
    return !!(profile && profile.role);
  },

  /**
   * Development only: sign in as a demo phone through the real flow.
   * Needs the number listed in Firebase Console → Authentication → Phone →
   * numbers for testing, with the code in EXPO_PUBLIC_DEV_SMS_CODE.
   */
  login: async (phone) => {
    if (!__DEV__) return null;
    try {
      const { sendVerificationCode, verifyCode } = require('../services/auth');
      const verification = await sendVerificationCode(phone);
      const code = process.env.EXPO_PUBLIC_DEV_SMS_CODE || '123456';
      const res = await verifyCode(verification, code);
      if (!res?.success) return null;
      const { auth } = require('../services/firebase');
      return await get().signIn(auth.currentUser, { phone, phoneVerified: true });
    } catch (e) {
      console.warn('[dev login]', e?.message);
      return null;
    }
  },

  /**
   * After Google / Apple: the profile is found by uid on the server, so
   * there is nothing to match locally. Returns null when this account has
   * never registered, and the caller sends them to the name step.
   */
  loginBySocial: async ({ uid, email, displayName }) => {
    const profile = await backend.getMyProfile();
    if (!profile || !profile.role) return null;
    set({ currentUser: profile, isAuthenticated: true });
    pullAll(set, get).catch(() => {});
    return profile;
  },

  registerWorker: async (data) => {
    const { auth } = require('../services/firebase');
    return await get().signIn(auth.currentUser, {
      role: 'worker',
      phoneVerified: true,
      phoneVisible: true,
      ...data,
    });
  },

  registerEmployer: async (data) => {
    const { auth } = require('../services/firebase');
    return await get().signIn(auth.currentUser, {
      role: 'employer',
      plan: 'free',
      phoneVerified: true,
      phoneVisible: true,
      locations: [],
      ...data,
    });
  },

  logout: () => {
    // Someone else may pick up this phone next. Personal collections go;
    // the public feed stays so the app still has something to show.
    set(s => ({
      currentUser: null,
      isAuthenticated: false,
      applications: [],
      conversations: [],
      notifications: [],
      blockedUsers: [],
      lastSyncAt: null,
    }));
    // Best-effort sign out from Firebase + Google so the next login is clean.
    authSignOut().catch(() => {});
    pullOnce(set, get);
  },
  // Note: favorites are not cleared on logout — they persist per-user

  /**
   * Permanently delete the current account and everything attached to it.
   *
   * Required by App Store Review Guideline 5.1.1(v). Deletes the Firebase
   * Auth user first; if that fails we abort so the user is never left with
   * local data wiped but a live credential still able to sign in.
   *
   * Returns { success } or { requiresRecentLogin } / { message }.
   */
  deleteAccount: async () => {
    const user = get().currentUser;
    if (!user) return { success: false, message: 'Вы не авторизованы' };

    // The server goes first: it erases the account and everything attached
    // to it, then the Firebase credential. Wiping the phone first would
    // leave someone signed out of data that still exists for everyone else.
    try {
      await backend.deleteMyAccount();
    } catch (e) {
      if (isOffline(e)) return { success: false, message: 'Нет связи с сервером. Попробуй позже.' };
      return { success: false, message: e?.message || 'Не удалось удалить аккаунт.' };
    }

    // The credential may refuse to go without a recent sign-in; the account
    // data is already gone, so tell the caller what happened.
    const result = await authDeleteAccount();

    const uid = user.id;
    set(state => ({
      currentUser: null,
      isAuthenticated: false,
      workers: state.workers.filter(w => w.id !== uid),
      companies: state.companies.filter(c => c.id !== uid),
      shifts: state.shifts.filter(s => s.companyId !== uid),
      applications: [],
      reviews: state.reviews.filter(r => r.authorId !== uid && r.targetId !== uid),
      conversations: [],
      notifications: [],
      favorites: Object.fromEntries(
        Object.entries(state.favorites)
          .filter(([ownerId]) => ownerId !== uid)
          .map(([ownerId, ids]) => [ownerId, ids.filter(id => id !== uid)])
      ),
      savedShifts: Object.fromEntries(
        Object.entries(state.savedShifts).filter(([ownerId]) => ownerId !== uid)
      ),
      blockedUsers: [],
    }));

    if (!result.success && result.requiresRecentLogin) {
      return { success: true, message: 'Аккаунт удалён.' };
    }
    return { success: true };
  },

  // ===== «МОИ СМЕНЫ» BADGE =====
  // The tab badge marks new events (an application sent, an employer's
  // answer), not a standing count: opening the tab clears it.
  myShiftsSeenAt: {},
  markMyShiftsSeen: () => {
    const uid = get().currentUser?.id;
    if (!uid) return;
    set(s => ({ myShiftsSeenAt: { ...s.myShiftsSeenAt, [uid]: new Date().toISOString() } }));
  },
  getMyShiftsBadge: () => {
    const uid = get().currentUser?.id;
    if (!uid) return 0;
    const seen = get().myShiftsSeenAt[uid] || '';
    return get().applications.filter(a => a.workerId === uid && (
      (a.appliedAt && a.appliedAt.length > 10 && a.appliedAt > seen) ||
      (a.respondedAt && a.respondedAt.length > 10 && a.respondedAt > seen)
    )).length;
  },

  // ===== SAFETY: BLOCKING & REPORTING (App Store Guideline 1.2) =====
  // Chat messages, reviews and profiles are user-generated content, so the
  // app must let people block abusive users and report objectionable
  // content. Blocked users' content is filtered out of the current user's
  // feed, chat list and directory.
  blockedUsers: [],
  reports: [],

  isBlocked: (userId) => get().blockedUsers.includes(userId),

  blockUser: (userId) => {
    if (!userId || userId === get().currentUser?.id) return;
    if (get().blockedUsers.includes(userId)) return;
    set(state => ({ blockedUsers: [...state.blockedUsers, userId] }));
    // Blocking has to follow the person to their other devices, so it lives
    // on the server too. It stays in effect locally either way.
    push(backend.blockUser(userId), {
      rollback: () => set(state => ({ blockedUsers: state.blockedUsers.filter(id => id !== userId) })),
      message: 'Не удалось заблокировать. Попробуй ещё раз.',
    });
  },

  unblockUser: (userId) => {
    const had = get().blockedUsers.includes(userId);
    set(state => ({ blockedUsers: state.blockedUsers.filter(id => id !== userId) }));
    if (!had) return;
    push(backend.unblockUser(userId), {
      rollback: () => set(state => ({ blockedUsers: [...state.blockedUsers, userId] })),
    });
  },

  /**
   * Report objectionable content or behaviour.
   * `targetType` is one of 'user' | 'shift' | 'message' | 'review'.
   *
   * The report goes to the server, where a human can act on it — a report
   * that never leaves the phone is not moderation.
   */
  reportContent: ({ targetType, targetId, reason, details = '', shiftId, conversationId }) => {
    const report = {
      id: tmpId(),
      reporterId: get().currentUser?.id || null,
      targetType,
      targetId,
      reason,
      details,
      createdAt: new Date().toISOString(),
    };
    set(state => ({ reports: [...state.reports, report] }));
    push(backend.reportContent({ targetType, targetId, reason, details, shiftId, conversationId }), {
      rollback: () => set(state => ({ reports: state.reports.filter(r => r.id !== report.id) })),
      message: 'Жалоба не отправилась. Попробуй ещё раз.',
    });
    return report;
  },

  updateProfile: (updates) => {
    const user = get().currentUser;
    if (!user) return;
    const before = user;
    const updated = { ...user, ...updates };
    const key = user.role === 'worker' ? 'workers' : 'companies';
    set(s => ({
      currentUser: updated,
      [key]: s[key].map(u => (u.id === user.id ? { ...u, ...updates } : u)),
    }));
    push(backend.updateProfile(updates), {
      rollback: () => set(s => ({
        currentUser: before,
        [key]: s[key].map(u => (u.id === user.id ? before : u)),
      })),
      message: 'Изменения не сохранились.',
    });
  },

  // ===== DATA =====
  // Everything below comes from the server (services/sync.js). It is
  // persisted so the app opens with what it last saw instead of a blank
  // screen, then refreshes.
  workers: [],
  companies: [],
  shifts: [],
  applications: [],
  reviews: [],
  notifications: [],
  lastSyncAt: null,
  syncError: null,

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
      const loc = (c.locations || []).find(l => l.id === id);
      if (loc) return loc;
    }
    return null;
  },

  /**
   * Publish one shift per chosen date. The server assigns the id, stamps
   * createdAt and forces companyId to the caller, so we wait for it: a
   * shift with a made-up id can't be opened by anyone else.
   */
  createShift: async (data) => {
    const user = get().currentUser;
    if (!user) return { error: 'not_authenticated' };
    if (!user.phoneVerified) return { error: 'phone_not_verified' };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthShifts = get().shifts.filter(
      s => s.companyId === user.id && s.createdAt >= monthStart && s.status !== 'cancelled'
    ).length;
    const limits = { free: 3, business: 30, premium: Infinity };
    if (monthShifts >= (limits[user.plan] || 3)) return { error: 'limit' };

    const dates = Array.isArray(data.date) ? data.date : [data.date];
    const hours = calcDuration(data.timeStart, data.timeEnd);
    const created = [];
    try {
      for (const date of dates) {
        const shift = await backend.createShift({
          ...data,
          date,
          status: 'active',
          durationHours: hours,
          payPerHour: +(data.pay / hours).toFixed(2),
        });
        if (shift) created.push(shift);
      }
    } catch (e) {
      if (created.length === 0) {
        return { error: isOffline(e) ? 'Нет связи с сервером. Смена не опубликована.' : (e?.message || 'Не удалось опубликовать смену.') };
      }
      // Some dates went through: keep them and say what happened.
      toast.error('Опубликованы не все даты. Проверь список смен.');
    }
    if (!created.length) return { error: 'Не удалось опубликовать смену.' };

    set(s => ({
      shifts: [...s.shifts, ...created],
      companies: s.companies.map(c =>
        c.id === user.id
          ? { ...c, totalShiftsPublished: (c.totalShiftsPublished || 0) + created.length }
          : c
      ),
      currentUser: {
        ...s.currentUser,
        totalShiftsPublished: (s.currentUser.totalShiftsPublished || 0) + created.length,
      },
    }));
    return { success: true, shifts: created };
  },

  cancelShift: (shiftId) => {
    const affectedApps = get().applications.filter(
      a => a.shiftId === shiftId && (a.status === 'pending' || a.status === 'approved')
    );
    const shift = get().getShiftById(shiftId);
    const before = { shifts: get().shifts, applications: get().applications };

    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, status: 'cancelled' } : sh
      ),
      applications: s.applications.map(a =>
        a.shiftId === shiftId && (a.status === 'pending' || a.status === 'approved')
          ? { ...a, status: 'rejected', respondedAt: new Date().toISOString() }
          : a
      ),
    }));

    push(backend.updateShift(shiftId, { status: 'cancelled' }), {
      rollback: () => set(before),
      message: 'Смена не отменилась. Попробуй ещё раз.',
    }).then((ok) => {
      if (ok === null) return;
      // Each application is its own document; the shift status alone would
      // leave workers with a «подтверждена» pass for a shift that is gone.
      affectedApps.forEach(a => {
        backend.updateApplication(a.id, { status: 'rejected', respondedAt: new Date().toISOString() }).catch(() => {});
      });
      affectedApps.forEach(a => {
        get().addNotification(a.workerId, 'shift_cancelled',
          'Смена отменена', `Смена «${shift?.title}» отменена заказчиком`, shiftId);
      });
    });
  },

  completeShift: (shiftId) => {
    const approvedWorkerIds = get().applications
      .filter(a => a.shiftId === shiftId && a.status === 'approved')
      .map(a => a.workerId);
    const before = { shifts: get().shifts, workers: get().workers };

    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, status: 'completed' } : sh
      ),
      // The count the worker sees; the server recomputes its own.
      workers: s.workers.map(w =>
        approvedWorkerIds.includes(w.id)
          ? { ...w, shiftsCompleted: (w.shiftsCompleted || 0) + 1 }
          : w
      ),
    }));

    push(backend.updateShift(shiftId, { status: 'completed' }), { rollback: () => set(before) });
  },

  duplicateShift: (shiftId) => {
    const shift = get().getShiftById(shiftId);
    if (!shift) return null;
    const { id, date, status, spotsTaken, createdAt, ...rest } = shift;
    return rest; // Return template for create form
  },

  editShift: (shiftId, updates) => {
    const before = get().shifts;
    set(s => ({
      shifts: s.shifts.map(sh => (sh.id === shiftId ? { ...sh, ...updates } : sh)),
    }));
    push(backend.updateShift(shiftId, updates), {
      rollback: () => set({ shifts: before }),
      message: 'Изменения смены не сохранились.',
    });
  },

  // ===== APPLICATIONS =====
  /**
   * Apply. The server is the referee here: it re-checks that the shift is
   * live, has a seat and that this worker hasn't already applied, because
   * two phones can tap the last seat at the same moment.
   */
  applyToShift: async (shiftId) => {
    const user = get().currentUser;
    if (!user) return { error: 'not_authenticated' };
    if (!user.phoneVerified) return { error: 'phone_not_verified' };

    // Cheap local checks first — no point in a round-trip to be told what
    // the screen already knows.
    const shiftCheck = get().getShiftById(shiftId);
    if (shiftCheck && shiftCheck.status !== 'active') return { error: 'shift_not_active' };
    if (shiftCheck && shiftCheck.spotsTaken >= shiftCheck.spotsTotal) return { error: 'shift_full' };
    const existing = get().applications.find(
      a => a.shiftId === shiftId && a.workerId === user.id && a.status !== 'cancelled_by_worker'
    );
    if (existing) return { error: 'already_applied' };

    let app;
    try {
      app = await backend.createApplication(shiftId);
    } catch (e) {
      // These codes are what the UI already knows how to say.
      if (e?.code === 'shift_full' || e?.code === 'already_applied' || e?.code === 'shift_not_active') {
        pullOnce(set, get);
        return { error: e.code };
      }
      return { error: isOffline(e) ? 'Нет связи. Отклик не отправлен.' : (e?.message || 'Не удалось отправить отклик.') };
    }
    if (!app?.id) return { error: 'Не удалось отправить отклик.' };

    set(s => ({ applications: [...s.applications, app] }));

    const shift = get().getShiftById(shiftId);
    if (shift) {
      get().addNotification(shift.companyId, 'new_application',
        'Новый отклик', `Новый отклик на «${shift.title}» от ${user.firstName}${user.lastName ? ` ${user.lastName[0]}.` : ''}`,
        shiftId);
    }
    return { success: true, application: app };
  },

  cancelApplication: (appId) => {
    const app = get().applications.find(a => a.id === appId);
    if (!app) return;
    const wasApproved = app.status === 'approved';
    const before = { applications: get().applications, shifts: get().shifts, workers: get().workers, currentUser: get().currentUser };
    const respondedAt = new Date().toISOString();

    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'cancelled_by_worker', respondedAt } : a
      ),
      // A confirmed worker pulling out frees the seat they were holding;
      // otherwise the shift stays «full» with nobody coming.
      shifts: wasApproved
        ? s.shifts.map(sh => sh.id === app.shiftId
          ? { ...sh, spotsTaken: Math.max(0, sh.spotsTaken - 1), status: sh.status === 'filled' ? 'active' : sh.status }
          : sh)
        : s.shifts,
    }));

    push(backend.updateApplication(appId, { status: 'cancelled_by_worker', respondedAt }), {
      rollback: () => set(before),
      message: 'Отмена не сохранилась. Попробуй ещё раз.',
    }).then((ok) => {
      if (ok === null || !wasApproved) return;
      const shift = get().getShiftById(app.shiftId);
      // The seat is the server's number; it recounts on the next pull.
      pullOnce(set, get);

      // «Без отмен» means exactly that — it goes with the first cancellation.
      const drop = (w) => (w.id === app.workerId && w.badges?.includes('no_cancels'))
        ? { ...w, badges: (w.badges || []).filter(b => b !== 'no_cancels') } : w;
      const me = get().currentUser;
      if (me?.id === app.workerId && me.badges?.includes('no_cancels')) {
        get().updateProfile({ badges: (me.badges || []).filter(b => b !== 'no_cancels') });
      }
      set(s => ({ workers: s.workers.map(drop) }));

      const worker = get().workers.find(w => w.id === app.workerId);
      if (shift) {
        get().addNotification(shift.companyId, 'shift_cancelled',
          'Исполнитель отменил смену',
          `${worker?.firstName || 'Исполнитель'} не выйдет на «${shift.title}» ${shortDate(shift.date)}, ${shift.timeStart}. Место снова открыто.`,
          shift.id);
      }
    });
  },

  /**
   * Confirm a person for a seat. Runs as one transaction on the server, so
   * two employers (or two taps) can never oversell the same shift; the
   * screen updates first and rolls back if the server says the seat is gone.
   */
  approveApplication: async (appId) => {
    const app = get().applications.find(a => a.id === appId);
    if (!app) return { error: 'app_not_found' };
    const shift = get().getShiftById(app.shiftId);
    if (!shift) return { error: 'shift_not_found' };
    const respondedAt = new Date().toISOString();

    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'approved', respondedAt } : a
      ),
      shifts: s.shifts.map(sh =>
        sh.id === app.shiftId ? { ...sh, spotsTaken: sh.spotsTaken + 1 } : sh
      ),
    }));

    let result;
    try {
      result = await backend.approveApplication(appId, app.shiftId);
    } catch (e) {
      set(s => ({
        applications: s.applications.map(a =>
          a.id === appId ? { ...a, status: 'pending', respondedAt: null } : a
        ),
        shifts: s.shifts.map(sh =>
          sh.id === app.shiftId ? { ...sh, spotsTaken: Math.max(0, sh.spotsTaken - 1) } : sh
        ),
      }));
      if (e?.code === 'shift_full') { pullOnce(set, get); return { error: 'shift_full' }; }
      if (e?.code === 'application_not_pending') { pullOnce(set, get); return { error: 'already_processed' }; }
      toast.error(isOffline(e) ? 'Нет связи. Отклик не подтверждён.' : (e?.message || 'Не удалось подтвердить.'));
      return { error: e?.code || 'unknown' };
    }

    get().addNotification(app.workerId, 'application_approved',
      'Отклик подтверждён', `Ваш отклик на «${shift.title}» подтверждён!`, app.shiftId);

    // Best-effort: the approval already happened, so a chat hiccup must not
    // read as a failed confirmation.
    try {
      const conv = await get().getOrCreateConversation(app.shiftId, app.workerId, shift.companyId);
      if (conv?.id) {
        await get().sendSystemMessage(conv.id,
          `Заявка подтверждена! Смена «${shift.title}» — ${shortDate(shift.date)}, ${shift.timeStart}–${shift.timeEnd}`);
      }
    } catch (e) {
      console.warn('[approve] chat setup failed', e?.message);
    }

    if (result?.filled) {
      const pendingApps = get().applications.filter(
        a => a.shiftId === app.shiftId && a.status === 'pending'
      );
      set(s => ({
        shifts: s.shifts.map(sh => (sh.id === app.shiftId ? { ...sh, status: 'filled' } : sh)),
        applications: s.applications.map(a =>
          a.shiftId === app.shiftId && a.status === 'pending'
            ? { ...a, status: 'rejected', respondedAt }
            : a
        ),
      }));
      pendingApps.forEach(a => {
        backend.updateApplication(a.id, { status: 'rejected', respondedAt }).catch(() => {});
        get().addNotification(a.workerId, 'application_rejected',
          'Отклик отклонён', `Смена «${shift.title}» уже заполнена`, app.shiftId);
      });
    }
    return { success: true, filled: !!result?.filled };
  },

  rejectApplication: (appId) => {
    const app = get().applications.find(a => a.id === appId);
    if (!app) return;
    const before = get().applications;
    const respondedAt = new Date().toISOString();
    set(s => ({
      applications: s.applications.map(a =>
        a.id === appId ? { ...a, status: 'rejected', respondedAt } : a
      ),
    }));
    push(backend.updateApplication(appId, { status: 'rejected', respondedAt }), {
      rollback: () => set({ applications: before }),
    }).then((ok) => {
      if (ok === null) return;
      const shift = get().getShiftById(app.shiftId);
      get().addNotification(app.workerId, 'application_rejected',
        'Отклик отклонён', `К сожалению, ваш отклик на «${shift?.title}» отклонён`, app.shiftId);
    });
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
      id: tmpId(),
      createdAt: new Date().toISOString(),
      ...review,
    };
    set(s => ({ reviews: [...s.reviews, newReview] }));
    push(backend.createReview(review), {
      rollback: () => set(s => ({ reviews: s.reviews.filter(r => r.id !== newReview.id) })),
      message: 'Оценка не отправилась. Попробуй ещё раз.',
    }).then((saved) => {
      // Swap the placeholder for the real row, so a later poll doesn't
      // leave the review on screen twice.
      if (saved?.id) {
        set(s => ({ reviews: s.reviews.map(r => (r.id === newReview.id ? saved : r)) }));
      }
    });

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
    // Read state has to stick: without the server write the next poll
    // brings the unread dot straight back.
    if (!String(notifId).startsWith('tmp_')) backend.markNotificationRead(notifId).catch(() => {});
  },

  markAllRead: () => {
    const userId = get().currentUser?.id;
    set(s => ({
      notifications: s.notifications.map(n =>
        n.userId === userId ? { ...n, read: true } : n
      ),
    }));
    backend.markAllNotificationsRead().catch(() => {});
  },

  /**
   * Notifications are addressed to the other side as often as to ourselves
   * («новый отклик» goes to the employer), so they are written on the
   * server and appear on that person's next pull — and as a push.
   */
  addNotification: (userId, type, title, body, relatedShiftId = null) => {
    const notif = {
      id: tmpId(),
      userId,
      type,
      title,
      body,
      relatedShiftId,
      read: false,
      createdAt: new Date().toISOString(),
    };
    // Only show it here when it is addressed to us.
    if (userId === get().currentUser?.id) {
      set(s => ({ notifications: [...s.notifications, notif] }));
    }
    backend.createNotification({ userId, type, title, body, relatedShiftId })
      .then((saved) => {
        if (saved?.id && userId === get().currentUser?.id) {
          set(s => ({ notifications: s.notifications.map(n => (n.id === notif.id ? saved : n)) }));
        }
      })
      .catch(() => {
        if (userId === get().currentUser?.id) {
          set(s => ({ notifications: s.notifications.filter(n => n.id !== notif.id) }));
        }
      });
  },

  // ===== LOCATIONS =====
  addLocation: (location) => {
    const user = get().currentUser;
    if (!user) return null;
    const newLoc = { id: 'loc_' + Date.now(), companyId: user.id, ...location };
    const next = [...(user.locations || []), newLoc];
    set(s => ({
      companies: s.companies.map(c => (c.id === user.id ? { ...c, locations: next } : c)),
      currentUser: { ...s.currentUser, locations: next },
    }));
    // Points are part of the company profile, so they save with it.
    push(backend.updateProfile({ locations: next }), {
      rollback: () => set(s => ({
        companies: s.companies.map(c => (c.id === user.id ? { ...c, locations: user.locations || [] } : c)),
        currentUser: { ...s.currentUser, locations: user.locations || [] },
      })),
      message: 'Точка не сохранилась.',
    });
    return newLoc;
  },

  deleteLocation: (locId) => {
    const activeShifts = get().shifts.filter(
      s => s.locationId === locId && ['active', 'filled', 'in_progress'].includes(s.status)
    );
    if (activeShifts.length > 0) return { error: 'has_active_shifts' };

    const user = get().currentUser;
    if (!user) return { error: 'not_authenticated' };
    const before = user.locations || [];
    const next = before.filter(l => l.id !== locId);
    set(s => ({
      companies: s.companies.map(c => (c.id === user.id ? { ...c, locations: next } : c)),
      currentUser: { ...s.currentUser, locations: next },
    }));
    push(backend.updateProfile({ locations: next }), {
      rollback: () => set(s => ({
        companies: s.companies.map(c => (c.id === user.id ? { ...c, locations: before } : c)),
        currentUser: { ...s.currentUser, locations: before },
      })),
      message: 'Точка не удалилась.',
    });
    return { success: true };
  },

  // ===== FAVORITES =====
  favorites: {},
  toggleFavorite: (workerId) => {
    const userId = get().currentUser?.id;
    if (!userId) return;
    const current = get().favorites[userId] || [];
    const next = current.includes(workerId)
      ? current.filter(id => id !== workerId)
      : [...current, workerId];
    set(s => ({ favorites: { ...s.favorites, [userId]: next } }));
    // «Свои люди» follow the account to any device the employer signs in on.
    push(backend.updateProfile({ favorites: next }), {
      rollback: () => set(s => ({ favorites: { ...s.favorites, [userId]: current } })),
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
    const current = get().savedShifts[userId] || [];
    const next = current.includes(shiftId)
      ? current.filter(id => id !== shiftId)
      : [...current, shiftId];
    set(s => ({ savedShifts: { ...s.savedShifts, [userId]: next } }));
    push(backend.updateProfile({ savedShifts: next }), {
      rollback: () => set(s => ({ savedShifts: { ...s.savedShifts, [userId]: current } })),
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
  conversations: [],

  getConversationsForUser: () => {
    const userId = get().currentUser?.id;
    if (!userId) return [];
    return get().conversations
      .filter(c => c.workerId === userId || c.companyId === userId)
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  },

  /**
   * A conversation has to exist for both sides, so the server creates it
   * and hands back the id both phones will use.
   */
  getOrCreateConversation: async (shiftId, workerId, companyId) => {
    const existing = get().conversations.find(
      c => c.shiftId === shiftId && c.workerId === workerId && c.companyId === companyId
    );
    if (existing && !String(existing.id).startsWith('tmp_')) return existing;

    const conv = await backend.getOrCreateConversation(shiftId, workerId, companyId);
    if (!conv?.id) throw new ApiError('no_conversation', 'Не удалось открыть чат.', 500);
    set(s => ({
      conversations: s.conversations.some(c => c.id === conv.id)
        ? s.conversations.map(c => (c.id === conv.id ? { ...c, ...conv } : c))
        : [...s.conversations, { messages: [], ...conv }],
    }));
    return conv;
  },

  sendMessage: (conversationId, text, imageUri) => {
    const userId = get().currentUser?.id;
    if (!userId || (!text?.trim() && !imageUri)) return null;

    // Shown at once, with a temporary id; the server's row replaces it.
    const msg = {
      id: tmpId(),
      senderId: userId,
      text: text?.trim() || '',
      createdAt: new Date().toISOString(),
      read: false,
      ...(imageUri ? { imageUri } : {}),
    };

    const put = (m) => set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...(c.messages || []).filter(x => x.id !== msg.id), m], lastMessageAt: m.createdAt }
          : c
      ),
    }));
    put(msg);

    backend.sendMessage(conversationId, msg.text, imageUri || null)
      .then((saved) => { if (saved?.id) put(saved); })
      .catch((e) => {
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === conversationId
              ? { ...c, messages: (c.messages || []).map(x => (x.id === msg.id ? { ...x, failed: true } : x)) }
              : c
          ),
        }));
        toast.error(isOffline(e) ? 'Нет связи. Сообщение не отправлено.' : 'Сообщение не отправлено.');
      });
    return msg;
  },

  sendSystemMessage: async (conversationId, text) => {
    const msg = {
      id: tmpId(),
      senderId: 'system',
      text,
      createdAt: new Date().toISOString(),
      read: false,
      isSystem: true,
    };
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? { ...c, messages: [...(c.messages || []), msg], lastMessageAt: msg.createdAt }
          : c
      ),
    }));
    try {
      const saved = await backend.sendMessage(conversationId, text, null, true);
      if (saved?.id) {
        set(s => ({
          conversations: s.conversations.map(c =>
            c.id === conversationId
              ? { ...c, messages: (c.messages || []).map(x => (x.id === msg.id ? saved : x)) }
              : c
          ),
        }));
      }
    } catch (e) {
      console.warn('[system message]', e?.message);
    }
    return msg;
  },

  // Counts what the chat list shows as unread: people's messages, not
  // system notes, and nothing from blocked users.
  getUnreadChatCount: () => {
    const userId = get().currentUser?.id;
    if (!userId) return 0;
    const blocked = get().blockedUsers;
    return get().conversations
      .filter(c => c.workerId === userId || c.companyId === userId)
      .filter(c => !blocked.includes(c.workerId === userId ? c.companyId : c.workerId))
      .reduce((total, c) => {
        return total + (c.messages || []).filter(m => m.senderId !== userId && m.senderId !== 'system' && !m.isSystem && !m.read).length;
      }, 0);
  },

  markConversationRead: (conversationId) => {
    const userId = get().currentUser?.id;
    // Server-side too: otherwise the next poll restores the unread badge.
    if (conversationId && !String(conversationId).startsWith('tmp_')) {
      backend.markConversationRead(conversationId).catch(() => {});
    }
    set(s => ({
      conversations: s.conversations.map(c =>
        c.id === conversationId
          ? {
              ...c,
              messages: (c.messages || []).map(m =>
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
        // Auth + per-user prefs
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        favorites: state.favorites,
        savedShifts: state.savedShifts,
        // Safety state must survive restarts — a blocked user staying
        // blocked is a Guideline 1.2 requirement, not a preference.
        blockedUsers: state.blockedUsers,
        myShiftsSeenAt: state.myShiftsSeenAt,
        reports: state.reports,
        // Persist registered users + content created in-app so they
        // survive logout / app restart. Without this, registering a
        // worker or employer would set currentUser but the workers/
        // companies arrays would reset to MOCK_* on next launch,
        // causing "Профиль не найден" on subsequent login.
        workers: state.workers,
        companies: state.companies,
        shifts: state.shifts,
        applications: state.applications,
        reviews: state.reviews,
        conversations: state.conversations,
        notifications: state.notifications,
      }),
      // Self-heal users registered before workers/companies were persisted:
      // if currentUser exists but is missing from the directory arrays,
      // add them back so the next login(phone) call can find them.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const cu = state.currentUser;
        if (!cu) return;
        if (cu.role === 'worker' && !state.workers.some(w => w.id === cu.id || w.phone === cu.phone)) {
          state.workers = [...state.workers, cu];
        }
        if (cu.role === 'employer' && !state.companies.some(c => c.id === cu.id || c.phone === cu.phone)) {
          state.companies = [...state.companies, cu];
        }
      },
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
