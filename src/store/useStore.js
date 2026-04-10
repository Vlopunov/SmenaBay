import { create } from 'zustand';
import {
  MOCK_WORKERS, MOCK_COMPANIES, MOCK_SHIFTS, MOCK_APPLICATIONS,
  MOCK_REVIEWS, MOCK_NOTIFICATIONS,
} from '../data/mockData';

const useStore = create((set, get) => ({
  // ===== AUTH =====
  currentUser: null,   // worker or company object
  isAuthenticated: false,

  login: (phone) => {
    const worker = get().workers.find(w => w.phone === phone);
    if (worker) {
      set({ currentUser: worker, isAuthenticated: true });
      return worker;
    }
    const company = get().companies.find(c => c.phone === phone);
    if (company) {
      set({ currentUser: company, isAuthenticated: true });
      return company;
    }
    return null;
  },

  registerWorker: (data) => {
    const newWorker = {
      id: 'w_' + Date.now(),
      role: 'worker',
      rating: 0,
      shiftsCompleted: 0,
      totalEarned: 0,
      badges: ['newbie'],
      documents: { passport: false, medicalBook: false },
      verified: false,
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

  updateProfile: (updates) => {
    const user = get().currentUser;
    const updated = { ...user, ...updates };
    set({ currentUser: updated });
    if (user.role === 'worker') {
      set(s => ({ workers: s.workers.map(w => w.id === user.id ? updated : w) }));
    } else {
      set(s => ({ companies: s.companies.map(c => c.id === user.id ? updated : c) }));
    }
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
    // Check plan limits
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthShifts = get().shifts.filter(
      s => s.companyId === user.id && s.createdAt >= monthStart
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
    // Notify affected workers
    const apps = get().applications.filter(a => a.shiftId === shiftId);
    const shift = get().getShiftById(shiftId);
    apps.forEach(a => {
      get().addNotification(a.workerId, 'shift_cancelled',
        'Смена отменена', `Смена «${shift?.title}» отменена заказчиком`, shiftId);
    });
  },

  completeShift: (shiftId) => {
    set(s => ({
      shifts: s.shifts.map(sh =>
        sh.id === shiftId ? { ...sh, status: 'completed' } : sh
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

    // Check if shift is now filled
    const updatedShift = get().getShiftById(app.shiftId);
    if (updatedShift && updatedShift.spotsTaken >= updatedShift.spotsTotal) {
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

  getReviewForShift: (shiftId, authorId) =>
    get().reviews.find(r => r.shiftId === shiftId && r.authorId === authorId),

  addReview: (review) => {
    const newReview = {
      id: 'r_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      ...review,
    };
    set(s => ({ reviews: [...s.reviews, newReview] }));

    // Update target rating
    const allReviews = get().getReviewsFor(review.targetId);
    const avg = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;
    const rounded = +avg.toFixed(1);

    if (review.type === 'worker_about_company') {
      set(s => ({
        companies: s.companies.map(c =>
          c.id === review.targetId
            ? { ...c, rating: rounded, reviewsCount: allReviews.length }
            : c
        ),
      }));
    } else {
      set(s => ({
        workers: s.workers.map(w =>
          w.id === review.targetId ? { ...w, rating: rounded } : w
        ),
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
  favorites: [],
  toggleFavorite: (workerId) => {
    set(s => ({
      favorites: s.favorites.includes(workerId)
        ? s.favorites.filter(id => id !== workerId)
        : [...s.favorites, workerId],
    }));
  },
  isFavorite: (workerId) => get().favorites.includes(workerId),

  // ===== PLANS =====
  changePlan: (plan) => {
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

    return {
      activeShifts: shifts.filter(s => ['active', 'in_progress'].includes(s.status)).length,
      pendingApplications: get().applications.filter(
        a => a.status === 'pending' && shifts.some(s => s.id === a.shiftId)
      ).length,
      monthShifts: shifts.filter(s => s.createdAt >= monthStart).length,
      rating: user.rating,
    };
  },
}));

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

export default useStore;
