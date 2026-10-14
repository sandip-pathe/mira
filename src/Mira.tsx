import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, getDemoSession, Message, request } from './api';
import { Metric, Voice, VoiceState } from './voice';
import { ActionButton, colors, Eyebrow, StatusPill, ui } from './ui';
import { onContextRevoked, onDemoReset } from './demoEvents';
import { Intervention, SupportDecision, rememberIntervention } from './interventions';

type ContextMatch = { id: string; source_type: 'journal' | 'action' | 'feedback'; source_id: string; excerpt: string; label?: string };
type MomentState = { what_happened: string; current_need: string; what_is_unclear: string; support_mode: 'listen_more' | 'clarify' | 'offer_action' | 'continue_action' | 'check_outcome' | 'suggest_human_support'; suggested_action: string; previously_helpful: string };

const blankMoment = (): MomentState => ({ what_happened: '', current_need: '', what_is_unclear: '', support_mode: 'listen_more', suggested_action: '', previously_helpful: '' });

function Mira() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<VoiceState>('disconnected');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [contextMatches, setContextMatches] = useState<ContextMatch[]>([]);
  const [contextNotice, setContextNotice] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [moment, setMoment] = useState<MomentState>(blankMoment);
  const [proposal, setProposal] = useState<SupportDecision | undefined>(undefined);
  const [showCaptions, setShowCaptions] = useState(false);
  const proposalRef = useRef<SupportDecision | undefined>(undefined);
  const voiceRef = useRef<Voice | undefined>(undefined);
  const callbacksRef = useRef<{ message: (message: Message) => void; decision: (decision: SupportDecision) => void } | undefined>(undefined);
  const getSession = useCallback(() => getDemoSession(), []);

  const openIntervention = useCallback((intervention: Intervention) => {
    rememberIntervention(intervention);
    proposalRef.current = undefined;
    setProposal(undefined);
    voiceRef.current?.close();
    router.push({ pathname: '/do', params: { id: intervention.id } });
  }, []);

  const handleDecision = useCallback((value: SupportDecision) => {
    if (value.intervention) rememberIntervention(value.intervention);
    const mode = { listen: 'listen_more', ask_question: 'clarify', offer_intervention: 'offer_action', human_support: 'suggest_human_support' } as const;
    const next = value.route === 'offer_intervention' && value.intervention ? value : undefined;
    proposalRef.current = next;
    setProposal(next);
    setMoment(current => ({ ...current, support_mode: mode[value.route],
      what_happened: value.situation_summary || current.what_happened,
      what_is_unclear: value.question || current.what_is_unclear,
      suggested_action: value.intervention?.title ?? '' }));
  }, []);

  const declineProposal = useCallback(async () => {
    const intervention = proposalRef.current?.intervention;
    proposalRef.current = undefined; setProposal(undefined);
    setMoment(current => ({ ...current, support_mode: 'listen_more', suggested_action: '' }));
    if (!intervention) return;
    try {
      const session = await getSession();
      await request(`/sessions/${session.session_id}/interventions/${intervention.id}/decline`, session, {});
    } catch { /* The choice is still respected in this conversation. */ }
  }, [getSession]);

  const handleVoiceMessage = useCallback((message: Message) => {
    setMessages(current => [...current, message]);
    if (message.role !== 'user') return;
    if (message.content.trim() === 'I am in immediate danger and need emergency help now.') {
      voiceRef.current?.cancel(); setUrgent(true); return;
    }
    const pending = proposalRef.current?.intervention;
    if (!pending) return;
    const response = message.content.trim().toLowerCase();
    if (/^(no\b|not now\b|maybe later\b|i don't want\b|i do not want\b)/.test(response)) {
      void declineProposal();
    } else if (/^(yes\b|yeah\b|yep\b|sure\b|okay\b|ok\b|let's try\b|try it\b)/.test(response)) {
      openIntervention(pending);
    }
  }, [declineProposal, openIntervention]);

  useEffect(() => { callbacksRef.current = { message: handleVoiceMessage, decision: handleDecision }; }, [handleVoiceMessage, handleDecision]);
  const [voiceInstance, setVoiceInstance] = useState<Voice | undefined>(undefined);
  useEffect(() => {
    const timer = setTimeout(() => setVoiceInstance(new Voice({ state: setState, error: setError,
    message: value => { if (value.role === 'user') callbacksRef.current?.message(value); else setMessages(current => [...current, value]); },
    metric: metric => setMetrics(items => [...items.slice(-9), metric]),
    decision: value => callbacksRef.current?.decision(value),
    moment: value => setMoment(current => ({ ...value, previously_helpful: current.previously_helpful })),
    context: (matches, noMatch) => {
      if (matches.length) {
        setContextNotice('');
        const lesson = matches.find(item => item.source_type === 'feedback')?.excerpt;
        if (lesson) setMoment(current => ({ ...current, previously_helpful: lesson }));
        setContextMatches(current => {
          const byId = new Map(current.map(item => [item.id, item]));
          matches.forEach(item => byId.set(item.id, item));
          return [...byId.values()];
        });
      } else if (noMatch) setContextNotice('No relevant shared context matched. Mira is continuing without it.');
    },
    urgentHelp: () => setUrgent(true),
    })), 0);
    return () => clearTimeout(timer);
  }, []);
  const activeVoice = voiceInstance;
  useEffect(() => { voiceRef.current = activeVoice; return () => { voiceRef.current = undefined; }; }, [activeVoice]);

  const clearLocalDemo = useCallback(() => {
    activeVoice?.close();
    setMessages([]); setContextMatches([]); setContextNotice(''); setText(''); setTextMode(false);
    setUrgent(false); setProposal(undefined); proposalRef.current = undefined; setMoment(blankMoment());
  }, [activeVoice]);

  useEffect(() => { const unsubscribe = onDemoReset(clearLocalDemo); return () => { unsubscribe(); }; }, [clearLocalDemo]);
  useEffect(() => { const unsubscribe = onContextRevoked(() => {
    setMessages([]); setContextMatches([]); setContextNotice('');
    setMoment(current => ({ ...current, previously_helpful: '' }));
  }); return () => { unsubscribe(); }; }, []);
  useEffect(() => () => activeVoice?.close(), [activeVoice]);
  useFocusEffect(useCallback(() => () => activeVoice?.close(), [activeVoice]));

  async function connect() {
    setError(''); setTextMode(false); setContextMatches([]); setContextNotice('');
    try { await activeVoice?.connect(await getSession(), messages, undefined, moment); }
    catch (e) { setError(e instanceof Error ? e.message : 'Mira is temporarily offline.'); }
  }

  async function sendText() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    if (content === 'I am in immediate danger and need emergency help now.') {
      activeVoice?.cancel(); setUrgent(true); return;
    }
    const pending = proposalRef.current?.intervention;
    if (pending && /^(yes|yeah|yep|sure|okay|ok|let's try|try it)\b/i.test(content)) {
      setMessages(items => [...items, { role: 'user', content }]); setText(''); openIntervention(pending); return;
    }
    if (pending && /^(no|not now|maybe later|i don't want|i do not want)\b/i.test(content)) {
      setMessages(items => [...items, { role: 'user', content }]); setText(''); void declineProposal(); return;
    }
    setSending(true); setError('');
    const next = [...messages, { role: 'user' as const, content }];
    try {
      const current = await getSession();
      const result = await request<{ text: string; moment_state: MomentState; context_matches: ContextMatch[]; decision: SupportDecision }>(
        `/sessions/${current.session_id}/text`, current, { messages: next, feedback_id: null, moment_state: moment });
      setMessages([...next, { role: 'assistant', content: result.text }]); setText('');
      const lesson = result.context_matches?.find(item => item.source_type === 'feedback')?.excerpt;
      setMoment({ ...result.moment_state, previously_helpful: lesson ?? moment.previously_helpful });
      setContextMatches(result.context_matches ?? []);
      setContextNotice(result.context_matches?.length ? '' : 'No relevant shared context matched. Mira is continuing without it.');
      handleDecision(result.decision);
    } catch (e) { setError(e instanceof Error ? e.message : 'Mira is temporarily offline.'); }
    finally { setSending(false); }
  }

  const ready = ['ready', 'thinking', 'speaking', 'listening'].includes(state);
  const momentLabel = state === 'thinking' ? 'THINKING' : state === 'speaking' ? 'SPEAKING'
    : moment.support_mode === 'offer_action' ? 'ASKING BEFORE AN ACTIVITY'
    : moment.support_mode === 'continue_action' ? 'GUIDING ONE STEP'
    : moment.support_mode === 'check_outcome' ? 'CHECKING IF IT HELPED'
    : moment.support_mode === 'suggest_human_support' ? 'SHOWING SUPPORT OPTIONS'
    : moment.support_mode === 'clarify' ? 'CLARIFYING'
    : state === 'listening' ? 'LISTENING' : 'READY WHEN YOU ARE';

  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><View style={styles.brandLine}><View style={styles.brandMark}><Text style={styles.brandMarkText}>m</Text></View><Text style={styles.brand}>mira</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Help" style={styles.smallButton} onPress={() => {
        activeVoice?.cancel();
        Alert.alert('Help', 'Choose a support route or urgent help.', [
          { text: 'Support route', onPress: () => Alert.alert('Support route', 'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.') },
          { text: 'Urgent help now', onPress: () => setUrgent(true) }, { text: 'Close', style: 'cancel' },
        ]);
      }}><Text style={styles.helpText}>Help</Text></Pressable></View>
    {urgent ? <View style={styles.help}><Text style={styles.title}>Urgent help now</Text>
      <Text style={styles.body}>This demo is not crisis support and is not connected to Mpower. Contact local emergency services or someone you trust now.</Text>
      <Text style={styles.body}>No one has been contacted through this demo.</Text>
      <ActionButton label="Close help" onPress={() => setUrgent(false)} /></View> : <>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Eyebrow>YOUR SPACE · DEMO</Eyebrow>
        <View style={styles.pageHeading}><View><Text style={styles.title}>What’s going on?</Text>
          <Text style={styles.subtitle}>We can take this one moment at a time.</Text></View>
          <StatusPill tone={ready ? 'good' : state === 'disconnected' ? 'warn' : 'neutral'}>{ready ? 'Connected' : state === 'connecting' ? 'Connecting' : 'Voice offline'}</StatusPill></View>
        <View style={styles.momentCard}><Eyebrow>MIRA IS {momentLabel}</Eyebrow>
          <Text accessibilityLiveRegion="polite" style={styles.body}>{moment.what_happened || (state === 'ready' ? 'Hold to talk when you’re ready. Release to send.' : state === 'listening' ? 'Listening. Release when you’re done.' : state === 'thinking' ? 'Taking a moment to understand.' : 'Connect or continue with text.')}</Text>
          {!!moment.current_need && <Text style={styles.need}>{moment.current_need}</Text>}
          {!!moment.previously_helpful && <Text style={styles.body}>Last time: {moment.previously_helpful}</Text>}
        </View>
        <View style={styles.contextNote}><Text style={styles.body}>{contextNotice || (contextMatches.length
          ? `Context source: ${contextMatches.map(item => item.label ?? (item.source_type === 'journal' ? 'approved Journal excerpt' : item.source_type === 'action' ? 'saved activity history' : 'saved preference')).join(', ')}. You can ignore it.`
          : 'Journal stays private unless you select and approve an excerpt. Microphone is off unless held.')}</Text></View>
        {contextMatches.map(item => <View key={item.id} style={styles.contextQuote}><Text style={styles.contextLabel}>{item.source_type === 'journal' ? 'FROM YOUR JOURNAL' : item.source_type === 'action' ? 'SAVED ACTIVITY' : 'SAVED PREFERENCE'}</Text><Text style={styles.body}>{item.excerpt}</Text></View>)}
        {!!error && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View>}
        {!ready && <ActionButton label={state === 'connecting' ? 'Connecting…' : 'Retry voice'} loading={state === 'connecting'} onPress={() => void connect()} />}
        <ActionButton label="Continue with text" variant="secondary" onPress={() => { activeVoice?.close(); setTextMode(true); }} />
        <ActionButton label={showCaptions ? 'Hide conversation' : 'Show conversation'} variant="quiet" onPress={() => setShowCaptions(value => !value)} />
        {showCaptions && messages.map((message, index) => <View key={`${index}-${message.role}`} style={[styles.message, message.role === 'user' && styles.userMessage]}><Text style={styles.label}>{message.role === 'user' ? 'YOU' : 'MIRA'}</Text><Text style={styles.body}>{message.content}</Text></View>)}
        {proposal?.intervention && <View style={styles.momentCard}>
          <Eyebrow>ONE OPTIONAL ACTIVITY</Eyebrow><Text style={styles.title}>{proposal.intervention.title}</Text>
          <Text style={styles.body}>{proposal.intervention.summary}</Text>
          {!!proposal.offer_reason && <Text style={styles.need}>{proposal.offer_reason}</Text>}
          <ActionButton label={`Try ${proposal.intervention.title}`} onPress={() => openIntervention(proposal.intervention!)} />
          <ActionButton label="Not now" variant="secondary" onPress={() => {
            void declineProposal();
          }} />
        </View>}
        {moment.support_mode === 'suggest_human_support' && <Text style={styles.body}>This demo has no connected support route. Help has the available options.</Text>}
        {textMode && <><TextInput accessibilityLabel="Text message" value={text} onChangeText={setText} multiline style={styles.input} placeholder="Write to Mira…" />
          <ActionButton label={sending ? 'Sending…' : 'Send'} loading={sending} disabled={!text.trim()} onPress={() => void sendText()} />
        </>}
        {__DEV__ && <View style={styles.diagnostics}><Text style={styles.label}>Gate evidence · Android {Platform.Version}</Text>
          <Text style={styles.body}>{API_URL}</Text>
          {metrics.map((metric, index) => <Text key={index} style={styles.body}>{metric.event}{metric.ms === undefined ? '' : `: ${metric.ms} ms`}</Text>)}</View>}
      </ScrollView>
      {!textMode && <View style={styles.micArea}>
        <Pressable accessibilityRole="button" accessibilityLabel="Hold to talk. Release to send. Hold while Mira speaks to interrupt."
          accessibilityState={{ disabled: !ready }} disabled={!ready}
          onPressIn={() => activeVoice?.press()} onPressOut={() => activeVoice?.release()}
          style={({ pressed }) => [styles.mic, !ready && styles.disabled, pressed && ready && styles.micPressed]}><Text style={styles.micIcon}>◉</Text><Text style={styles.micText}>{state === 'listening' ? 'Listening · release to send' : state === 'speaking' ? 'Hold to interrupt' : 'Hold to talk'}</Text><Text style={styles.micHint}>Release to send</Text></Pressable>
        <ActionButton label="Cancel turn" variant="quiet" disabled={!ready} onPress={() => activeVoice?.cancel()} />
      </View>}
    </>}
  </SafeAreaView>;
}

