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
  if (!response.ok)
    throw new ApiError(
      response.status,
      response.status === 401
        ? 'Sign-in expired. Reconnect to continue.'
        : response.status === 503
          ? 'Mira is temporarily offline.'
          : 'Request failed. Try again.',
    );
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
