import Constants from 'expo-constants';
import { firebaseAuth } from './firebase';

export type AuthenticatedSession = { userId: string; token: string; expiresAt: number };
export type Message = { role: 'user' | 'assistant'; content: string };

let activeSession: AuthenticatedSession | undefined;
let creatingSession: Promise<AuthenticatedSession> | undefined;

function resolveApiOrigin() {
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
  const configured = Constants.expoConfig?.extra?.apiUrl;
  return (typeof configured === 'string' && configured.trim())
    || process.env.EXPO_PUBLIC_API_URL
    || '';
}

export const API_URL = resolveApiOrigin().replace(/\/$/, '');

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
  if (!API_URL) throw new ApiError(0, 'Server URL is not configured for this build.');
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const response = await fetch(API_URL + path, {
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
