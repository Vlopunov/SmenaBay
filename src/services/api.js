/**
 * HTTP transport for the backend.
 *
 * Every read and write goes to smenabel.by/api, never to Firestore
 * directly: firestore.googleapis.com is unreachable on many Belarusian
 * ISPs and mobile carriers, so the client SDK would silently fail for a
 * large part of the audience. Firebase Auth lives on a different host
 * (identitytoolkit) and works, so the phone signs in locally and sends the
 * resulting ID token to our server, which does the database work with the
 * Admin SDK.
 */
import { auth } from './firebase';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://smenabel.by';

const TIMEOUT_MS = 20000;

/** An error the UI can show as-is; `code` is stable, `message` is Russian. */
export class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const OFFLINE = () => new ApiError('offline', 'Нет связи с сервером. Проверь интернет.', 0);

/** Messages for the error codes the API returns. */
const MESSAGES = {
  unauthorized: 'Нужно войти заново.',
  invalid_token: 'Нужно войти заново.',
  own_shift: 'Это твоя смена.',
  shift_not_active: 'Смена больше не активна.',
  shift_full: 'Мест уже нет.',
  already_applied: 'Ты уже откликнулся на эту смену.',
  not_found: 'Не найдено.',
  rate_limited: 'Слишком часто. Подожди минуту.',
  unavailable: 'Сервер занят. Попробуй через минуту.',
  timeout: 'Сервер не ответил. Попробуй ещё раз.',
};

/**
 * On a cold start Firebase restores the session asynchronously, so for the
 * first moments `currentUser` is null even though the person is signed in.
 * Asking the server right then would answer «войди заново» to someone who
 * never left, so we wait for the SDK to make up its mind.
 */
function waitForUser(ms = 6000) {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    let done = false;
    const finish = (user) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      unsubscribe?.();
      resolve(user);
    };
    const timer = setTimeout(() => finish(null), ms);
    const unsubscribe = auth.onAuthStateChanged((user) => { if (user) finish(user); });
  });
}

async function idToken(force = false) {
  const user = auth.currentUser || (await waitForUser());
  if (!user) throw new ApiError('unauthorized', 'Нужно войти заново.', 401);
  try {
    return await user.getIdToken(force);
  } catch (e) {
    throw new ApiError('unauthorized', 'Нужно войти заново.', 401);
  }
}

const isForm = (body) => typeof FormData !== 'undefined' && body instanceof FormData;

async function send(path, { method, body, token, timeout }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout || TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        // FormData sets its own multipart boundary; naming a type breaks it.
        ...(body && !isForm(body) ? { 'Content-Type': 'application/json' } : null),
      },
      body: body ? (isForm(body) ? body : JSON.stringify(body)) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    // Abort and DNS/socket failures both land here; to the person holding
    // the phone they are the same thing.
    throw OFFLINE();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call the API. Authenticated by default; `auth: false` for the public feed.
 * A 401 is retried once with a freshly minted token — an ID token lives an
 * hour and the app can sit in the background for longer than that.
 */
export async function api(path, { method = 'GET', body, auth: needsAuth = true, timeout, _retried } = {}) {
  const token = needsAuth ? await idToken(!!_retried) : null;
  const res = await send(path, { method, body, token, timeout });

  if (res.status === 401 && needsAuth && !_retried) {
    return api(path, { method, body, auth: needsAuth, timeout, _retried: true });
  }

  if (!res.ok) {
    // Vercel's DDoS mitigation answers with an HTML challenge page that only
    // a browser can pass. Nothing is wrong with the request — the server is
    // simply not letting anyone through right now.
    if (res.headers?.get?.('x-vercel-mitigated')) {
      throw new ApiError('mitigated', 'Сервер сейчас не отвечает. Попробуй через минуту.', res.status);
    }
    let payload = null;
    try { payload = await res.json(); } catch (e) { /* HTML error page */ }
    const code = payload?.error || `http_${res.status}`;
    const message = payload?.message || MESSAGES[code] || 'Что-то пошло не так. Попробуй ещё раз.';
    throw new ApiError(code, message, res.status);
  }

  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
}

/** True when the failure was the network, not the server's answer. */
export const isOffline = (e) => e instanceof ApiError && e.code === 'offline';
