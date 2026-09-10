// Formatting for the ledger: money, time, dates, countdowns, Russian plurals.
// Order everywhere is money → time → place (design rule 5).

const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const MONTHS_GEN = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const MONTHS_FULL_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const MONTHS_NOM = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

/** plural(5, ['смена', 'смены', 'смен']) → 'смен' */
export function plural(n, [one, few, many]) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/** 1250 → '1 250' with a thin no-break space, as in the handoff. */
export function money(n) {
  const v = Math.round(Number(n) || 0);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** '≈8 BYN/ч' */
export function perHour(shift) {
  const h = shift.durationHours || 1;
  return `≈${Math.round(shift.pay / h)} BYN/ч`;
}

/** 'YYYY-MM-DD' parsed in local time (new Date('2026-09-12') would be UTC). */
export function parseDay(day) {
  if (day instanceof Date) return day;
  const [y, m, d] = String(day).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 'пт, 12 сен' */
export function shortDate(day) {
  const d = parseDay(day);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** '12 сентября' */
export function longDate(day) {
  const d = parseDay(day);
  return `${d.getDate()} ${MONTHS_FULL_GEN[d.getMonth()]}`;
}

/** 'Сегодня' | 'Завтра' | 'пт, 12 сен' */
export function dayLabel(day, now = new Date()) {
  const d = parseDay(day);
  if (sameDay(d, now)) return 'Сегодня';
  const t = new Date(now); t.setDate(t.getDate() + 1);
  if (sameDay(d, t)) return 'Завтра';
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (sameDay(d, y)) return 'Вчера';
  return shortDate(day);
}

/** Section header for a day: 'Сегодня' | 'Завтра' | 'Пятница, 12 сентября' */
export function daySection(day, now = new Date()) {
  const label = dayLabel(day, now);
  if (label === 'Сегодня' || label === 'Завтра' || label === 'Вчера') return label;
  const d = parseDay(day);
  const wd = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][d.getDay()];
  return `${wd}, ${longDate(day)}`;
}

export const timeRange = (s) => `${s.timeStart}–${s.timeEnd}`;
export const hours = (h) => `${h} ч`;

/** '1 из 2 мест' / '0 из 1 места' — genitive after «из». */
export function seats(taken, total) {
  const word = total % 10 === 1 && total % 100 !== 11 ? 'места' : 'мест';
  return `${taken} из ${total} ${word}`;
}

export function monthName(date = new Date()) {
  return MONTHS_NOM[date.getMonth()];
}

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// ── Shift clock ───────────────────────────────────────────────

export function shiftStart(shift) {
  const d = parseDay(shift.date);
  const [h, m] = shift.timeStart.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

export function shiftEnd(shift) {
  const start = shiftStart(shift);
  const d = parseDay(shift.date);
  const [h, m] = shift.timeEnd.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  if (d <= start) d.setDate(d.getDate() + 1); // overnight: 18:00–02:00
  return d;
}

function spanText(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} мин`;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}

/**
 * Countdown phrase for a confirmed shift. Counted from the shift start time,
 * not from a server tick (handoff «State Management»).
 * → { phase: 'before' | 'running' | 'ended', text, short }
 */
export function countdown(shift, now = new Date()) {
  const start = shiftStart(shift);
  const end = shiftEnd(shift);
  if (now < start) {
    const diff = start - now;
    if (diff < 24 * 3600 * 1000) {
      return { phase: 'before', text: `Начало через ${spanText(diff)}`, short: spanText(diff) };
    }
    const label = dayLabel(shift.date, now);
    const when = label === 'Завтра' ? 'завтра' : shortDate(shift.date);
    return { phase: 'before', text: `Начало ${when} в ${shift.timeStart}`, short: `${when}, ${shift.timeStart}` };
  }
  if (now < end) {
    return { phase: 'running', text: `Идёт смена · ещё ${spanText(end - now)}`, short: spanText(end - now) };
  }
  return { phase: 'ended', text: 'Смена закончилась', short: 'закончилась' };
}

/** '3 ч назад' | '12 мин назад' | 'вчера' | '12 сен' */
export function ago(value, now = new Date()) {
  if (!value) return '';
  const d = String(value).length <= 10 ? parseDay(value) : new Date(value);
  const diff = now - d;
  if (String(value).length > 10 && diff >= 0 && diff < 24 * 3600 * 1000) {
    const min = Math.round(diff / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    return `${Math.round(min / 60)} ч назад`;
  }
  const label = dayLabel(d, now);
  if (label === 'Сегодня') return 'сегодня';
  if (label === 'Вчера') return 'вчера';
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** Two-letter initials for monograms: «Ozon ПВЗ Минск» → «OZ» is the design's
 * choice for one-word brands; otherwise first letters of two words. */
export function initials(name = '', second = '') {
  if (second) return `${name[0] || ''}${second[0] || ''}`.toUpperCase();
  const words = String(name).replace(/[«»"]/g, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  if (/^[A-Za-z]/.test(words[0]) && words[0].length >= 2) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
}

/** Dative of a Russian first name for «Написать Марине / Андрею / Ивану». */
export function dative(name = '') {
  const n = String(name).trim();
  if (!n) return n;
  if (/ия$/.test(n)) return n.slice(0, -1) + 'и';        // Мария → Марии
  if (/[ая]$/.test(n)) return n.slice(0, -1) + 'е';      // Марина → Марине, Катя → Кате
  if (/й$/.test(n)) return n.slice(0, -1) + 'ю';         // Андрей → Андрею
  if (/ь$/.test(n)) return n.slice(0, -1) + 'ю';         // Игорь → Игорю
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(n)) return n + 'у'; // Иван → Ивану
  return n;
}

/** Gender-neutral presence: «в сети» · «в сети в 18:26» · «в сети вчера» · «в сети 12 сен». */
export function presence(iso, now = new Date()) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = now - d;
  if (diff >= 0 && diff < 5 * 60000) return 'в сети';
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const label = dayLabel(d, now);
  if (label === 'Сегодня') return `в сети в ${hm}`;
  if (label === 'Вчера') return 'в сети вчера';
  return `в сети ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** Message timestamp: «09:14». */
export function clock(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
