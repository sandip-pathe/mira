import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { ApiError, DemoSession, getDemoSession, request } from '../../../shared/api';
import {
  ContinueItem,
  getContinueKind,
  getRememberedIntervention,
  Intervention,
  loadContinueItems,
  rememberIntervention,
  removeContinueItem,
  saveContinueItem,
  updateContinueItem,
} from '../../../shared/interventions';
import { Rating } from '../components/ActivityOutcome';

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

  const initialize = useCallback(async () => {
    let session: DemoSession | undefined;
    let content: Intervention | undefined = getRememberedIntervention(id);
    try {
      session = await getDemoSession();
      content = await request<Intervention>(
        `/sessions/${session.session_id}/interventions/${id}/activity`,
        session,
      );
      rememberIntervention(content);
    } catch {
      /* Use activity text already loaded by Talk when the service is offline. */
    }
    if (!content) {
      setStatus('This activity is unavailable. Return to Talk and try again.');
      return;
    }
    setActiveId(content.id);
    setIntervention(content);
    if (
      !content.presentation ||
      !['sort', 'capture', 'steps'].includes(content.presentation.pattern) ||
      !content.steps.length
    ) {
      setStatus('This activity needs updated content. Connect to Mira and try again.');
      return;
    }
    setSeconds(content.presentation.optional_timer ? content.duration_seconds : 0);
    if (origin === 'actions_continue' && continueItemId) {
      try {
        const item = (await loadContinueItems()).find((value) => value.id === continueItemId);
        if (item) {
          setContinueItem(item);
          setContinueSaved(true);
          if (item.kind === 'next_step') setTinyStep(item.content);
          else setDraft(item.content);
          if (content.presentation.pattern === 'sort')
            setGroups({ now: [item.content], later: [], ignore: [] });
        }
      } catch {
        setLocalStatus('This saved item could not be loaded.');
      }
    }
    setPhase('ready');
    setStatus(
      `Ready when you are. Start, skip, or return to ${origin === 'talk' ? 'Talk' : 'Actions'}.`,
    );
  }, [id, origin, continueItemId]);

  async function startActivity() {
    if (phase === 'ready' && !busy && !operationPending.current) {
      operationPending.current = true;
      setBusy(true);
      try {
        const session = await getDemoSession();
        const created = await request<Omit<Run, 'session'>>(
          `/sessions/${session.session_id}/interventions/${id}/start`,
          session,
          { consented: true },
        );
        setRun({ ...created, session });
        setPhase('active');
        setStatus('Started. Stop whenever you like.');
      } catch {
        setStatus(
          'Mira could not confirm this activity can start. Check the connection or try again shortly.',
        );
      } finally {
        operationPending.current = false;
        setBusy(false);
      }
    }
  }

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
    } else if (continueItem) {
      try {
        const updated = await updateContinueItem(continueItem.id, {
          content: continueItem.kind === 'next_step' ? tinyStep : draft,
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

  async function keepInActions(content: string) {
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
        });
        if (!updated) throw new Error('Saved item no longer exists.');
        setContinueItem({ ...continueItem, content: content.trim() });
      } else {
        const item = await saveContinueItem(intervention, content);
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

  function confirmKeepInActions(content: string) {
    if (!intervention || !content.trim()) return;
    const isExisting = !!continueItem;
    Alert.alert(
      isExisting ? 'Update this Actions item?' : 'Keep this in Actions?',
      content.trim(),
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: isExisting ? 'Update item' : 'Keep in Actions',
          onPress: () => void keepInActions(content),
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
