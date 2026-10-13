import Constants from 'expo-constants';

export type DemoSession = { session_id: string; capability: string; expires_at: number };
export type Message = { role: 'user' | 'assistant'; content: string };

function resolveApiOrigin() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split('/')[0].replace(/:\d+$/, '');
    if (host.endsWith('.exp.direct') || host.endsWith('.ngrok.io') || host.endsWith('.ngrok-free.app')) return `https://${host}`;
    return `http://${host}:8000`;
  }
  return process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
}

export const API_URL = resolveApiOrigin().replace(/\/$/, '');

export async function request<T>(path: string, session?: DemoSession, body?: unknown,
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'): Promise<T> {
  const verb = method ?? (body === undefined ? 'GET' : 'POST');
  const response = await fetch(API_URL + path, {
    method: verb,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(session ? { Authorization: `Bearer ${session.capability}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(50000),
  });
  if (!response.ok) throw new Error(response.status === 401 ? 'Demo session expired. Reconnect to continue.' : response.status === 503 ? 'Mira is temporarily offline.' : 'Request failed. Try again.');
  return response.json();
}

export async function createSession(): Promise<DemoSession> {
  // UUID generation is supplied by expo-crypto, never a timestamp/user identity.
  const { randomUUID } = require('expo-crypto') as typeof import('expo-crypto');
  return request('/sessions', undefined, { session_id: randomUUID() });
}