export default Mira;
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas }, header: { paddingHorizontal: 22, paddingTop: 9, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLine: { flexDirection: 'row', gap: 9, alignItems: 'center' }, brandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.white, fontSize: 19, fontWeight: '700' }, brand: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  title: { ...ui.title }, subtitle: { marginTop: 5, fontSize: 16, lineHeight: 23, color: colors.muted }, pageHeading: { gap: 14, marginBottom: 4 },
  content: { paddingHorizontal: 22, paddingTop: 17, paddingBottom: 18, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' },
  body: { ...ui.body }, label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.9, color: colors.muted },
  smallButton: { minHeight: 48, minWidth: 66, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.surface }, helpText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  message: { padding: 16, gap: 8, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, userMessage: { backgroundColor: colors.accentSoft, borderColor: '#D2DED3' },
  error: { fontSize: 15, lineHeight: 22, color: colors.danger }, errorBox: { padding: 13, backgroundColor: '#F8E9E3', borderRadius: 14 }, input: { ...ui.input },
  contextNote: { padding: 15, backgroundColor: colors.accentSoft, borderRadius: 16 }, contextQuote: { padding: 14, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.surface, gap: 7 }, contextLabel: { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 0.8 },
  momentCard: { padding: 16, gap: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 18, backgroundColor: colors.surface }, need: { fontSize: 16, lineHeight: 23, fontWeight: '600', color: colors.accent },
  micArea: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 7, gap: 2 },
  mic: { minHeight: 76, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#23392C', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  micIcon: { fontSize: 17, color: '#DDEADF', marginBottom: 1 }, micText: { fontSize: 17, fontWeight: '700', color: colors.white }, micHint: { fontSize: 12, color: '#DFE9E0', marginTop: 1 }, micPressed: { backgroundColor: '#294936', transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.48 },
  diagnostics: { gap: 6, borderTopWidth: 1, borderColor: colors.line, paddingTop: 16 }, help: { flex: 1, padding: 22, gap: 24, backgroundColor: colors.canvas },
});
