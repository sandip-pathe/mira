import Constants from 'expo-constants';
import { firebaseAuth } from './firebase';

export type AuthenticatedSession = { userId: string; token: string; expiresAt: number };
export type Message = { role: 'user' | 'assistant'; content: string };

let activeSession: AuthenticatedSession | undefined;
let creatingSession: Promise<AuthenticatedSession> | undefined;

const API_CONFIG_TTL_MS = 30_000;
const API_CONFIG_TIMEOUT_MS = 4_000;
const API_CONFIG_URL = (
  Constants.expoConfig?.extra?.apiConfigUrl
  || process.env.EXPO_PUBLIC_API_CONFIG_URL
  || ''
).trim();

function resolveBundledApiOrigin() {
  const configured = (
    Constants.expoConfig?.extra?.apiUrl
    || process.env.EXPO_PUBLIC_API_URL
    || ''
  ).trim();
  if (configured) return configured.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split('/')[0].replace(/:\d+$/, '');
    if (
      host.endsWith('.exp.direct') ||
      host.endsWith('.ngrok.io') ||
      host.endsWith('.ngrok-free.app')
    )
      return `https://${host}`;
    return `http://${host}:8000`;
  }
  return '';
}

function normalizeRemoteApiOrigin(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
      return undefined;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return undefined;
  }
}

let cachedApiOrigin: { value: string; expiresAt: number } | undefined;
let resolvingApiOrigin: Promise<string> | undefined;

async function resolveApiOrigin(): Promise<string> {
  const now = Date.now();
  if (cachedApiOrigin && now < cachedApiOrigin.expiresAt) return cachedApiOrigin.value;
  if (resolvingApiOrigin) return resolvingApiOrigin;

  resolvingApiOrigin = (async () => {
    const fallback = resolveBundledApiOrigin();
    if (!API_CONFIG_URL) return fallback;

    try {
      const separator = API_CONFIG_URL.includes('?') ? '&' : '?';
      const response = await fetch(`${API_CONFIG_URL}${separator}_=${now}`, {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(API_CONFIG_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error('Backend configuration is unavailable');
      const config = await response.json() as { apiUrl?: unknown };
      const remoteOrigin = normalizeRemoteApiOrigin(config.apiUrl);
      if (remoteOrigin) {
        cachedApiOrigin = { value: remoteOrigin, expiresAt: now + API_CONFIG_TTL_MS };
        return remoteOrigin;
      }
    } catch {
      // Keep using the last known endpoint or bundled fallback when offline.
    }

    const origin = cachedApiOrigin?.value || fallback;
    cachedApiOrigin = { value: origin, expiresAt: now + API_CONFIG_TTL_MS };
    return origin;
  })();

  try {
    return await resolvingApiOrigin;
  } finally {
    resolvingApiOrigin = undefined;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T>(
  path: string,
  session?: AuthenticatedSession,
  body?: unknown,
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options?: { signal?: AbortSignal },
): Promise<T> {
  const apiOrigin = await resolveApiOrigin();
  if (!apiOrigin) throw new ApiError(0, 'No server URL is available. Check your connection and backend configuration.');
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const response = await fetch(apiOrigin + path, {
    method: verb,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: options?.signal ?? AbortSignal.timeout(50000),
  });
  if (!response.ok) {
    let reviewerError: string | undefined;
    if ([402, 403, 429, 503].includes(response.status)) {
      try {
        const payload = await response.clone().json() as { detail?: string | { code?: string; reset_at?: string } };
        const detail = payload.detail;
        const code = typeof detail === 'string' ? detail : detail?.code;
        const retryAt = typeof detail === 'object' && detail?.reset_at
          ? new Date(detail.reset_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          : undefined;
        reviewerError = code === 'reviewer_access_expired'
          ? 'Mira reviewer access has ended. Contact the submission owner.'
          : code === 'reviewer_access_denied'
            ? 'This account does not have Mira reviewer access. Contact the submission owner.'
            : code === 'review_budget_exhausted'
              ? 'The shared $20 OpenAI review budget cannot cover this request. Contact the submission owner if you need more access.'
              : code === 'daily_allowance_reached'
                ? `Today's AI allowance is used up.${retryAt ? ` It resets after ${retryAt}.` : ''}`
                : code === 'bolna_daily_allowance_reached'
                  ? `Today's call allowance is used up.${retryAt ? ` It resets after ${retryAt}.` : ''}`
                  : code === 'call_cooldown'
                    ? `Please wait before starting another call.${retryAt ? ` Try again after ${retryAt}.` : ''}`
                    : code === 'paid_operations_paused'
                      ? 'Mira has paused new paid features. Your Journal and saved Actions are still available.'
                      : code === 'direct_openai_voice_paused'
                        ? 'Live Talk voice is paused during review. Use text Talk or Call Mira instead.'
                        : undefined;
      } catch {
        // Keep the standard response below if the server did not return JSON.
      }
    }
    const message = response.status === 401
      ? 'Sign-in expired. Reconnect to continue.'
      : reviewerError ?? (response.status === 403
        ? 'Mira reviewer access is unavailable. Contact the submission owner.'
        : response.status === 503
          ? 'Mira is temporarily offline.'
          : 'Request failed. Try again.');
    throw new ApiError(response.status, message);
  }
  return response.json();
}

async function createAuthenticatedSession(forceRefresh = false): Promise<AuthenticatedSession> {
  const user = firebaseAuth.currentUser;
  if (!user) throw new ApiError(401, 'Sign in to connect to Mira.');
  const tokenResult = await user.getIdTokenResult(forceRefresh);
  return {
    userId: user.uid,
    token: tokenResult.token,
    expiresAt: Date.parse(tokenResult.expirationTime) / 1000,
  };
}

export async function getAuthenticatedSession(): Promise<AuthenticatedSession> {
  const userId = firebaseAuth.currentUser?.uid;
  if (!userId) throw new ApiError(401, 'Sign in to connect to Mira.');
  if (activeSession?.userId !== userId || activeSession.expiresAt <= Date.now() / 1000 + 30) {
    if (!creatingSession) {
      creatingSession = createAuthenticatedSession()
        .then((value) => {
          activeSession = value;
          return value;
        })
        .finally(() => {
          creatingSession = undefined;
        });
    }
    return creatingSession;
  }
  return activeSession;
}

/** Force-refresh the signed-in user's Firebase ID token after a confirmed 401. */
export async function renewAuthenticatedSession(rejected: AuthenticatedSession): Promise<AuthenticatedSession> {
  const user = firebaseAuth.currentUser;
  if (!user || user.uid !== rejected.userId) throw new ApiError(401, 'Sign in to connect to Mira.');
  if (activeSession?.userId === rejected.userId && activeSession.token !== rejected.token &&
      activeSession.expiresAt > Date.now() / 1000 + 30) return activeSession;
  if (!creatingSession) {
    creatingSession = createAuthenticatedSession(true)
      .then((value) => {
        activeSession = value;
        return value;
      })
      .finally(() => {
        creatingSession = undefined;
      });
  }
  return creatingSession;
}

export async function requestWithRenewal<T>(
  path: string,
  session: AuthenticatedSession,
  body?: unknown,
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options?: { signal?: AbortSignal },
): Promise<T> {
  try {
    return await request<T>(path, session, body, method, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || options?.signal?.aborted) throw error;
    const renewed = await renewAuthenticatedSession(session);
    return request<T>(path, renewed, body, method, options);
  }
}
