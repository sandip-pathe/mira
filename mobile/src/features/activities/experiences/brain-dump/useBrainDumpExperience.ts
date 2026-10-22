import React from 'react';
import { randomUUID } from 'expo-crypto';
import {
  getContinueKind,
  isSupportedContinueCatalogVersion,
  loadContinueItems,
  type ContinueItem,
} from '../../../../shared/interventions';
import { canonicalActivityId } from '../../../../shared/activityRegistry';
import { storageErrorMessage } from '../../../../shared/storage/database';
import {
  createLocalActivityRun,
  finishLocalActivityRun,
  type LocalActivityRun,
} from '../../runtime/activityEngine';
import type { ActivityFinishState, ActivityOrigin } from '../../runtime/contracts';

export type BrainDumpPhase = 'loading' | 'ready' | 'active' | 'error' | 'finished';

export function useBrainDumpExperience({
  origin,
  continueItemId,
}: {
  origin: ActivityOrigin;
  continueItemId?: string;
}) {
  const [clientRunId] = React.useState(() => randomUUID());
  const [initialRun] = React.useState<LocalActivityRun | undefined>(() =>
    origin === 'talk' ? createLocalActivityRun(clientRunId, 'brain_dump') : undefined,
  );
  const [run, setRun] = React.useState<LocalActivityRun | undefined>(initialRun);
  const activeRun = React.useRef(initialRun);
  const [phase, setPhase] = React.useState<BrainDumpPhase>(() =>
    origin === 'talk' ? 'active' : origin === 'actions_continue' ? continueItemId ? 'loading' : 'error' : 'ready',
  );
  const [draft, setDraft] = React.useState('');
  const [status, setStatus] = React.useState(() =>
    origin === 'actions_continue' && !continueItemId
      ? 'This saved activity link is incomplete. Your saved items are still available in Continue.'
      : '',
  );
  const [continueItem, setContinueItem] = React.useState<ContinueItem>();

  React.useEffect(() => {
    if (origin !== 'actions_continue') return;
    if (!continueItemId) return;
    let current = true;
    void loadContinueItems()
      .then((items) => {
        if (!current) return;
        const item = items.find((value) => value.id === continueItemId);
        if (
          !item ||
          !isSupportedContinueCatalogVersion(item.catalog_version) ||
          canonicalActivityId(item.intervention_id) !== 'brain_dump' ||
          item.kind !== getContinueKind('brain_dump') ||
          !Number.isInteger(item.schema_version) ||
          item.schema_version < 0 ||
          item.schema_version > 2
        ) {
          setStatus('This saved item is invalid or needs a different app version. It remains in Continue.');
          setPhase('error');
          return;
        }
        setContinueItem(item);
        setDraft(item.content);
        const created = createLocalActivityRun(clientRunId, 'brain_dump');
        activeRun.current = created;
        setRun(created);
        setStatus('Your saved writing is ready. Continue at your own pace.');
        setPhase('active');
      })
      .catch((error) => {
        if (!current) return;
        setStatus(
          storageErrorMessage(error, 'This saved item could not be opened. Return to Continue and try again.'),
        );
        setPhase('error');
      });
    return () => {
      current = false;
    };
  }, [clientRunId, continueItemId, origin]);

  const start = React.useCallback(() => {
    if (phase !== 'ready' || activeRun.current) return;
    const created = createLocalActivityRun(clientRunId, 'brain_dump');
    activeRun.current = created;
    setRun(created);
    setStatus('Started. Stop whenever you like.');
    setPhase('active');
  }, [clientRunId, phase]);

  const finish = React.useCallback((next: ActivityFinishState) => {
    const current = activeRun.current;
    if (!current || current.state !== 'started') return;
    const finished = finishLocalActivityRun(current, next);
    activeRun.current = finished;
    setRun(finished);
    setPhase('finished');
  }, []);

  return {
    clientRunId,
    run,
    phase,
    draft,
    setDraft,
    status,
    continueItem,
    start,
    finish,
  };
}
