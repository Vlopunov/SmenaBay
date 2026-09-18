/**
 * Keeping the store in step with the server.
 *
 * There is no realtime channel — the REST proxy can't push — so the app
 * pulls the whole slice it needs (`/api/data/bootstrap`) on launch, on
 * every return to the foreground, and every 30 seconds while it is open.
 * That is cheap: one round-trip replaces seven and the payload is small
 * at this scale.
 *
 * Guests get the public feed instead, so the app has something to show
 * before anyone signs in.
 */
import { AppState } from 'react-native';
import * as backend from './backend';
import { isOffline } from './api';

const POLL_SIGNED_IN = 30000;
const POLL_GUEST = 120000;

/** Optimistic rows the server hasn't acknowledged yet must survive a pull. */
const keepPending = (local = [], remote = []) => {
  const pending = local.filter((x) => typeof x?.id === 'string' && x.id.startsWith('tmp_'));
  return pending.length ? [...remote, ...pending] : remote;
};

/** One authenticated pull. Returns true when the store was updated. */
export async function pullAll(set, get) {
  const data = await backend.bootstrap();
  if (!data) return false;
  const me = get().currentUser;
  const mine = me
    ? (data.workers || []).find((w) => w.id === me.id) || (data.companies || []).find((c) => c.id === me.id)
    : null;
  set((s) => ({
    // Bookmarks and «свои люди» are stored on the profile, so they follow
    // the account; the local map is keyed by user id because a phone can
    // be shared.
    savedShifts: mine?.savedShifts
      ? { ...s.savedShifts, [mine.id]: mine.savedShifts }
      : s.savedShifts,
    favorites: mine?.favorites
      ? { ...s.favorites, [mine.id]: mine.favorites }
      : s.favorites,
    workers: data.workers || s.workers,
    companies: data.companies || s.companies,
    shifts: keepPending(s.shifts, data.shifts || []),
    applications: keepPending(s.applications, data.applications || []),
    reviews: data.reviews || s.reviews,
    notifications: keepPending(s.notifications, data.notifications || []),
    conversations: keepPending(s.conversations, data.conversations || []),
    // The server owns the profile; local edits have already been sent.
    currentUser: mine ? { ...s.currentUser, ...mine } : s.currentUser,
    blockedUsers: Array.isArray(data.blockedUsers) ? data.blockedUsers : s.blockedUsers,
    lastSyncAt: new Date().toISOString(),
    syncError: null,
  }));
  return true;
}

/** The feed a guest sees: active shifts and the companies behind them. */
export async function pullPublic(set) {
  const data = await backend.publicShifts();
  if (!data) return false;
  set((s) => ({
    shifts: data.shifts || s.shifts,
    companies: data.companies || s.companies,
    lastSyncAt: new Date().toISOString(),
    syncError: null,
  }));
  return true;
}

/** Pull once, for whoever is (or isn't) signed in. Never throws. */
export async function pullOnce(set, get) {
  try {
    if (get().isAuthenticated && get().currentUser) await pullAll(set, get);
    else await pullPublic(set);
    return true;
  } catch (e) {
    // Offline is a state, not an incident: the store keeps its cached copy
    // and the banner says when it was last fresh.
    set({ syncError: isOffline(e) ? 'offline' : e?.code || 'error' });
    if (!isOffline(e)) console.warn('[sync]', e?.code, e?.message);
    return false;
  }
}

/**
 * Start pulling. Returns a stop function.
 * Polling pauses in the background — a phone in a pocket shouldn't spend
 * battery and traffic on a feed nobody is looking at.
 */
export function startSync(set, get) {
  let timer = null;
  let stopped = false;

  const schedule = () => {
    clearTimeout(timer);
    if (stopped) return;
    const ms = get().isAuthenticated ? POLL_SIGNED_IN : POLL_GUEST;
    timer = setTimeout(tick, ms);
  };

  const tick = async () => {
    if (stopped) return;
    if (AppState.currentState === 'active') await pullOnce(set, get);
    schedule();
  };

  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') tick();
  });

  tick();

  return () => {
    stopped = true;
    clearTimeout(timer);
    sub.remove();
  };
}
