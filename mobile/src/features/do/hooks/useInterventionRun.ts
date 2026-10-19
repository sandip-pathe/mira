import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { ApiError, DemoSession, getDemoSession, request } from '../../../shared/api';
import {
  ContinueItem,
  getContinueKind,
  getRememberedIntervention,
  Intervention,
  isSupportedContinueCatalogVersion,
  loadContinueItems,
  rememberIntervention,
  removeContinueItem,
  saveContinueItem,
  updateContinueItem,
} from '../../../shared/interventions';
import { Rating } from '../components/ActivityOutcome';
import {
  activityCapabilities,
  canonicalActivityId,
  isCompatibleActivity,
} from '../../../shared/activityRegistry';

type Run = {
  id: string;
  action_id: string;
  state: 'started' | 'completed' | 'skipped' | 'stopped';
  pendingSync?: boolean;
  session: DemoSession;
};

export function useInterventionRun({
  id,
  origin = 'talk',
  continueItemId,
}: {
  id: string;
  origin?: 'talk' | 'actions_library' | 'actions_continue';
  continueItemId?: string;
}) {
  const clientRunId = useRef(randomUUID()).current;
  const [intervention, setIntervention] = useState<Intervention>();
  const [activeId, setActiveId] = useState('');
  const [run, setRun] = useState<Run>();
  const [status, setStatus] = useState('Loading this activityâ€¦');
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
  const [taskSlips, setTaskSlips] = useState<{ id: string; text: string; bucket: 'now' | 'later' | 'not_now' }[]>([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [smallStepCue, setSmallStepCue] = useState('');
  const [reflection, setReflection] = useState('');
  const [groundingCounts, setGroundingCounts] = useState([0, 0, 0]);
  const [groundingSkipped, setGroundingSkipped] = useState([false, false, false]);
  const [groundingSummary, setGroundingSummary] = useState('');
  const [rating, setRating] = useState<Rating>();
  const [tried, setTried] = useState<boolean>();
  const [phase, setPhase] = useState<'loading' | 'ready' | 'active' | 'paused' | 'outcome'>(
    'loading',
  );
  const finished = phase === 'outcome';
  const readyToStart = phase === 'ready';
  const [seconds, setSeconds] = useState(0);
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
  const latestRun = useRef<{ run?: Run; phase: typeof phase }>({ run, phase });
  latestRun.current = { run, phase };

  const initialize = useCallback(async () => {
    const requestedId = canonicalActivityId(id);
    if (!requestedId) {
      setStatus('This activity link is invalid or no longer supported. Return to where you came from.');
      return;
    }
    if (origin === 'actions_continue' && !continueItemId) {
      setStatus('This saved activity link is incomplete. Your saved items are still available in Continue.');
      return;
    }
    let session: DemoSession | undefined;
    let content: Intervention | undefined = getRememberedIntervention(requestedId);
    try {
      session = await getDemoSession();
      content = await request<Intervention>(
        `/sessions/${session.session_id}/interventions/${requestedId}/activity`,
        session,
      );
      rememberIntervention(content);
    } catch {
      /* Use activity text already loaded by Talk when the service is offline. */
    }
    if (!mounted.current) return;
    if (!content) {
      setStatus('This activity is unavailable. Return to Talk and try again.');
      return;
    }
    if (!isCompatibleActivity(content)) {
      setStatus('This activity needs a compatible app version. Return to where you came from.');
      return;
    }
    setActiveId(content.id);
    setIntervention(content);
    if (
      !content.presentation ||
      !['sort', 'capture', 'steps', 'letter', 'grounding', 'breathing'].includes(content.presentation.pattern) ||
      !content.steps.length
    ) {
      setStatus('This activity needs updated content. Connect to Mira and try again.');
      return;
    }
    setSeconds(content.presentation.optional_timer ? content.duration_seconds : 0);
    if (origin === 'actions_continue' && continueItemId) {
      try {
        const item = (await loadContinueItems()).find((value) => value.id === continueItemId);
        if (
          item &&
          isSupportedContinueCatalogVersion(item.catalog_version) &&
          canonicalActivityId(item.intervention_id) === content.id &&
          item.schema_version <= 2
        ) {
          setContinueItem(item);
          setContinueSaved(true);
          if (item.kind === 'next_step' || item.kind === 'one_small_step') setTinyStep(item.content);
          else setDraft(item.content);
          if (item.kind === 'one_small_step') {
            setSelectedTask(item.source_task ?? '');
            setSmallStepCue(item.cue ?? '');
            setStep(3);
          }
          if (content.presentation.pattern === 'sort')
            setGroups({ now: [item.content], later: [], ignore: [] });
        } else {
          setStatus('This saved item is invalid or needs a different app version. It remains in Continue.');
          return;
        }
      } catch {
        if (!mounted.current) return;
        setLocalStatus('This saved item could not be loaded.');
      }
    }
    if (!mounted.current) return;
    setPhase('ready');
    setStatus(
      `Ready when you are. Start, skip, or return to ${origin === 'talk' ? 'Talk' : 'Actions'}.`,
    );
  }, [id, origin, continueItemId]);

  const startActivity = useCallback(async () => {
    if (phase === 'ready' && !busy && !operationPending.current) {
      operationPending.current = true;
      setBusy(true);
      try {
        const session = await getDemoSession();
        const requestedId = canonicalActivityId(id)!;
        const created = await request<Omit<Run, 'session'>>(
          `/sessions/${session.session_id}/interventions/${requestedId}/start`,
          session,
          {
            consented: true,
            client_run_id: clientRunId,
            client_activity_capabilities: activityCapabilities(),
          },
        );
        if (!mounted.current) {
          await request(
            `/sessions/${session.session_id}/action-runs/${created.id}`,
            session,
            { state: 'stopped' },
            'PATCH',
          ).catch(() => {});
          return;
        }
        setRun({ ...created, session });
        setPhase('active');
        setStatus('Started. Stop whenever you like.');
      } catch {
        if (mounted.current)
          setStatus(
            'Mira could not confirm this activity can start. Check the connection or try again shortly.',
          );
      } finally {
        operationPending.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  }, [phase, busy, id, clientRunId]);

  useEffect(() => {
    if (
      origin !== 'talk' ||
      phase !== 'ready' ||
      ['paced_breathing', 'reach_out', 'short_movement', 'one_song_break'].includes(canonicalActivityId(id) ?? '') ||
      talkAutoStartAttempted.current
    ) return;
    talkAutoStartAttempted.current = true;
    void startActivity();
  }, [id, origin, phase, startActivity]);

  async function finishRun(next: Exclude<Run['state'], 'started'>) {
    if (!run || busy || operationPending.current || (phase !== 'active' && phase !== 'paused'))
      return;
    operationPending.current = true;
    setBusy(true);
    setTimerState('idle');
    let pendingSync = false;
    try {
      const session = run.session;
      await request(
        `/sessions/${session.session_id}/action-runs/${run.id}`,
        session,
        { state: next },
        'PATCH',
      );
    } catch {
      pendingSync = true;
    }
    if (continueItem && origin === 'actions_continue' && next === 'completed') {
      setContinueCompletionPending(true);
    } else if (continueItem && activeId !== 'brain_dump') {
      try {
        const updated = await updateContinueItem(continueItem.id, {
          content: continueItem.kind === 'short_movement'
            ? continueItem.content
            : continueItem.kind === 'next_step'
              ? tinyStep
              : draft,
        });
        if (!updated) throw new Error('Saved item no longer exists.');
      } catch {
        setLocalStatus(
          'Your latest changes could not be saved. The earlier Continue item remains available.',
        );
      }
    }
    setRun({ ...run, state: next, pendingSync });
    setTried(undefined);
    setPhase('outcome');
    setBusy(false);
    operationPending.current = false;
    setStatus(
      pendingSync ? 'This outcome stays in this session. How did this go?' : 'How did this go?',
    );
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
      setLocalStatus('Saved on this device in Actions â†’ Continue.');
    } catch {
      setLocalStatus('This item was not saved. Check device storage and try again.');
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
      confirmation?.message ?? [details?.source_task ? `Task: ${details.source_task}` : '', `First move: ${content.trim()}`, details?.cue ? `When: ${details.cue}` : ''].filter(Boolean).join('\n'),
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
    setPhase('paused');
    if (seconds > 0) setTimerState('paused');
    setStatus('Paused. Continue when you are ready.');
  }

  function resumeActivity() {
    setPhase('active');
    setStatus('Activity resumed.');
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      const current = latestRun.current;
      if (current.run?.state !== 'started' || !['active', 'paused'].includes(current.phase)) return;
      void request(
        `/sessions/${current.run.session.session_id}/action-runs/${current.run.id}`,
        current.run.session,
        { state: 'stopped' },
        'PATCH',
      ).catch(() => {});
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void initialize();
    }, 0);
    return () => clearTimeout(timer);
  }, [initialize]);

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
      setStatus('Add 1â€“30 short lines first.');
      return;
    }
    operationPending.current = true;
    setBusy(true);
    setStatus('Sorting your listâ€¦');
    try {
      const session = run?.session ?? (await getDemoSession());
      const result = await request<{
        now: string[];
        later: string[];
        ignore: string[];
      }>(`/sessions/${session.session_id}/task-reset/organize`, session, {
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
    if (!run || !rating || saved === true || busy || operationPending.current) return;
    operationPending.current = true;
    setBusy(true);
    setReuse(allow);
    try {
      if (!allow) {
        await resolveCompletedContinue();
        if (!run.pendingSync) {
          try {
            const session = run.session;
            await request(`/sessions/${session.session_id}/feedback`, session, {
              action_run_id: run.id,
              rating,
              reuse_context: false,
            });
          } catch {
            /* The answer remains session-only; no preference was saved. */
          }
        }
        setSaved(true);
        setFeedbackRetry(false);
        setFeedbackStatus('No preference was saved. Your answer stays in this session.');
        return;
      }
      const session = run.session;
      if (session.expires_at <= Date.now() / 1000) {
        setFeedbackRetry(false);
        setFeedbackStatus('This session ended. The preference was not saved.');
        setSaved(false);
        return;
      }
      if (run.pendingSync) {
        await request(
          `/sessions/${session.session_id}/action-runs/${run.id}`,
          session,
          { state: run.state },
          'PATCH',
        );
        setRun({ ...run, pendingSync: false });
      }
      const result = await request<{ id: string | null; saved: boolean }>(
        `/sessions/${session.session_id}/feedback`,
        session,
        {
          action_run_id: run.id,
          rating,
          reuse_context: true,
          helpful_lesson: `Mira may suggest ${intervention?.title ?? activeId} again in a similar moment.`,
        },
      );
      setSaved(result.saved);
      setFeedbackRetry(!result.saved);
      setFeedbackStatus(
        result.saved
          ? 'Preference saved. You can review or remove it in You.'
          : 'This preference was not saved. Try again.',
      );
      if (result.saved) await resolveCompletedContinue();
    } catch (error) {
      const unavailableRun =
        error instanceof ApiError && (error.status === 401 || error.status === 409);
      setFeedbackRetry(!unavailableRun);
      if (unavailableRun) setSaved(false);
      setFeedbackStatus(
        unavailableRun
          ? 'This activity session is no longer available for saving. The preference was not saved.'
          : 'Mira is temporarily offline. This preference was not saved. Try again.',
      );
    } finally {
      operationPending.current = false;
      setBusy(false);
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
