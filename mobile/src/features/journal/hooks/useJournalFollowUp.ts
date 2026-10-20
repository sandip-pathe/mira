import React from 'react';
import { appendJournalFollowUp, getLocalJournal } from '../data/journalRepository';
import { requestJournalFollowUp } from '../data/journalWorker';
import type { JournalDraftSnapshot, LocalJournalSession } from '../types';

export function useJournalFollowUp(
  current: () => JournalDraftSnapshot | undefined,
  apply: (document: LocalJournalSession) => void,
  report: (message: string, error?: boolean) => void,
) {
  const task = React.useRef<
    { controller: AbortController; id: string; revision: number; entryId: string } | undefined
  >(undefined);
  const retry = React.useRef<{ id: string; entryId: string } | undefined>(undefined);
  const [followingUp, setFollowingUp] = React.useState(false);
  const [followUpRetry, setFollowUpRetry] = React.useState(false);

  function cancelFollowUp() {
    task.current?.controller.abort();
    task.current = undefined;
    retry.current = undefined;
    setFollowUpRetry(false);
    setFollowingUp(false);
  }

  React.useEffect(
    () => () => {
      task.current?.controller.abort();
      task.current = undefined;
    },
    [],
  );

  async function runFollowUp(document: LocalJournalSession, entryId: string) {
    cancelFollowUp();
    const active = {
      controller: new AbortController(),
      id: document.id,
      revision: document.revision,
      entryId,
    };
    task.current = active;
    setFollowingUp(true);
    report('Entry saved on this device. Thinking of a follow-up...');
    const matches = () =>
      task.current === active &&
      current()?.id === active.id &&
      current()?.revision === active.revision;
    try {
      const result = await requestJournalFollowUp(document.messages, active.controller.signal);
      if (!matches()) return;
      const updated = await appendJournalFollowUp(
        active.id,
        entryId,
        active.revision,
        result.text,
        matches,
      );
      if (updated && matches()) {
        apply(updated);
        report('Follow-up ready. Your entry is saved on this device.');
      }
    } catch {
      if (matches() && !active.controller.signal.aborted) {
        retry.current = { id: active.id, entryId };
        setFollowUpRetry(true);
        report('Your entry is saved on this device. A follow-up is unavailable right now.');
      }
    } finally {
      if (task.current === active) {
        task.current = undefined;
        setFollowingUp(false);
      }
    }
  }

  async function retryFollowUp() {
    const target = retry.current;
    if (!target || current()?.id !== target.id) return;
    try {
      const document = await getLocalJournal(target.id);
      if (
        document &&
        !document.saved &&
        current()?.id === document.id &&
        current()?.revision === document.revision
      ) {
        await runFollowUp(document, target.entryId);
      }
    } catch {
      report('Your saved entry is unchanged. Reopen it before trying again.', true);
    }
  }

  return { followingUp, followUpRetry, runFollowUp, retryFollowUp, cancelFollowUp };
}
