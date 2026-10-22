import React from 'react';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import { consumeReachOutContext } from '../../../../shared/reachOutContextHandoff';
import { deleteReachOutDraft, loadReachOutDraft, loadReachOutDrafts, saveReachOutDraft, type ReachOutDraft } from '../../../../shared/reachOutDrafts';
import { requestActivityAssistance, type ReachOutTone, type ReachOutRewriteRequest } from '../../assistance/assistanceClient';
import type { ActivityOrigin } from '../../runtime/contracts';
import { localToneVariant, type ReachOutIntent } from './reachOutToneVariants';

export type ReachOutScreen = 'loading' | 'home' | 'intent' | 'editor' | 'preview';

export function useReachOutExperience({ origin, contextId, draftId }: { origin: ActivityOrigin; contextId?: string; draftId?: string }) {
  const [clientRunId] = React.useState(() => randomUUID());
  const [screen, setScreen] = React.useState<ReachOutScreen>(draftId ? 'loading' : origin === 'talk' ? 'intent' : 'loading');
  const [savedDrafts, setSavedDrafts] = React.useState<ReachOutDraft[]>([]);
  const [savedDraftId, setSavedDraftId] = React.useState<string>();
  const [intent, setIntent] = React.useState<ReachOutIntent>('listen');
  const [tone, setTone] = React.useState<ReachOutTone>('casual');
  const [message, setMessageState] = React.useState('');
  const [contextAvailable, setContextAvailable] = React.useState(false);
  const [contextEnabled, setContextEnabled] = React.useState(false);
  const [context, setContextState] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [rewriting, setRewriting] = React.useState(false);
  const [originalMessage, setOriginalMessage] = React.useState('');
  const sourceRevision = React.useRef(0);
  const requestGeneration = React.useRef(0);
  const controller = React.useRef<AbortController | undefined>(undefined);

  const cancelRewrite = React.useCallback(() => {
    requestGeneration.current += 1;
    controller.current?.abort(); controller.current = undefined; setRewriting(false);
  }, []);
  useFocusEffect(React.useCallback(() => () => cancelRewrite(), [cancelRewrite]));

  React.useEffect(() => {
    if (contextId) {
      const received = consumeReachOutContext(contextId);
      if (received) {
        const timer = setTimeout(() => { setContextState(received); setContextAvailable(true); }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [contextId]);

  React.useEffect(() => {
    let current = true;
    void loadReachOutDrafts().then(async (items) => {
      if (!current) return;
      setSavedDrafts(items);
      if (draftId) {
        const saved = await loadReachOutDraft(draftId);
        if (!current) return;
        if (!saved) { setStatus('This saved draft is no longer available.'); setScreen('home'); return; }
        setSavedDraftId(saved.id); setMessageState(saved.message); setIntent((saved.intent as ReachOutIntent) || 'listen'); setTone((saved.tone as ReachOutTone) || 'casual'); setOriginalMessage(saved.message); setScreen('preview');
      } else if (origin !== 'talk') setScreen('home');
    }).catch(() => { if (current) { setStatus('Saved drafts could not be loaded. You can still write a message.'); if (origin !== 'talk') setScreen('home'); } });
    return () => { current = false; };
  }, [draftId, origin]);

  function startIntent(next: ReachOutIntent) {
    cancelRewrite();
    setIntent(next); setTone('casual'); setSavedDraftId(undefined); setOriginalMessage('');
    setMessageState(next === 'own' ? '' : localToneVariant(next, 'casual', '')); setStatus(''); setScreen('editor');
  }
  function setMessage(value: string) { setMessageState(value.slice(0, 2000)); setOriginalMessage(''); sourceRevision.current += 1; cancelRewrite(); }
  function setContext(value: string) { setContextState(value.slice(0, 2400)); sourceRevision.current += 1; cancelRewrite(); }
  function applyTone(next: ReachOutTone) { if (next === tone) return; setTone(next); setMessageState(localToneVariant(intent, next, message)); sourceRevision.current += 1; cancelRewrite(); }
  function toggleContext(value: boolean) { if (!value) cancelRewrite(); setContextEnabled(value); }
  function goPreview() { if (message.trim()) { cancelRewrite(); setOriginalMessage(''); setScreen('preview'); } }
  function editMessage() { cancelRewrite(); setScreen('editor'); }
  function restoreOriginal() { if (originalMessage) { cancelRewrite(); sourceRevision.current += 1; setMessageState(originalMessage); setOriginalMessage(''); setStatus('Restored your original wording.'); } }

  async function suggestWithContext() {
    const messageDraft = message.trim(); const contextText = context.trim();
    if (!messageDraft || !contextEnabled || !contextText || rewriting) return;
    cancelRewrite();
    const abortController = new AbortController(); controller.current = abortController;
    const requestId = randomUUID(); const generation = ++requestGeneration.current; const revision = sourceRevision.current;
    const request: ReachOutRewriteRequest = { contract_version: 1, request_id: requestId, activity_run_id: clientRunId, source_revision: revision,
      source_text: messageDraft, operation: 'reach_out_rewrite', context: contextText, tone };
    setRewriting(true); setStatus(''); setOriginalMessage(messageDraft);
    try {
      const response = await requestActivityAssistance(request, abortController.signal);
      if (abortController.signal.aborted || generation !== requestGeneration.current || revision !== sourceRevision.current || response.operation !== 'reach_out_rewrite' || response.request_id !== requestId) return;
      setMessageState(response.suggested_message); setScreen('preview');
    } catch {
      if (!abortController.signal.aborted && generation === requestGeneration.current) setStatus('The suggestion is unavailable. Your draft and selected context are still here.');
    } finally { if (controller.current === abortController) { controller.current = undefined; setRewriting(false); } }
  }

  async function saveCurrent() {
    if (!message.trim() || busy) return;
    setBusy(true); setStatus('');
    try {
      const item = await saveReachOutDraft({ id: savedDraftId, sourceRunId: clientRunId, message, intent, tone });
      setSavedDraftId(item.id); setSavedDrafts((items) => [item, ...items.filter((saved) => saved.id !== item.id)]); setStatus('Saved privately on this device.');
      return item;
    } catch { setStatus('The message was not saved. Your draft is still here; try again.'); }
    finally { setBusy(false); }
  }
  async function removeDraft(id: string) {
    await deleteReachOutDraft(id); setSavedDrafts((items) => items.filter((item) => item.id !== id));
  }

  return { clientRunId, screen, setScreen, savedDrafts, savedDraftId, intent, tone, message, originalMessage, contextAvailable, contextEnabled, context, status, busy, rewriting,
    setMessage, setContext, startIntent, applyTone, toggleContext, goPreview, editMessage, restoreOriginal, cancelRewrite, suggestWithContext, saveCurrent, removeDraft };
}

export type ReachOutExperience = ReturnType<typeof useReachOutExperience>;
