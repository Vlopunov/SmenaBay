// One filter model for the list and the map — they are one space of shifts
// with two views, so switching view never loses the filters or the
// selected shift.
import { isoDay, parseDay, shiftStart, shiftEnd } from '../../design/format';

export const PAY_MIN = 45;
export const PAY_MAX = 140;

export const WHEN = [
  { key: 'today', label: 'Сегодня' },
  { key: 'tomorrow', label: 'Завтра' },
  { key: 'weekend', label: 'Выходные' },
  { key: 'morning', label: 'Утро' },
  { key: 'evening', label: 'Вечер' },
  { key: 'night', label: 'Ночь' },
];

export const SKILLS = [
  { key: 'noExp', label: 'Без опыта' },
  { key: 'noMed', label: 'Без медкнижки' },
  { key: 'physical', label: 'Физическая работа' },
];

export const EMPTY_FILTERS = { minPay: PAY_MIN, when: [], skills: [], urgentOnly: false };

const PHYSICAL = /грузчик|разнорабоч|склад|комплект|сборщик|погрузчик/i;

function matchesWhen(shift, key, now) {
  const today = isoDay(now);
  const t = new Date(now); t.setDate(t.getDate() + 1);
  const start = shiftStart(shift);
  const h = start.getHours();
  switch (key) {
    case 'today': return shift.date === today;
    case 'tomorrow': return shift.date === isoDay(t);
    case 'weekend': { const d = parseDay(shift.date).getDay(); return d === 0 || d === 6; }
    case 'morning': return h < 12;
    case 'evening': return h >= 16 && h < 21;
    case 'night': return h >= 21 || shiftEnd(shift).getDate() !== start.getDate();
    default: return true;
  }
}

/** Does a shift pass the filters? (Search and blocked users handled by the caller.) */
export function passes(shift, f, now = new Date()) {
  if (shift.pay < f.minPay) return false;
  if (f.urgentOnly && !shift.urgent) return false;
  if (f.when.length && !f.when.some((k) => matchesWhen(shift, k, now))) return false;
  const req = shift.requirements || {};
  if (f.skills.includes('noExp') && !req.noExperienceOk) return false;
  if (f.skills.includes('noMed') && req.medicalBookRequired) return false;
  if (f.skills.includes('physical') && !PHYSICAL.test(shift.title)) return false;
  return true;
}

export function activeFilterCount(f) {
  return (f.minPay > PAY_MIN ? 1 : 0) + f.when.length + f.skills.length + (f.urgentOnly ? 1 : 0);
}

/**
 * Human names for each active condition, used by the empty state:
 * «Если убрать „Без медкнижки“, появится 6 смен».
 */
export function conditions(f) {
  const out = [];
  if (f.minPay > PAY_MIN) out.push({ label: `от ${f.minPay} BYN`, without: { ...f, minPay: PAY_MIN } });
  if (f.urgentOnly) out.push({ label: 'только срочные', without: { ...f, urgentOnly: false } });
  f.when.forEach((k) => out.push({ label: WHEN.find((w) => w.key === k).label.toLowerCase(), without: { ...f, when: f.when.filter((x) => x !== k) } }));
  f.skills.forEach((k) => out.push({ label: SKILLS.find((s) => s.key === k).label.toLowerCase(), without: { ...f, skills: f.skills.filter((x) => x !== k) } }));
  return out;
}

/** Shifts a worker can still take: not started yet, not from blocked employers. */
export function visibleShifts(shifts, blockedUsers, now = new Date()) {
  return shifts.filter((s) =>
    (s.status === 'active' || s.status === 'filled') &&
    shiftStart(s) > now &&
    !blockedUsers.includes(s.companyId));
}

export const isFull = (s) => s.status === 'filled' || s.spotsTaken >= s.spotsTotal;
