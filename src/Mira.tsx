import React, { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, createSession, DemoSession, Message, request } from './api';
import { Actions, ActionDefinition } from './Actions';
import { Journal } from './Journal';
import { Metric, Voice, VoiceState } from './voice';
import { ActionButton, colors, Eyebrow, StatusPill, ui } from './ui';

type Tab = 'Journal' | 'Talk' | 'Actions';
type ContextMatch = { id: string; source_type: 'journal' | 'action' | 'feedback'; source_id: string; excerpt: string; label?: string };

function Mira() {
  const [tab, setTab] = useState<Tab>('Journal');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const history = useRef<Message[]>([]);
  const session = useRef<DemoSession | undefined>(undefined);
  const creating = useRef<Promise<DemoSession> | undefined>(undefined);
  const serverInstance = useRef<string | undefined>(undefined);
  const [state, setState] = useState<VoiceState>('disconnected');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [contextMatches, setContextMatches] = useState<ContextMatch[]>([]);
  const [contextNotice, setContextNotice] = useState('');
  const [activeFeedbackId, setActiveFeedbackId] = useState<string>();
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const voice = useRef<Voice | undefined>(undefined);
  if (!voice.current) voice.current = new Voice({ state: setState, error: setError,
    message: message => { history.current = [...history.current, message]; setMessages(history.current); },
    metric: metric => setMetrics(items => [...items.slice(-9), metric]),
    actions: setActions,
    context: (matches, noMatch) => {
      if (matches.length) {
        setContextNotice('');
        setContextMatches(current => {
          const byId = new Map(current.map(item => [item.id, item]));
          matches.forEach(item => byId.set(item.id, item));
          return [...byId.values()];
        });
      } else if (noMatch) setContextNotice('No relevant shared context matched. Mira is continuing without it.');
    },
    urgentHelp: () => setUrgent(true),
  });
  useEffect(() => () => voice.current?.close(), []);

  async function getSession() {
    const health = await request<{ server_instance_id: string }>('/health');
    if (serverInstance.current !== health.server_instance_id) {
      session.current = undefined;
      creating.current = undefined;
      serverInstance.current = health.server_instance_id;
    }
    if (session.current && session.current.expires_at > Date.now() / 1000 + 30) return session.current;
    if (!creating.current) creating.current = createSession().then(value => { session.current = value; return value; }).finally(() => { creating.current = undefined; });
    return creating.current;
  }

  async function connect(feedbackId?: string) {
    setError(''); setTextMode(false);
    setContextMatches([]);
    setContextNotice('');
    const contextId = feedbackId ?? activeFeedbackId;
    try { await voice.current!.connect(await getSession(), history.current, contextId); }
    catch (e) { setError(e instanceof Error ? e.message : 'Mira is temporarily offline.'); }
  }

  async function sendText() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    if (content === 'I am in immediate danger and need emergency help now.') {
      voice.current!.cancel(); setUrgent(true); return;
    }
    setSending(true); setError('');
    const next = [...history.current, { role: 'user' as const, content }];
    try {
      const current = await getSession();
      const result = await request<{ text: string; context_matches: ContextMatch[] }>(`/sessions/${current.session_id}/text`, current,
        { messages: next, feedback_id: activeFeedbackId ?? null });
      history.current = [...next, { role: 'assistant', content: result.text }];
      setMessages(history.current); setText('');
      setContextMatches(result.context_matches ?? []);
      setContextNotice(result.context_matches?.length ? '' : 'No relevant shared context matched. Mira is continuing without it.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Mira is temporarily offline.'); }
    finally { setSending(false); }
  }

  function changeTab(next: Tab) {
    if (next !== tab) voice.current!.close();
    if (next !== 'Talk') setActiveFeedbackId(undefined);
    setTab(next);
  }

  async function continueToTalk(feedbackId: string) {
    voice.current!.close();
    setActiveFeedbackId(feedbackId || undefined);
    setTab('Talk');
    if (feedbackId) await connect(feedbackId);
    else setTextMode(true);
  }

  function returnToTalk() {
    setActiveFeedbackId(undefined); setTextMode(false); changeTab('Talk');
  }

  function clearLocalDemo() {
    voice.current!.close();
    history.current = []; setMessages([]); setActions([]); setContextMatches([]); setContextNotice('');
    setActiveFeedbackId(undefined); setText(''); setTextMode(false); setUrgent(false);
    setResetKey(value => value + 1);
  }

  const ready = ['ready', 'thinking', 'speaking', 'listening'].includes(state);
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><View style={styles.brandLine}><View style={styles.brandMark}><Text style={styles.brandMarkText}>m</Text></View><Text style={styles.brand}>mira</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Help" style={styles.smallButton} onPress={() => {
        voice.current!.cancel();
        Alert.alert('Help', 'Choose a support route or urgent help.', [
          { text: 'Support route', onPress: () => Alert.alert('Support route', 'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.') },
          { text: 'Urgent help now', onPress: () => setUrgent(true) }, { text: 'Close', style: 'cancel' },
        ]);
      }}><Text style={styles.helpText}>Help</Text></Pressable></View>
    {urgent ? <View style={styles.help}><Text style={styles.title}>Urgent help now</Text>
      <Text style={styles.body}>This demo is not crisis support and is not connected to Mpower. Contact local emergency services or someone you trust now.</Text>
      <Text style={styles.body}>No one has been contacted through this demo.</Text>
      <ActionButton label="Close help" onPress={() => setUrgent(false)} /></View> : <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Eyebrow>YOUR SPACE · DEMO</Eyebrow>
      <View style={styles.pageHeading}><View><Text style={styles.title}>{tab === 'Talk' ? 'A moment to talk' : tab === 'Journal' ? 'Your journal' : 'Small next steps'}</Text>
        <Text style={styles.subtitle}>{tab === 'Talk' ? 'Here with you, one thought at a time.' : tab === 'Journal' ? 'Write or speak. It stays yours.' : 'Choose what feels right for now.'}</Text></View>
        {tab === 'Talk' && <StatusPill tone={ready ? 'good' : state === 'disconnected' ? 'warn' : 'neutral'}>{ready ? 'Connected' : state === 'connecting' ? 'Connecting' : 'Voice offline'}</StatusPill>}</View>
      <View style={{ display: tab === 'Journal' ? 'flex' : 'none' }}><Journal draft={draft} setDraft={setDraft} getSession={getSession} visible={tab === 'Journal'} onReset={clearLocalDemo}
        onContextRevoked={() => { history.current = []; setMessages([]); setContextMatches([]); setContextNotice(''); setActiveFeedbackId(undefined); }} /></View>
      {tab === 'Talk' && <>
        <Text accessibilityLiveRegion="polite" style={styles.body}>{state === 'ready' ? 'When you’re ready, hold the button below and speak. Release to send.' : state === 'listening' ? 'Listening. Release when you’re done.' : state === 'speaking' ? 'Mira is speaking. Hold to interrupt.' : state === 'thinking' ? 'Mira is thinking…' : 'Connect to start a voice conversation.'}</Text>
        <View style={styles.contextNote}><Text style={styles.body}>{contextNotice || (contextMatches.length
          ? `Context source: ${contextMatches.map(item => item.label ?? (item.source_type === 'journal' ? 'approved Journal excerpt' : item.source_type === 'action' ? 'recent action activity' : 'Action feedback')).join(', ')}. You can ignore it.`
          : 'Journal stays private unless you select and approve an excerpt. Microphone is off unless held.')}</Text></View>
        {contextMatches.map(item => <View key={item.id} style={styles.contextQuote}><Text style={styles.contextLabel}>{item.source_type === 'journal' ? 'FROM YOUR JOURNAL' : item.source_type === 'action' ? 'RECENT ACTION' : 'FROM YOUR FEEDBACK'}</Text><Text style={styles.body}>{item.excerpt}</Text></View>)}
        {!!error && <View style={styles.errorBox}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></View>}
        {!ready && <ActionButton label={state === 'connecting' ? 'Connecting…' : 'Retry voice'} loading={state === 'connecting'} onPress={() => void connect()} />}
        <ActionButton label="Continue with text" variant="secondary" onPress={() => { voice.current!.close(); setTextMode(true); }} />
        {messages.map((message, index) => <View key={index} style={[styles.message, message.role === 'user' && styles.userMessage]}><Text style={styles.label}>{message.role === 'user' ? 'YOU' : 'MIRA'}</Text><Text style={styles.body}>{message.content}</Text></View>)}
        {textMode && <><TextInput accessibilityLabel="Text message" value={text} onChangeText={setText} multiline style={styles.input} placeholder="Write to Mira…" />
          <ActionButton label={sending ? 'Sending…' : 'Send'} loading={sending} disabled={!text.trim()} onPress={() => void sendText()} />
        </>}
        {__DEV__ && <View style={styles.diagnostics}><Text style={styles.label}>Gate evidence · Android {Platform.Version}</Text>
          <Text style={styles.body}>{API_URL}</Text>
          {metrics.map((metric, index) => <Text key={index} style={styles.body}>{metric.event}{metric.ms === undefined ? '' : `: ${metric.ms} ms`}</Text>)}</View>}
      </>}
      <View style={{ display: tab === 'Actions' ? 'flex' : 'none' }}>
        <Actions actions={actions} getSession={getSession} onContinueToTalk={continueToTalk}
          goTalk={returnToTalk} goJournal={() => changeTab('Journal')} resetKey={resetKey} />
      </View>
    </ScrollView>}
    {tab === 'Talk' && !urgent && !textMode && <View style={styles.micArea}>
      <Pressable accessibilityRole="button" accessibilityLabel="Hold to talk. Release to send. Hold while Mira speaks to interrupt."
        accessibilityState={{ disabled: !ready }} disabled={!ready}
        onPressIn={() => voice.current!.press()} onPressOut={() => voice.current!.release()}
        style={({ pressed }) => [styles.mic, !ready && styles.disabled, pressed && ready && styles.micPressed]}><Text style={styles.micIcon}>◉</Text><Text style={styles.micText}>{state === 'listening' ? 'Listening · release to send' : state === 'speaking' ? 'Hold to interrupt' : 'Hold to talk'}</Text><Text style={styles.micHint}>Release to send</Text></Pressable>
      <ActionButton label="Cancel turn" variant="quiet" disabled={!ready} onPress={() => voice.current!.cancel()} />
    </View>}
    <View style={styles.tabs}>{(['Talk', 'Journal', 'Actions'] as const).map(item => <Pressable key={item}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => changeTab(item)} style={({ pressed }) => [styles.tab, tab === item && styles.activeTab, pressed && styles.tabPressed]}>
      <Text style={[styles.tabIcon, tab === item && styles.selected]}>{item === 'Talk' ? '◌' : item === 'Journal' ? '▤' : '↗'}</Text><Text style={[styles.tabText, tab === item && styles.selected]}>{item}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><Mira /></SafeAreaProvider>; }
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas }, header: { paddingHorizontal: 22, paddingTop: 9, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandLine: { flexDirection: 'row', gap: 9, alignItems: 'center' }, brandMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.white, fontSize: 19, fontWeight: '700' }, brand: { fontSize: 22, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 },
  title: { ...ui.title }, subtitle: { marginTop: 5, fontSize: 16, lineHeight: 23, color: colors.muted }, pageHeading: { gap: 14, marginBottom: 4 },
  content: { paddingHorizontal: 22, paddingTop: 17, paddingBottom: 28, gap: 18, maxWidth: 620, width: '100%', alignSelf: 'center' },
  body: { ...ui.body }, label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.9, color: colors.muted },
  smallButton: { minHeight: 44, minWidth: 66, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 13, backgroundColor: colors.surface }, helpText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  message: { padding: 16, gap: 8, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }, userMessage: { backgroundColor: colors.accentSoft, borderColor: '#D2DED3' },
  error: { fontSize: 15, lineHeight: 22, color: colors.danger }, errorBox: { padding: 13, backgroundColor: '#F8E9E3', borderRadius: 14 }, input: { ...ui.input },
  contextNote: { padding: 15, backgroundColor: colors.accentSoft, borderRadius: 16 }, contextQuote: { padding: 14, borderLeftWidth: 3, borderLeftColor: colors.accent, backgroundColor: colors.surface, gap: 7 }, contextLabel: { fontSize: 11, color: colors.muted, fontWeight: '700', letterSpacing: 0.8 },
  micArea: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 9, gap: 3 },
  mic: { minHeight: 76, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#23392C', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  micIcon: { fontSize: 17, color: '#DDEADF', marginBottom: 1 }, micText: { fontSize: 17, fontWeight: '700', color: colors.white }, micHint: { fontSize: 12, color: '#DFE9E0', marginTop: 1 }, micPressed: { backgroundColor: '#294936', transform: [{ scale: 0.985 }] }, disabled: { opacity: 0.48 },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 7, paddingBottom: 2, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface },
  tab: { flex: 1, minHeight: 55, paddingVertical: 6, gap: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, activeTab: { backgroundColor: colors.accentSoft }, tabPressed: { opacity: 0.7 },
  tabIcon: { fontSize: 19, lineHeight: 22, color: colors.muted }, tabText: { fontSize: 12, lineHeight: 16, color: colors.muted, fontWeight: '500' }, selected: { color: colors.accent, fontWeight: '700' },
  diagnostics: { gap: 6, borderTopWidth: 1, borderColor: colors.line, paddingTop: 16 }, help: { flex: 1, padding: 22, gap: 24, backgroundColor: colors.canvas },
});
