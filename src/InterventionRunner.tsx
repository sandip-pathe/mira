import React, { useCallback, useEffect, useState } from 'react';
import { AppState, ScrollView, Text, TextInput, View } from 'react-native';
import { DemoSession, getDemoSession, request } from './api';
import { getRememberedIntervention, Intervention, rememberIntervention } from './interventions';
import { ActionButton, Eyebrow, StatusPill, Surface, ui } from './ui';

type Run = { id: string; action_id: string; state: 'started' | 'completed' | 'skipped' | 'stopped'; local?: boolean };
type Rating = 'no' | 'a_little' | 'yes';

export function InterventionRunner({ id, onBack }: { id: string; onBack: () => void }) {
  const [intervention, setIntervention] = useState<Intervention>();
  const [activeId, setActiveId] = useState('');
  const [run, setRun] = useState<Run>();
  const [status, setStatus] = useState('Loading this activity…');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const [groups, setGroups] = useState<{ now: string[]; later: string[]; ignore: string[] }>();
  const [tinyStep, setTinyStep] = useState('');
  const [rating, setRating] = useState<Rating>();
  const [tried, setTried] = useState<boolean>();
  const [finished, setFinished] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [reuse, setReuse] = useState<boolean>();
  const [saved, setSaved] = useState<boolean>();
  const [feedbackStatus, setFeedbackStatus] = useState('');

  const initialize = useCallback(async () => {
    let session: DemoSession | undefined;
    let content: Intervention | undefined = getRememberedIntervention(id);
    try {
      session = await getDemoSession();
      content = await request<Intervention>(`/sessions/${session.session_id}/interventions/${id}/activity`, session);
      rememberIntervention(content);
    } catch { /* Use activity text already loaded by Talk when the service is offline. */ }
    if (!content) { setStatus('This activity is unavailable. Return to Talk and try again.'); return; }
    setActiveId(content.id);
    setIntervention(content);
    if (content.id === 'pause_60s') setSeconds(60);
    if (content.id === 'short_movement') setSeconds(300);
    setRun({ id: `pending-${Date.now()}`, action_id: id, state: 'started', local: true });
    setReadyToStart(true);
    setStatus('Ready when you are. Start, skip, or return to Talk.');
  }, [id]);

  async function startActivity() {
    if (!run || run.id.startsWith('pending-')) {
      setBusy(true);
      try {
      const session = await getDemoSession();
      const created = await request<Run>(`/sessions/${session.session_id}/interventions/${id}/start`, session, { consented: true });
      setRun(created);
      setReadyToStart(false);
      setStatus('Started. Stop whenever you like.');
      } catch {
      setRun({ id: `local-${Date.now()}`, action_id: id, state: 'started', local: true });
      setReadyToStart(false);
      setStatus('Mira is temporarily offline. This loaded activity can continue; any outcome will stay on this device.');
      } finally { setBusy(false); }
    }
  }

  async function finishRun(next: Run['state']) {
    if (!run || busy) return;
    setBusy(true); setTimerRunning(false);
    let local = run.local || run.id.startsWith('pending-');
    if (!local) {
      try {
        const session = await getDemoSession();
        await request(`/sessions/${session.session_id}/action-runs/${run.id}`, session, { state: next }, 'PATCH');
      } catch { local = true; setStatus('Mira is temporarily offline. This outcome stays on this device.'); }
    }
    setRun({ ...run, state: next, local });
    setTried(next !== 'skipped'); setFinished(true); setBusy(false); setStatus('How did this go?');
  }

  useEffect(() => { const timer = setTimeout(() => { void initialize(); }, 0); return () => clearTimeout(timer); }, [initialize]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' && timerRunning) {
        setTimerRunning(false); setTimerPaused(true); setStatus('Timer paused while Mira was in the background.');
      }
    });
    return () => subscription.remove();
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerPaused || seconds <= 0) return;
    const timer = setTimeout(() => {
      if (seconds <= 1) { setSeconds(0); setTimerRunning(false); setStatus('Timer ended. Check in when you are ready.'); }
      else setSeconds(value => value - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds, timerPaused, timerRunning]);

  async function organize() {
    const items = draft.split('\n').map(item => item.trim()).filter(Boolean);
    if (!items.length || items.length > 30) { setStatus('Add 1–30 short lines first.'); return; }
    setBusy(true); setStatus('Sorting your list…');
    try {
      const session = await getDemoSession();
      const result = await request<{ now: string[]; later: string[]; ignore: string[] }>(
        `/sessions/${session.session_id}/task-reset/organize`, session, { items });
      setGroups(result); setStatus('These are suggestions. Edit anything that feels misplaced.');
    } catch {
      setGroups({ now: items, later: [], ignore: [] });
      setStatus('Sorting is unavailable. Your original list is here; you can sort it yourself.');
    } finally { setBusy(false); }
  }

  function move(item: string, source: 'now' | 'later' | 'ignore', target: 'now' | 'later' | 'ignore') {
    setGroups(current => current && ({ ...current,
      [source]: current[source].filter(value => value !== item),
      [target]: [...current[target], item],
    }));
  }

  async function savePreference(allow: boolean) {
    if (!run || !rating || saved !== undefined) return;
    setReuse(allow);
    if (run.local || run.id.startsWith('pending-')) {
      setSaved(false); setFeedbackStatus('Mira is offline. This preference was not saved.'); return;
    }
    setBusy(true);
    try {
      const session = await getDemoSession();
      const result = await request<{ id: string | null; saved: boolean }>(`/sessions/${session.session_id}/feedback`, session,
        allow ? { action_run_id: run.id, rating, reuse_context: true,
          helpful_lesson: `Mira may suggest ${intervention?.title ?? activeId} again in a similar moment.` }
          : { action_run_id: run.id, rating, reuse_context: false });
      setSaved(result.saved); setFeedbackStatus(result.saved ? 'Preference saved. You can review or remove it in You.' : 'This preference was not saved.');
    } catch { setSaved(false); setFeedbackStatus('Mira is offline. This preference was not saved.'); }
    finally { setBusy(false); }
  }

  if (!intervention) return <View style={{ gap: 14 }}>
    <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>
    <ActionButton label="Back to Talk" onPress={onBack} />
  </View>;

  const groupsView = (label: string, key: 'now' | 'later' | 'ignore') => <View style={{ gap: 8 }}>
    <Eyebrow>{label}</Eyebrow>{(groups?.[key] ?? []).map(item => <Surface key={`${key}-${item}`} style={{ gap: 7 }}>
      <Text style={ui.body}>{item}</Text>{key === 'now' && <ActionButton label="Use as tiny next step" variant="secondary" onPress={() => setTinyStep(item)} />}
      <View style={{ flexDirection: 'row', gap: 5 }}>{(['now', 'later', 'ignore'] as const).filter(target => target !== key).map(target =>
        <ActionButton key={target} label={`Move ${target}`} variant="quiet" onPress={() => move(item, key, target)} style={{ flex: 1 }} />)}</View>
    </Surface>)}</View>;

  return <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 32, gap: 16 }} keyboardShouldPersistTaps="handled">
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Eyebrow>DO · {intervention.category.toUpperCase()}</Eyebrow>
      <StatusPill tone={finished ? 'neutral' : 'good'}>{finished ? 'Finished' : 'In progress'}</StatusPill>
    </View>
    <Text style={ui.title}>{intervention.title}</Text>
    <Text style={ui.body}>{intervention.summary}</Text>
    <Text accessibilityLiveRegion="polite" style={ui.muted}>{status}</Text>

    {readyToStart && <Surface style={{ gap: 12 }}>
      <Eyebrow>YOUR CHOICE</Eyebrow><Text style={ui.body}>Start this activity when you are ready. You can skip it or go back to Talk.</Text>
      <ActionButton label="Start activity" loading={busy} onPress={() => void startActivity()} />
      <ActionButton label="Skip" variant="secondary" onPress={() => { setRun({ ...run!, state: 'skipped' }); setReadyToStart(false); setTried(false); setFinished(true); setStatus('How did this go?'); }} />
      <ActionButton label="Return to Talk" variant="quiet" onPress={onBack} />
    </Surface>}

    {!finished && !readyToStart && intervention.id === 'task_reset_60s' && <Surface style={{ gap: 12 }}>
      <Eyebrow>GET IT OUT OF YOUR HEAD</Eyebrow><Text style={ui.heading}>What is taking up space?</Text>
      <TextInput accessibilityLabel="Temporary brain dump" multiline value={draft} onChangeText={setDraft}
        placeholder="One thing per line" style={[ui.input, { minHeight: 110 }]} />
      <Text style={ui.muted}>This list is temporary. It is not saved to Journal.</Text>
      {!groups && <><ActionButton label="Sort it for me" loading={busy} disabled={!draft.trim()} onPress={() => void organize()} />
        <ActionButton label="Choose one without sorting" variant="quiet" onPress={() => setGroups({ now: draft.split('\n').map(v => v.trim()).filter(Boolean), later: [], ignore: [] })} /></>}
      {groups && <>{groupsView('NOW', 'now')}{groupsView('LATER', 'later')}{groupsView('IGNORE', 'ignore')}
        <TextInput accessibilityLabel="One tiny next step" value={tinyStep} onChangeText={setTinyStep}
          placeholder="One small next step" style={ui.input} />
        <ActionButton label="Done" disabled={busy} onPress={() => void finishRun('completed')} />
        <ActionButton label="Stop" variant="quiet" disabled={busy} onPress={() => void finishRun('stopped')} />
      </>}
    </Surface>}

    {!finished && !readyToStart && intervention.id === 'brain_dump' && <Surface style={{ gap: 12 }}>
      <Eyebrow>JUST FOR THIS MOMENT</Eyebrow><Text style={ui.heading}>Write freely</Text>
      <TextInput accessibilityLabel="Temporary brain dump" multiline value={draft} onChangeText={setDraft}
        placeholder="Write whatever is on your mind…" style={[ui.input, { minHeight: 150 }]} />
      <Text style={ui.muted}>This is temporary and will not be saved to Journal.</Text>
      <ActionButton label="Done" onPress={() => void finishRun('completed')} />
      <ActionButton label="Stop" variant="quiet" onPress={() => void finishRun('stopped')} />
    </Surface>}

    {!finished && !readyToStart && !['task_reset_60s', 'brain_dump'].includes(intervention.id) && <Surface style={{ gap: 13 }}>
      <Eyebrow>ONE STEP AT A TIME</Eyebrow>
      <Text style={ui.heading}>{intervention.steps[Math.min(step, intervention.steps.length - 1)]}</Text>
      {intervention.id === 'tiny_next_step' && <TextInput accessibilityLabel="Your tiny next step" value={tinyStep}
        onChangeText={setTinyStep} placeholder="One small thing" style={ui.input} />}
      {['short_movement', 'pause_60s'].includes(intervention.id) && seconds > 0 && <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 32, fontWeight: '700', color: '#3F6852' }}>{seconds}<Text style={{ fontSize: 15 }}> sec</Text></Text>
        {!timerRunning && <ActionButton label={timerPaused ? 'Resume timer' : 'Start optional timer'} variant="secondary"
          onPress={() => { setTimerPaused(false); setTimerRunning(true); }} />}
        {timerRunning && <ActionButton label="Pause timer" variant="secondary" onPress={() => { setTimerRunning(false); setTimerPaused(true); }} />}
      </View>}
      {step < intervention.steps.length - 1
        ? <ActionButton label="Next" onPress={() => setStep(value => value + 1)} />
        : <ActionButton label="Done" disabled={busy || (intervention.id === 'tiny_next_step' && !tinyStep.trim())} onPress={() => void finishRun('completed')} />}
      <ActionButton label="Stop" variant="quiet" disabled={busy} onPress={() => void finishRun('stopped')} />
    </Surface>}

    {finished && tried !== undefined && <Surface style={{ gap: 11 }}>
      <Eyebrow>CHECK IN</Eyebrow><Text style={ui.heading}>Did you try it?</Text>
      <Text style={ui.muted}>{tried ? 'You marked this activity as tried.' : 'You stopped before trying it.'}</Text>
      <Text style={ui.heading}>Did it help?</Text>
      {(['no', 'a_little', 'yes'] as const).map(value => <ActionButton key={value}
        label={value === 'no' ? 'Not at all' : value === 'a_little' ? 'A little' : 'Quite a bit'}
        variant="secondary" onPress={() => setRating(value)} />)}
    </Surface>}

    {finished && rating && reuse === undefined && <Surface style={{ gap: 10 }}>
      <Eyebrow>YOUR CHOICE</Eyebrow><Text style={ui.heading}>Would you like Mira to suggest this again?</Text>
      <ActionButton label="Yes, show me the preference" onPress={() => setReuse(true)} />
      <ActionButton label="No, keep it private" variant="secondary" onPress={() => void savePreference(false)} />
    </Surface>}

    {reuse === true && saved === undefined && <Surface style={{ gap: 10 }}>
      <Eyebrow>REVIEW BEFORE SAVING</Eyebrow>
      <Text style={ui.body}>“Mira may suggest {intervention.title} again in a similar moment.”</Text>
      <ActionButton label="Save this preference" loading={busy} onPress={() => void savePreference(true)} />
      <ActionButton label="Keep it private" variant="quiet" onPress={() => void savePreference(false)} />
    </Surface>}

    {saved !== undefined && <Surface style={{ gap: 10 }}>
      <Text accessibilityLiveRegion="polite" style={ui.body}>{feedbackStatus}</Text>
      <ActionButton label="Back to Talk" onPress={onBack} />
    </Surface>}
  </ScrollView>;
}
