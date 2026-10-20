import { getDemoSession, requestWithRenewal } from '../../../shared/api';
import type { JournalMessage } from '../types';

export async function requestJournalFollowUp(messages: JournalMessage[], signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  const timeout = setTimeout(abort, 15000);
  let rejectAbort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    rejectAbort = () => reject(new Error('Journal follow-up cancelled.'));
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
  });
  try {
    if (controller.signal.aborted) throw new Error('Journal follow-up cancelled.');
    const session = await Promise.race([getDemoSession(), cancelled]);
    if (controller.signal.aborted) throw new Error('Journal follow-up cancelled.');
    const history: { role: 'user' | 'assistant'; content: string }[] = [];
    let length = 0;
    for (const message of [...messages].reverse()) {
      if (history.length === 8 || length + message.content.length > 24000) break;
      history.unshift({ role: message.role, content: message.content });
      length += message.content.length;
    }
    return await requestWithRenewal<{ text: string }>(
      `/sessions/${session.session_id}/journal-follow-up`,
      session,
      { messages: history },
      'POST',
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', rejectAbort);
  }
}
