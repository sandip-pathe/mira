import React from 'react';
import { randomUUID } from 'expo-crypto';
import { ApiError } from '../../../../shared/api';
import { requestActivityAssistance } from '../../assistance/assistanceClient';
import { discardActivityHandoff, peekActivityHandoff } from '../../../../shared/activityHandoff';
import {
  getContinueKind, isSupportedContinueCatalogVersion, loadContinueItems, removeContinueItem,
  saveContinueItem, type ContinueItem,
} from '../../../../shared/interventions';
import { storageErrorMessage } from '../../../../shared/storage/database';
import { saveAction, type SavedAction, type SavedActionOutcome } from '../../../../shared/savedActions';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import { getBundledActivities } from '../../data/catalog';
import type { ActivityFinishState, ActivityOrigin } from '../../runtime/contracts';

export type OneSmallStepPhase = 'loading' | 'ready' | 'edit' | 'generating' | 'card' | 'trying' | 'checkin' | 'done' | 'error';

export function useOneSmallStepExperience({
  origin, continueItemId, handoffId, onFinish,
}: {
  origin: ActivityOrigin;
  continueItemId?: string;
  handoffId?: string;
  onFinish?: (state: ActivityFinishState) => void;
}) {
  const [handoff] = React.useState(() => handoffId ? peekActivityHandoff(handoffId) : undefined);
  const [runId, setRunId] = React.useState(() => randomUUID());
  const [run, setRun] = React.useState<LocalActivityRun>();
  const [phase, setPhase] = React.useState<OneSmallStepPhase>(
    () => origin === 'actions_continue' ? continueItemId ? 'loading' : 'error' : handoffId ? handoff ? 'edit' : 'error' : 'ready',
  );
  const [task, setTaskState] = React.useState(handoff?.sourceText ?? '');
  const [firstMove, setFirstMove] = React.useState('');
  const [cue, setCue] = React.useState('');
  const [sourceRunId] = React.useState(handoff?.sourceRunId ?? '');
  const [continueItem, setContinueItem] = React.useState<ContinueItem>();
  const [savedAction, setSavedAction] = React.useState<SavedAction>();
  const [outcome, setOutcome] = React.useState<SavedActionOutcome>();
  const [status, setStatus] = React.useState(handoff
    ? 'You can edit this thought into a task before getting a first-move idea.'
    : handoffId && origin !== 'actions_continue'
      ? 'That Brain Dump handoff expired. The original writing is still open behind this screen.'
      : '');
  const [busy, setBusy] = React.useState(false);
  const revision = React.useRef(0);
  const requestController = React.useRef<AbortController | undefined>(undefined);
  const generation = React.useRef(0);
  const activeRun = React.useRef<LocalActivityRun | undefined>(undefined);
  const catalog = React.useMemo(() => getBundledActivities(), []);

  React.useEffect(() => () => requestController.current?.abort(), []);

  React.useEffect(() => {
    if (handoffId) discardActivityHandoff(handoffId);
  }, [handoffId]);

  React.useEffect(() => {
    if (origin !== 'actions_continue' || !continueItemId) return;
    let current = true;
    void loadContinueItems().then((items) => {
      if (!current) return;
      const item = items.find((entry) => entry.id === continueItemId);
      if (!item || !isSupportedContinueCatalogVersion(item.catalog_version) ||
          item.intervention_id !== 'one_small_step' || item.kind !== getContinueKind(item.intervention_id)) {
        setStatus('This saved action is unavailable or needs a different app version. It remains in Continue.');
        setPhase('error');
        return;
      }
      const resumedRunId = item.source_run_id ?? item.id;
      setRunId(resumedRunId);
      const resumedRun = createLocalActivityRun(resumedRunId, 'one_small_step');
      activeRun.current = resumedRun;
      setRun(resumedRun);
      setContinueItem(item);
      setTaskState(item.source_task ?? '');
      setFirstMove(item.content);
      setCue(item.cue ?? '');
      setPhase('card');
    }).catch((error) => {
      if (!current) return;
      setStatus(storageErrorMessage(error, 'This saved action could not be opened. It remains in Continue.'));
      setPhase('error');
    });
    return () => { current = false; };
  }, [continueItemId, handoffId, origin]);

  const setTask = React.useCallback((value: string) => {
    if (value !== task) {
      revision.current++;
      if (phase === 'generating') {
        generation.current++;
        requestController.current?.abort();
        requestController.current = undefined;
        setPhase('edit');
        setStatus('The task changed. Request a new first-move idea when ready.');
      }
    }
    setTaskState(value);
  }, [phase, task]);

  const start = React.useCallback(() => {
    if (activeRun.current) return;
    const created = createLocalActivityRun(runId, 'one_small_step');
    activeRun.current = created;
    setRun(created);
    setPhase('edit');
    setStatus('');
  }, [runId]);

  async function generate() {
    const value = task.trim();
    if (!value || busy) return;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const token = ++generation.current;
    const expectedRevision = revision.current;
    setBusy(true);
    setPhase('generating');
    setStatus('Thinking of one small, specific move…');
    try {
      const response = await requestActivityAssistance({
        contract_version: 1, request_id: randomUUID(), activity_run_id: runId,
        source_revision: expectedRevision, source_text: value, operation: 'shrink_task',
      }, controller.signal);
      if (controller.signal.aborted || token !== generation.current || revision.current !== expectedRevision) return;
      if (response.operation !== 'shrink_task') throw new Error('Unexpected assistance response');
      setFirstMove(response.suggested_step);
      setPhase('card');
      setStatus('This is an idea. Change it until it feels like yours.');
    } catch (error) {
      if (controller.signal.aborted || token !== generation.current) return;
      setPhase('edit');
      setStatus(error instanceof ApiError ? `${error.message} You can write the first move yourself.` : 'A first-move idea is unavailable. You can write one yourself.');
    } finally {
      if (requestController.current === controller) requestController.current = undefined;
      setBusy(false);
    }
  }

  function cancelSuggestion() {
    generation.current++;
    requestController.current?.abort();
    requestController.current = undefined;
    setBusy(false);
    setPhase('edit');
    setStatus('Suggestion cancelled. The task and your writing are still here.');
  }

  function reviewCard() {
    if (!task.trim() || !firstMove.trim()) return;
    if (!activeRun.current) {
      const created = createLocalActivityRun(runId, 'one_small_step');
      activeRun.current = created;
      setRun(created);
    }
    setPhase('card');
    setStatus('This is your action card. Edit it until it feels like yours.');
  }

  function beginTrying() {
    if (!firstMove.trim()) return;
    if (!activeRun.current) {
      const created = createLocalActivityRun(runId, 'one_small_step');
      activeRun.current = created;
      setRun(created);
    }
    setPhase('trying');
    setStatus('Try the move at your own pace.');
  }

  const finishTimer = React.useCallback(() => {
    setPhase('checkin');
    setStatus('');
  }, []);

  function backToCard() {
    setPhase('card');
    setStatus('');
  }

  async function saveCurrentAction(nextOutcome: SavedActionOutcome) {
    if (!task.trim() || !firstMove.trim() || busy) return;
    setBusy(true);
    setStatus('');
    try {
      const saved = await saveAction({ sourceRunId: runId, task: task.trim(), firstMove: firstMove.trim(), cue: cue.trim() || undefined, outcome: nextOutcome });
      setSavedAction(saved);
      setOutcome(nextOutcome);
      setStatus('Saved on this device in Activities > Saved actions.');
      return saved;
    } catch (error) {
      setStatus(storageErrorMessage(error, 'This action could not be saved on this device.'));
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function keepInContinue() {
    if (!task.trim() || !firstMove.trim() || busy) return;
    setBusy(true);
    setStatus('');
    try {
      const intervention = catalog.find((item) => item.id === 'one_small_step');
      if (!intervention || getContinueKind(intervention.id) !== 'one_small_step') throw new Error('Continue is unavailable.');
      const updated = await saveContinueItem(intervention, firstMove.trim(), runId, { source_task: task.trim(), cue: cue.trim() || undefined });
      setContinueItem(updated);
      setStatus('Saved on this device in Activities > Continue.');
    } catch (error) {
      setStatus(storageErrorMessage(error, 'This action could not be saved in Continue.'));
    } finally {
      setBusy(false);
    }
  }

  async function complete(nextOutcome: 'tried' | 'not_tried') {
    const saved = await saveCurrentAction(nextOutcome);
    if (!saved) return;
    if (nextOutcome === 'tried' && continueItem) {
      try {
        await removeContinueItem(continueItem.id);
        setContinueItem(undefined);
      } catch {
        setStatus('Saved as tried, but the older Continue copy could not be removed yet.');
      }
    }
    const current = activeRun.current;
    if (current) {
      const finished = finishLocalActivityRun(current, 'completed');
      activeRun.current = finished;
      setRun(finished);
    }
    setPhase('done');
    onFinish?.('completed');
  }

  return {
    runId, run, phase, task, setTask, firstMove, setFirstMove, cue, setCue, status, setStatus, sourceRunId,
    busy, continueItem, savedAction, outcome, start, generate, beginTrying,
    cancelSuggestion, reviewCard, finishTimer, backToCard, saveCurrentAction, keepInContinue, complete,
  };
}

export type OneSmallStepExperience = ReturnType<typeof useOneSmallStepExperience>;
