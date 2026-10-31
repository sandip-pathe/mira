import type { Message } from '../../shared/api';
import { firebaseAuth } from '../../shared/firebase';
import { getContextSnapshot } from '../../shared/context/contextService';
import { currentContextRevision } from '../../shared/context/contextRepository';

type SharedExcerpt = { source_type: 'journal' | 'action' | 'feedback'; label: string; excerpt: string };
export type CallContext = {
  context_version: 1; person_name: string; consent_revision: number;
  recent_messages: Message[];
  shared_excerpts: SharedExcerpt[];
  saved_preferences: { intervention_id: string; rating: string; preference: string }[];
};
let recent: { userId: string; messages: Message[] } | undefined;
const clip = (value: string, limit: number) => Array.from(value).slice(0, limit).join('');

/** In-process confirmed Talk history only. Never reads a Journal entry or draft. */
export function updateCallConversation(userId: string, messages: Message[]) {
  recent = { userId, messages: messages.slice(-6).map(message => ({
    role: message.role, content: clip(message.content, 800),
  })) };
}
export function clearCallConversation() { recent = undefined; }

export async function prepareCallContext(userId: string): Promise<CallContext> {
  if (firebaseAuth.currentUser?.uid !== userId) throw new Error('Sign in again before calling.');
  const messages = recent?.userId === userId ? recent.messages.map(message => ({ ...message })) : [];
  const query = [...messages].reverse().find(message => message.role === 'user')?.content ?? '';
  const selected = await getContextSnapshot('call', query);
  const revision = await currentContextRevision();
  if (firebaseAuth.currentUser?.uid !== userId) throw new Error('Sign in again before calling.');
  const current = selected.revision === revision;
  return {
    context_version: 1,
    person_name: clip((firebaseAuth.currentUser.displayName ?? '').trim(), 80),
    consent_revision: revision,
    recent_messages: messages,
    shared_excerpts: current ? selected.matches.filter(match => match.scope === 'shared_context' || match.scope === 'reuse_preference')
      .slice(0, 1).map(match => ({ source_type: match.source_type, label: clip(match.label ?? 'Shared excerpt', 80), excerpt: clip(match.excerpt, 600) })) : [],
    saved_preferences: current ? selected.preferences.slice(0, 3).map(preference => ({
      intervention_id: clip(preference.intervention_id, 64), rating: clip(preference.rating, 24), preference: clip(preference.preference, 240),
    })) : [],
  };
}

export async function isCallContextCurrent(userId: string, revision: number) {
  const currentRevision = await currentContextRevision();
  return firebaseAuth.currentUser?.uid === userId && currentRevision === revision;
}
