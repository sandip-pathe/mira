import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, createSession, DemoSession, Message, request } from './api';
import { Journal } from './Journal';
import { Metric, Voice, VoiceState } from './voice';

type Tab = 'Journal' | 'Talk' | 'Actions';
type Action = { id: string; title: string; summary: string; steps: string[] };

function Mira() {
  const [tab, setTab] = useState<Tab>('Journal');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const history = useRef<Message[]>([]);
  const session = useRef<DemoSession | undefined>(undefined);
  const creating = useRef<Promise<DemoSession> | undefined>(undefined);
  const [state, setState] = useState<VoiceState>('disconnected');
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const voice = useRef<Voice | undefined>(undefined);
  if (!voice.current) voice.current = new Voice({ state: setState, error: setError,
    message: message => { history.current = [...history.current, message]; setMessages(history.current); },
    metric: metric => setMetrics(items => [...items.slice(-9), metric]),
    actions: setActions, urgentHelp: () => setUrgent(true),
  });
  useEffect(() => () => voice.current?.close(), []);

  async function getSession() {
    if (session.current && session.current.expires_at > Date.now() / 1000 + 30) return session.current;
    if (!creating.current) creating.current = createSession().then(value => { session.current = value; return value; }).finally(() => { creating.current = undefined; });
    return creating.current;
  }

  async function connect() {
    setError(''); setTextMode(false);
    try { await voice.current!.connect(await getSession(), history.current); }
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
      const result = await request<{ text: string }>(`/sessions/${current.session_id}/text`, current, { messages: next });
      history.current = [...next, { role: 'assistant', content: result.text }];
      setMessages(history.current); setText('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Mira is temporarily offline.'); }
    finally { setSending(false); }
  }

  function changeTab(next: Tab) {
    if (next !== tab) voice.current!.close();
    setTab(next);
  }

  const ready = ['ready', 'thinking', 'speaking', 'listening'].includes(state);
  return <SafeAreaView style={styles.page}>
    <View style={styles.header}><Text style={styles.brand}>Mira</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Help" style={styles.smallButton} onPress={() => {
        voice.current!.cancel();
        Alert.alert('Help', 'This demo is not connected to Mpower or a human support service.', [
          { text: 'Close', style: 'cancel' }, { text: 'Urgent help now', onPress: () => setUrgent(true) },
        ]);
      }}><Text style={styles.buttonText}>Help</Text></Pressable></View>
    {urgent ? <View style={styles.help}><Text style={styles.title}>Urgent help now</Text>
      <Text style={styles.body}>If you are in immediate danger, contact local emergency services or go to the nearest emergency department. If possible, reach someone you trust who can stay with you.</Text>
      <Text style={styles.body}>No one has been contacted through this demo.</Text>
      <Button title="Close help" onPress={() => setUrgent(false)} /></View> : <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{tab}</Text>
      <Text style={styles.body}>Synthetic demo · Native feasibility spike</Text>
      <View style={{ display: tab === 'Journal' ? 'flex' : 'none' }}><Journal draft={draft} setDraft={setDraft} getSession={getSession} visible={tab === 'Journal'} /></View>
      {tab === 'Talk' && <>
        <Text accessibilityLiveRegion="polite" style={styles.body}>{state === 'ready' ? 'Hold to talk' : state}</Text>
        <Text style={styles.body}>No journal context has been shared. Microphone off unless held.</Text>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!ready && <Button title={state === 'connecting' ? 'Connecting…' : 'Retry voice'} disabled={state === 'connecting'} onPress={() => void connect()} />}
        <Button title="Continue with text" onPress={() => { voice.current!.close(); setTextMode(true); }} />
        {messages.map((message, index) => <View key={index} style={styles.message}><Text style={styles.label}>{message.role === 'user' ? 'You' : 'Mira'}</Text><Text style={styles.body}>{message.content}</Text></View>)}
        {textMode && <><TextInput accessibilityLabel="Text message" value={text} onChangeText={setText} multiline style={styles.input} placeholder="Write to Mira…" />
          <Button title={sending ? 'Sending…' : 'Send'} disabled={sending || !text.trim()} onPress={() => void sendText()} /></>}
        {__DEV__ && <View style={styles.diagnostics}><Text style={styles.label}>Gate evidence · Android {Platform.Version}</Text>
          <Text style={styles.body}>{API_URL}</Text>
          {metrics.map((metric, index) => <Text key={index} style={styles.body}>{metric.event}{metric.ms === undefined ? '' : `: ${metric.ms} ms`}</Text>)}</View>}
      </>}
      {tab === 'Actions' && <><Text style={styles.body}>Neutral demo placeholders. Ask Mira to offer the two activities to test the tool relay.</Text>
        {actions.length === 0 && <Text style={styles.body}>No actions loaded yet.</Text>}
        {actions.map(action => <View style={styles.message} key={action.id}><Text style={styles.label}>{action.title}</Text><Text style={styles.body}>{action.summary}</Text></View>)}
        {!!actions.length && <Text style={styles.body}>These activities are previews in this demo.</Text>}
      </>}
    </ScrollView>}
    {tab === 'Talk' && !urgent && !textMode && <View style={styles.micArea}>
      <Pressable accessibilityRole="button" accessibilityLabel="Hold to talk. Release to send. Hold while Mira speaks to interrupt."
        accessibilityState={{ disabled: !ready }} disabled={!ready}
        onPressIn={() => voice.current!.press()} onPressOut={() => voice.current!.release()}
        style={[styles.mic, !ready && styles.disabled]}><Text style={styles.micText}>{state === 'listening' ? 'Listening · release to send' : 'Hold to talk'}</Text></Pressable>
      <Button title="Cancel turn" disabled={!ready} onPress={() => voice.current!.cancel()} />
    </View>}
    <View style={styles.tabs}>{(['Talk', 'Journal', 'Actions'] as const).map(item => <Pressable key={item}
      accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => changeTab(item)} style={styles.tab}>
      <Text style={[styles.body, tab === item && styles.selected]}>{item}</Text></Pressable>)}</View>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><Mira /></SafeAreaProvider>; }
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FAF7F1' }, header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 28, fontWeight: '600', color: '#302C28' }, title: { fontSize: 28, fontWeight: '600', color: '#302C28' },
  content: { padding: 20, gap: 18 }, body: { fontSize: 16, color: '#302C28', lineHeight: 24 }, label: { fontSize: 18, fontWeight: '600', color: '#302C28' },
  smallButton: { minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#746A60', borderRadius: 10 }, buttonText: { fontSize: 16, color: '#302C28' },
  message: { padding: 16, gap: 8, borderRadius: 12, backgroundColor: '#EEE7DB' }, error: { fontSize: 16, color: '#8D2926' },
  input: { minHeight: 80, fontSize: 18, padding: 12, borderWidth: 1, borderColor: '#746A60', borderRadius: 10 },
  micArea: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 }, mic: { minHeight: 64, padding: 16, borderRadius: 16, backgroundColor: '#36584B', alignItems: 'center', justifyContent: 'center' },
  micText: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' }, disabled: { opacity: 0.5 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#C5BCAE' }, tab: { flex: 1, minHeight: 56, padding: 12, alignItems: 'center', justifyContent: 'center' }, selected: { fontWeight: '700', textDecorationLine: 'underline' },
  diagnostics: { gap: 6, borderTopWidth: 1, borderColor: '#C5BCAE', paddingTop: 16 }, help: { flex: 1, padding: 20, gap: 24 },
});
