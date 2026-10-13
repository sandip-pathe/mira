import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { DemoSession, request } from './api';
import { ActionButton, Eyebrow, StatusPill, Surface, ui } from './ui';

export type ActionDefinition = { id: string; title: string; summary: string; steps: string[] };
type Run = { id: string; action_id: string; state: string; local?: boolean };
type Props = { actions: ActionDefinition[]; getSession: () => Promise<DemoSession>;
  onContinueToTalk: (feedbackId: string) => void; goTalk: () => void; goJournal: () => void; resetKey: number };

export function Actions({ actions, getSession, onContinueToTalk, goTalk, goJournal, resetKey }: Props) {
  const [selected, setSelected] = useState<ActionDefinition>();
  const [run, setRun] = useState<Run>();
  const [paused, setPaused] = useState(false);
  const [rating, setRating] = useState<'yes' | 'a_little' | 'no'>();
  const [reuse, setReuse] = useState<boolean>();
  const [feedbackId, setFeedbackId] = useState<string>();
  const [declined, setDeclined] = useState(false);
  const [remaining, setRemaining] = useState(60);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ask Mira in Talk to offer the two fixed activities.');

  useEffect(() => {
    setSelected(undefined); setRun(undefined); setPaused(false); setRating(undefined); setReuse(undefined);
    setFeedbackId(undefined); setDeclined(false); setRemaining(60);
  }, [resetKey]);

  useEffect(() => {
    if (!run || run.state !== 'started' || paused || remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [run?.state, paused, remaining]);

  useEffect(() => {
    if (run?.state === 'started' && !paused && remaining === 0) void finish('completed');
  }, [run?.state, paused, remaining]);

  async function start(action: ActionDefinition) {
    setBusy(true); setStatus('Starting activity…');
    try {
      const session = await getSession();
      const created = await request<Run>('/sessions/' + session.session_id + '/action-runs', session, { action_id: action.id });
      setSelected(action); setRun(created); setPaused(false); setRemaining(60); setStatus('Activity started. Stop whenever you like.');
    } catch {
      setSelected(action); setRun({ id: `local-${Date.now()}`, action_id: action.id, state: 'started', local: true });
      setPaused(false); setRemaining(60); setStatus('Mira is temporarily offline. You can still try this loaded activity; changes stay on this device until saved.');
    }
    finally { setBusy(false); }
  }

  async function finish(state: 'completed' | 'skipped' | 'stopped') {
    if (!run) return;
    if (run.local) {
      setRun({ ...run, state }); setPaused(false);
      setStatus(`Offline activity ${state}. Reconnect to save your feedback.`);
      return;
    }
    setBusy(true);
    try {
      const session = await getSession();
      await request('/sessions/' + session.session_id + '/action-runs/' + run.id, session, { state }, 'PATCH');
      setRun({ ...run, state }); setPaused(false); setStatus(state === 'completed' ? 'Activity complete.' : `Activity ${state}.`);
    } catch {
      setRun({ ...run, state, local: true }); setPaused(false);
      setStatus('Mira is temporarily offline. This update is kept on this device until saved.');
    }
    finally { setBusy(false); }
  }

  async function saveFeedback() {
    if (!run || !rating || reuse === undefined) return;
    setBusy(true);
    try {
      const session = await getSession();
      let savedRun = run;
      if (run.local && run.id.startsWith('local-')) {
        savedRun = await request<Run>('/sessions/' + session.session_id + '/action-runs', session,
          { action_id: run.action_id });
        await request('/sessions/' + session.session_id + '/action-runs/' + savedRun.id, session,
          { state: run.state }, 'PATCH');
        setRun(savedRun);
      } else if (run.local) {
        await request('/sessions/' + session.session_id + '/action-runs/' + run.id, session,
          { state: run.state }, 'PATCH');
        savedRun = { ...run, local: false };
        setRun(savedRun);
      }
      const saved = await request<{ id: string }>('/sessions/' + session.session_id + '/feedback', session,
        { action_run_id: savedRun.id, rating, reuse_context: reuse });
      setFeedbackId(saved.id); setStatus('Feedback saved.');
    } catch { setStatus('Feedback was not saved. Your rating and choice are kept here; try again.'); }
    finally { setBusy(false); }
  }

  return <View style={{ gap: 16 }}>
    <Text style={ui.muted}>{status}</Text>
    {!selected && !run && !declined && actions.map((action, index) => <Surface key={action.id} style={{ gap: 11 }}>
      <Eyebrow>OPTION {index + 1} · UP TO 60 SECONDS</Eyebrow>
      <Text style={ui.heading}>{action.title}</Text>
      <Text style={ui.body}>{action.summary}</Text>
      <ActionButton label={`Choose ${action.title}`} disabled={busy} onPress={() => setSelected(action)} />
    </Surface>)}
    {!selected && !run && actions.length > 0 && !declined && <>
      <ActionButton label="Decline both" variant="secondary" onPress={() => { setStatus('No activity selected. You can return to Talk or Journal.'); setActionsCleared(); setDeclined(true); }} />
      <ActionButton label="Return to Journal" variant="quiet" onPress={goJournal} />
    </>}
    {!selected && !run && (declined || !actions.length) && <>
      {!actions.length && <Text style={ui.body}>No action choices are loaded yet.</Text>}
      <ActionButton label="Return to Talk" onPress={goTalk} />
      <ActionButton label="Return to Journal" variant="secondary" onPress={goJournal} />
      <ActionButton label="Finish" variant="quiet" onPress={() => setStatus('You can close the demo whenever you like.')} />
    </>}
    {selected && !run && <Surface style={{ gap: 12 }}>
      <Eyebrow>YOUR CHOICE</Eyebrow><Text style={ui.heading}>{selected.title}</Text>
      <Text style={ui.body}>{selected.summary}</Text>
      {selected.steps.map((step, index) => <View key={index} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}><View style={{ width: 25, height: 25, borderRadius: 13, backgroundColor: '#E8EFE8', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#3F6852', fontWeight: '700' }}>{index + 1}</Text></View><Text style={[ui.body, { flex: 1 }]}>{step}</Text></View>)}
      <ActionButton label="Start" loading={busy} onPress={() => void start(selected)} />
      <ActionButton label="Choose another" variant="quiet" onPress={() => setSelected(undefined)} />
    </Surface>}
    {selected && run && !rating && <Surface style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}><Text style={ui.heading}>{selected.title}</Text><StatusPill tone={paused ? 'neutral' : 'good'}>{paused ? 'Paused' : 'In progress'}</StatusPill></View>
      <Text style={{ fontSize: 34, lineHeight: 42, fontWeight: '700', color: '#3F6852', fontVariant: ['tabular-nums'] }}>{remaining}<Text style={{ fontSize: 16, fontWeight: '500' }}> sec</Text></Text>
      {paused ? <ActionButton label="Resume" onPress={() => { setPaused(false); setStatus('Activity resumed.'); }} />
        : <ActionButton label="Pause" variant="secondary" onPress={() => { setPaused(true); setStatus('Activity paused. Resume whenever you are ready.'); }} />}
      <ActionButton label="Complete" loading={busy} onPress={() => void finish('completed')} />
      <View style={{ flexDirection: 'row', gap: 8 }}><ActionButton label="Skip" variant="quiet" disabled={busy} onPress={() => void finish('skipped')} style={{ flex: 1 }} />
      <ActionButton label="Stop" variant="quiet" disabled={busy} onPress={() => void finish('stopped')} style={{ flex: 1 }} /></View>
    </Surface>}
    {run && ['completed', 'skipped', 'stopped'].includes(run.state) && !rating && <Surface style={{ gap: 12 }}>
      <Eyebrow>CHECK IN</Eyebrow><Text style={ui.heading}>Did this help?</Text>
      <ActionButton label="Yes" variant="secondary" onPress={() => setRating('yes')} />
      <ActionButton label="A little" variant="secondary" onPress={() => setRating('a_little')} />
      <ActionButton label="No" variant="secondary" onPress={() => setRating('no')} />
    </Surface>}
    {rating && reuse === undefined && <Surface style={{ gap: 12 }}>
      <Eyebrow>ONE MORE CHOICE</Eyebrow><Text style={ui.body}>Rating: {rating.replace('_', ' ')}. Separately, may Mira use this feedback in a future conversation?</Text>
      <ActionButton label="Yes, allow future use" disabled={busy} onPress={() => setReuse(true)} />
      <ActionButton label="No, keep it private" variant="secondary" disabled={busy} onPress={() => setReuse(false)} />
    </Surface>}
    {rating && reuse !== undefined && !feedbackId && <ActionButton label="Save feedback" loading={busy} onPress={() => void saveFeedback()} />}
    {feedbackId && reuse && <ActionButton label="Continue to Talk with this feedback" onPress={() => onContinueToTalk(feedbackId)} />}
    {feedbackId && !reuse && <>
      <Text style={ui.muted}>This feedback will not be used as future context.</Text>
      <ActionButton label="Return to Talk" onPress={goTalk} />
      <ActionButton label="Return to Journal" variant="secondary" onPress={goJournal} />
      <ActionButton label="Finish" variant="quiet" onPress={() => { setStatus('You can close the demo whenever you like.'); setActionsCleared(); }} />
    </>}
  </View>;

  function setActionsCleared() { setSelected(undefined); setRun(undefined); setPaused(false); setRating(undefined); setReuse(undefined); setFeedbackId(undefined); }
}
