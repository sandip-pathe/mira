export type DemoSession = { session_id: string; capability: string; expires_at: number };
export type Message = { role: 'user' | 'assistant'; content: string };
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function request<T>(path: string, session?: DemoSession, body?: unknown): Promise<T> {
  const response = await fetch(API_URL + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.capability}` } : {}) },
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
