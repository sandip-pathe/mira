import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { getAuthenticatedSession, requestWithRenewal } from '../../../../shared/api';
import {
  ContinueItem,
  getContinueKind,
  isSupportedContinueCatalogVersion,
  loadContinueItems,
  removeContinueItem,
  saveContinueItem,
  updateContinueItem,
} from '../../../../shared/interventions';
import type { Rating } from '../components/ActivityOutcome';
import { canonicalActivityId } from '../../../../shared/activityRegistry';
import { getBundledIntervention } from '../../data/catalog';
import {
  createLocalActivityRun,
  finishLocalActivityRun,
  type LocalActivityRun,
} from '../../runtime/activityEngine';
import { saveActivityPreference } from '../../../actions/data/preferenceRepository';
import { storageErrorMessage } from '../../../../shared/storage/database';

export function useInterventionRun({
  id,
  origin = 'talk',
  continueItemId,
}: {
  id: string;
  origin?: 'talk' | 'actions_library' | 'actions_continue';
  continueItemId?: string;
}) {
  const [clientRunId] = useState(randomUUID);
  const [intervention] = useState(() => getBundledIntervention(id));
  const activeId = intervention?.id ?? '';
  const [run, setRun] = useState<LocalActivityRun>();
  const activeRun = useRef<LocalActivityRun | undefined>(undefined);
  const [status, setStatus] = useState(() => {
    if (!intervention)
      return 'This activity link is invalid or no longer supported. Return to where you came from.';
    if (origin === 'actions_continue')
      return continueItemId
        ? 'Loading saved activity...'
        : 'This saved activity link is incomplete. Your saved items are still available in Continue.';
    return `Ready when you are. Start, skip, or return to ${origin === 'talk' ? 'Talk' : 'Actions'}.`;
  });
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const [groups, setGroups] = useState<{
    now: string[];
    later: string[];
    ignore: string[];
  }>();
  const [tinyStep, setTinyStep] = useState('');
  const [smallStepMode, setSmallStepMode] = useState<'many' | 'known'>();
  const [taskSlips, setTaskSlips] = useState<
    { id: string; text: string; bucket: 'now' | 'later' | 'not_now' }[]
  >([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [smallStepCue, setSmallStepCue] = useState('');
  const [reflection, setReflection] = useState('');
  const [groundingCounts, setGroundingCounts] = useState([0, 0, 0]);
  const [groundingSkipped, setGroundingSkipped] = useState([false, false, false]);
  const [groundingSummary, setGroundingSummary] = useState('');
  const [rating, setRating] = useState<Rating>();
  const [tried, setTried] = useState<boolean>();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'active' | 'paused' | 'outcome'>(
    intervention && origin !== 'actions_continue' ? 'ready' : 'loading',
  );
  const finished = phase === 'outcome';
  const readyToStart = phase === 'ready';
  const [seconds, setSeconds] = useState(
    intervention?.presentation.optional_timer ? intervention.duration_seconds : 0,
  );
  const [timerState, setTimerState] = useState<'idle' | 'running' | 'paused'>('idle');
  const timerRunning = timerState === 'running';
  const timerPaused = timerState === 'paused';
  const [reuse, setReuse] = useState<boolean>();
  const [saved, setSaved] = useState<boolean>();
  const [feedbackStatus, setFeedbackStatus] = useState('');
  const [feedbackRetry, setFeedbackRetry] = useState(false);
  const [continueItem, setContinueItem] = useState<ContinueItem>();
  const [continueSaved, setContinueSaved] = useState(false);
  const [continueCompletionPending, setContinueCompletionPending] = useState(false);
  const [localStatus, setLocalStatus] = useState('');
  const operationPending = useRef(false);
  const talkAutoStartAttempted = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (origin !== 'actions_continue' || !continueItemId || !intervention) return;
    let current = true;
    void loadContinueItems()
      .then((items) => {
        if (!current) return;
        const item = items.find((value) => value.id === continueItemId);
        if (
          !item ||
          !isSupportedContinueCatalogVersion(item.catalog_version) ||
          canonicalActivityId(item.intervention_id) !== activeId ||
          item.kind !== getContinueKind(activeId) ||
          !Number.isInteger(item.schema_version) ||
          item.schema_version < 0 ||
          item.schema_version > 2
        ) {
          setStatus(
            'This saved item is invalid or needs a different app version. It remains in Continue.',
          );
          return;
        }
        setContinueItem(item);
        setContinueSaved(true);
        if (item.kind === 'next_step' || item.kind === 'one_small_step') setTinyStep(item.content);
        else setDraft(item.content);
        if (item.kind === 'one_small_step') {
          setSelectedTask(item.source_task ?? '');
          setSmallStepCue(item.cue ?? '');
          setStep(3);
        }
        if (intervention.presentation.pattern === 'sort') {
          setGroups({ now: [item.content], later: [], ignore: [] });
        }
        const created = createLocalActivityRun(clientRunId, activeId);
        activeRun.current = created;
        setRun(created);
        setPhase('active');
        setStatus('Your saved item is ready. Continue at your own pace.');
      })
      .catch((error) => {
        if (current)
          setStatus(
            storageErrorMessage(
              error,
              'This saved item could not be opened. Return to Continue and try again.',
            ),
          );
      });
    return () => {
      current = false;
    };
  }, [activeId, clientRunId, continueItemId, intervention, origin]);

  const startActivity = useCallback(() => {
    if (phase !== 'ready' || busy || operationPending.current || !intervention || activeRun.current)
      return;
    const created = createLocalActivityRun(clientRunId, activeId);
    activeRun.current = created;
    setRun(created);
    setPhase('active');
    setStatus('Started. Stop whenever you like.');
  }, [phase, busy, intervention, clientRunId, activeId]);

  useEffect(() => {
    if (
      origin !== 'talk' ||
      phase !== 'ready' ||
      ['paced_breathing', 'reach_out', 'short_movement', 'one_song_break'].includes(
        canonicalActivityId(id) ?? '',
      ) ||
      talkAutoStartAttempted.current
    )
      return;
    talkAutoStartAttempted.current = true;
    void startActivity();
  }, [id, origin, phase, startActivity]);

  async function finishRun(next: Exclude<LocalActivityRun['state'], 'started'>) {
    const current = activeRun.current;
    if (
      !current ||
      current.state !== 'started' ||
      busy ||
      operationPending.current ||
      (phase !== 'active' && phase !== 'paused')
    )
      return;
    operationPending.current = true;
    const completed = finishLocalActivityRun(current, next);
    activeRun.current = completed;
    setRun(completed);
    setBusy(true);
    setTimerState('idle');
    try {
      if (continueItem && origin === 'actions_continue' && next === 'completed') {
        setContinueCompletionPending(true);
      } else if (continueItem && activeId !== 'brain_dump') {
        try {
          const updated = await updateContinueItem(continueItem.id, {
            content:
              continueItem.kind === 'short_movement'
                ? continueItem.content
                : continueItem.kind === 'next_step' || continueItem.kind === 'one_small_step'
                  ? tinyStep
                  : draft,
            ...(continueItem.kind === 'one_small_step'
              ? { source_task: selectedTask, cue: smallStepCue }
              : {}),
          });
          if (!updated) throw new Error('Saved item no longer exists.');
        } catch {
          if (mounted.current)
            setLocalStatus(
              'Your latest changes could not be saved. The earlier Continue item remains available.',
            );
        }
      }
      if (!mounted.current) return;
      setTried(undefined);
      setPhase('outcome');
      setStatus('How did this go?');
    } finally {
      operationPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function keepInActions(content: string, details?: { source_task?: string; cue?: string }) {
    if (
      !intervention ||
      !content.trim() ||
      !getContinueKind(intervention.id) ||
      busy ||
      operationPending.current
    )
      return;
    operationPending.current = true;
    setBusy(true);
    setLocalStatus('');
    try {
      if (continueItem) {
        const updated = await updateContinueItem(continueItem.id, {
          content: content.trim(),
          ...details,
        });
        if (!updated) throw new Error('Saved item no longer exists.');
        setContinueItem({ ...continueItem, content: content.trim(), ...details });
      } else {
        const item = await saveContinueItem(intervention, content, clientRunId, details);
        setContinueItem(item);
      }
      setContinueSaved(true);
      setLocalStatus('Saved on this device in Actions > Continue.');
    } catch (error) {
      setLocalStatus(
        storageErrorMessage(error, 'This item was not saved. Check device storage and try again.'),
      );
    } finally {
      operationPending.current = false;
      setBusy(false);
    }
  }

  function confirmKeepInActions(
    content: string,
    details?: { source_task?: string; cue?: string },
    confirmation?: { title: string; message: string; confirmLabel: string },
  ) {
    if (!intervention || !content.trim()) return;
    const isExisting = !!continueItem;
    Alert.alert(
      confirmation?.title ?? (isExisting ? 'Update this Actions item?' : 'Keep this in Actions?'),
      confirmation?.message ??
        [
          details?.source_task ? `Task: ${details.source_task}` : '',
          `First move: ${content.trim()}`,
          details?.cue ? `When: ${details.cue}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: confirmation?.confirmLabel ?? (isExisting ? 'Update item' : 'Keep in Actions'),
          onPress: () => void keepInActions(content, details),
        },
      ],
    );
  }

  function pauseActivity() {
    if (phase !== 'active' || activeRun.current?.state !== 'started') return;
    setPhase('paused');
    if (seconds > 0) setTimerState('paused');
    setStatus('Paused. Continue when you are ready.');
  }

  function resumeActivity() {
    if (phase !== 'paused' || activeRun.current?.state !== 'started') return;
    setPhase('active');
    setStatus('Activity resumed.');
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && timerRunning) {
        setTimerState('paused');
        setStatus('Timer paused while Mira was in the background.');
      }
    });
    return () => subscription.remove();
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerPaused || seconds <= 0) return;
    const timer = setTimeout(() => {
      if (seconds <= 1) {
        setSeconds(0);
        setTimerState('idle');
        setStatus('Timer ended. Check in when you are ready.');
      } else setSeconds((value) => value - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds, timerPaused, timerRunning]);

  async function organize() {
    if (busy || operationPending.current) return;
    const items = draft
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length || items.length > 30) {
      setStatus('Add 1-30 short lines first.');
      return;
    }
    operationPending.current = true;
    setBusy(true);
    setStatus('Sorting your list...');
    try {
      const session = await getAuthenticatedSession();
      const result = await requestWithRenewal<{
        now: string[];
        later: string[];
        ignore: string[];
      }>(`/workers/task-reset/organize`, session, {
        items,
      });
      setGroups(result);
      setStatus('These are suggestions. Edit anything that feels misplaced.');
    } catch {
      setGroups({ now: items, later: [], ignore: [] });
      setStatus('Sorting is unavailable. Your original list is here; you can sort it yourself.');
    } finally {
      operationPending.current = false;
      setBusy(false);
    }
  }

  function move(
    item: string,
    source: 'now' | 'later' | 'ignore',
    target: 'now' | 'later' | 'ignore',
  ) {
    setGroups((current) => {
      if (!current || source === target) return current;
      const index = current[source].indexOf(item);
      if (index < 0) return current;
      return {
        ...current,
        [source]: current[source].filter((_, at) => at !== index),
        [target]: [...current[target], item],
      };
    });
  }

  async function savePreference(allow: boolean) {
    if (
      !run ||
      run.state === 'started' ||
      !rating ||
      saved === true ||
      busy ||
      operationPending.current
    )
      return;
    operationPending.current = true;
    setBusy(true);
    setReuse(allow);
    try {
      if (!allow) {
        await resolveCompletedContinue();
        setSaved(true);
        setFeedbackRetry(false);
        setFeedbackStatus('No preference was saved. Your answer stays in this session.');
        return;
      }
      const result = await saveActivityPreference(
        run,
        rating,
        `Mira may suggest ${intervention?.title ?? activeId} again in a similar moment.`,
      );
      if (!mounted.current) return;
      setSaved(true);
      setFeedbackRetry(false);
      setFeedbackStatus(
        result.reuse_context
          ? 'Preference saved on this device. You can review or remove it in Journal.'
          : 'This preference was previously changed. You can review it in Journal.',
      );
      await resolveCompletedContinue();
    } catch (error) {
      if (!mounted.current) return;
      setFeedbackRetry(true);
      setFeedbackStatus(
        storageErrorMessage(
          error,
          'This preference was not saved. Check device storage and try again.',
        ),
      );
    } finally {
      operationPending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function resolveCompletedContinue() {
    if (!continueItem || !continueCompletionPending) return true;
    try {
      await removeContinueItem(continueItem.id);
      setContinueItem(undefined);
      setContinueSaved(false);
      setContinueCompletionPending(false);
      return true;
    } catch {
      setLocalStatus('Activity finished, but this item could not be removed from Continue yet.');
      return false;
    }
  }

  return {
    pauseActivity,
    resumeActivity,
    intervention,
    activeId,
    run,
    status,
    busy,
    step,
    setStep,
    draft,
    setDraft,
    groups,
    setGroups,
    tinyStep,
    setTinyStep,
    smallStepMode,
    setSmallStepMode,
    taskSlips,
    setTaskSlips,
    selectedTask,
    setSelectedTask,
    smallStepCue,
    setSmallStepCue,
    reflection,
    setReflection,
    groundingCounts,
    setGroundingCounts,
    groundingSkipped,
    setGroundingSkipped,
    groundingSummary,
    setGroundingSummary,
    rating,
    setRating,
    tried,
    setTried,
    phase,
    setPhase,
    finished,
    readyToStart,
    seconds,
    setSeconds,
    timerRunning,
    timerPaused,
    setTimerState,
    reuse,
    setReuse,
    saved,
    feedbackStatus,
    feedbackRetry,
    continueSaved,
    clientRunId,
    localStatus,
    startActivity,
    finishRun,
    confirmKeepInActions,
    organize,
    move,
    savePreference,
    resolveCompletedContinue,
  };
}

