// Employer-side numbers, derived from the store in one place so the
// dashboard, the shifts tab and the profile never disagree.
import { shiftStart, shiftEnd, parseDay } from '../../design/format';

export function employerSnapshot({ me, shifts, applications, workers, now = new Date() }) {
  const own = shifts.filter((s) => s.companyId === me?.id);
  const ownIds = new Set(own.map((s) => s.id));
  const apps = applications.filter((a) => ownIds.has(a.shiftId));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const approvedFor = (id) => apps.filter((a) => a.shiftId === id && a.status === 'approved').length;
  const pendingFor = (id) => apps.filter((a) => a.shiftId === id && a.status === 'pending').length;

  const upcoming = own
    .filter((s) => (s.status === 'active' || s.status === 'filled') && shiftEnd(s) > now)
    .sort((a, b) => (a.date + a.timeStart).localeCompare(b.date + b.timeStart));
  const past = own
    .filter((s) => !upcoming.includes(s))
    .sort((a, b) => (b.date + b.timeStart).localeCompare(a.date + a.timeStart));

  const pending = apps.filter((a) => a.status === 'pending' && upcoming.some((s) => s.id === a.shiftId)).length;

  const thisMonth = own.filter((s) => parseDay(s.date) >= monthStart && s.status !== 'cancelled');
  const seats = thisMonth.reduce((n, s) => n + s.spotsTotal, 0);
  const filled = thisMonth.reduce((n, s) => n + Math.min(s.spotsTotal, approvedFor(s.id)), 0);
  const fillRate = seats ? Math.round((filled / seats) * 100) : 0;
  const cancelledThisMonth = own.filter((s) => s.status === 'cancelled' && parseDay(s.date) >= monthStart).length;

  // The single most urgent problem: the soonest shift in the next 24 h with
  // an empty seat.
  const soon = upcoming
    .filter((s) => shiftStart(s) > now && shiftStart(s) - now < 24 * 3600 * 1000 && approvedFor(s.id) < s.spotsTotal)
    .map((s) => ({ shift: s, free: s.spotsTotal - approvedFor(s.id), pending: pendingFor(s.id), msLeft: shiftStart(s) - now }))[0] || null;

  // Who shows up most: approved on shifts that have already ended.
  const counts = {};
  apps.forEach((a) => {
    const s = own.find((x) => x.id === a.shiftId);
    if (a.status === 'approved' && s && shiftEnd(s) <= now) counts[a.workerId] = (counts[a.workerId] || 0) + 1;
  });
  const regulars = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, n]) => ({ worker: workers.find((w) => w.id === id), count: n }))
    .filter((x) => x.worker);

  return {
    own, upcoming, past, pending, fillRate, cancelledThisMonth, soon, regulars,
    monthCount: thisMonth.length, approvedFor, pendingFor,
    cancelsOf: (workerId) => applications.filter((a) => a.workerId === workerId && a.status === 'cancelled_by_worker').length,
    withMe: (workerId) => apps.filter((a) => a.workerId === workerId && a.status === 'approved').length,
  };
}

export const PLAN_NAMES = { free: 'Бесплатный', business: 'Бизнес', premium: 'Премиум' };
// The free launch: 100 a month for everyone (the server holds the same numbers).
export const PLAN_LIMITS = { free: 100, business: 100, premium: Infinity };
