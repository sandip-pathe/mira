// Focused controller checks; these do not assert native audio/device feasibility.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

let background;
let pc;
let track;
let delayedTool;
let holdTool = false;
const sent = [];
const states = [];
const messages = [];
const decisions = [];
const metrics = [];
const errors = [];
const appState = { currentState: 'active', addEventListener: (_, callback) => {
  background = callback; return { remove() { background = undefined; } };
} };
class Peer {
  constructor() { pc = this; this.connectionState = 'connected'; }
  addTrack() {}
  createDataChannel() {
    this.channel = { readyState: 'open', send: payload => sent.push(JSON.parse(payload)), close() {} };
    return this.channel;
  }
  async createOffer() { return { sdp: 'test_sdp' }; }
  async setLocalDescription() {}
  async setRemoteDescription() { this.channel.onopen(); }
  close() {}
}
const api = { request: async (url, _, body) => {
  if (url.endsWith('/voice')) return { value: 'ephemeral_test', generation: 1 };
  if (url.includes('/tool-calls?')) return { registered: true };
  if (url.endsWith('/tools')) {
    if (holdTool) await new Promise(resolve => { delayedTool = resolve; });
    return { call_id: body.call_id, result: { decision: { route: 'offer_intervention', intervention: { id: 'pause_60s', title: 'A short pause' } } } };
  }
  throw new Error('Unexpected endpoint');
} };
const originalLoad = Module._load;
Module._load = function(name, parent, isMain) {
  if (name === 'react-native') return { AppState: appState, Platform: { OS: 'android' }, PermissionsAndroid: {
    PERMISSIONS: { RECORD_AUDIO: 'mic' }, RESULTS: { GRANTED: 'granted' }, request: async () => 'granted',
  } };
  if (name === 'react-native-webrtc') return {
    RTCPeerConnection: Peer, RTCSessionDescription: class { constructor(value) { Object.assign(this, value); } },
    mediaDevices: { getUserMedia: async () => {
      track = { enabled: true, stopped: false, stop() { this.stopped = true; } };
      return { getAudioTracks: () => [track], getTracks: () => [track] };
    } },
  };
  if (name === './api' && parent?.filename.endsWith('voice.ts')) return api;
  return originalLoad.call(this, name, parent, isMain);
};
global.fetch = async () => ({ ok: true, text: async () => 'test_answer' });
const filename = path.resolve(__dirname, '../src/shared/voice.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { Voice } = loaded.exports;
const voice = new Voice({ state: value => states.push(value), message: value => messages.push(value),
  error: value => errors.push(value), metric: value => metrics.push(value), decision: value => decisions.push(value), urgentHelp() {} });
const emit = event => pc.channel.onmessage({ data: JSON.stringify(event) });
const settle = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const session = { session_id: 'demo', capability: 'cap', expires_at: Date.now() / 1000 + 3600 };
  await voice.connect(session, [{ role: 'user', content: 'confirmed earlier turn' }]);
  assert.equal(track.enabled, false, 'mic disabled before connection');
  voice.press();
  assert.equal(track.enabled, false, 'mic cannot enable before manual session config acknowledged');
  emit({ type: 'session.updated', session: { audio: { input: { turn_detection: null } } } });
  assert.equal(states.at(-1), 'ready');
  voice.press();
  assert.equal(track.enabled, true);
  assert.equal(sent.at(-1).type, 'input_audio_buffer.clear');
  voice.holdAt -= 500;
  voice.release();
  assert.equal(track.enabled, false);
  assert.equal(sent.at(-1).type, 'input_audio_buffer.commit');
  emit({ type: 'input_audio_buffer.committed' });
  assert.equal(sent.at(-1).type, 'response.create');
  emit({ type: 'response.created', response: { id: 'response_one' } });
  const remote = { enabled: true };
  pc.ontrack({ track: remote });
  emit({ type: 'output_audio_buffer.started', response_id: 'response_one' });
  voice.press();
  assert.equal(track.enabled, true);
  assert.equal(remote.enabled, false, 'output muted immediately on interruption');
  assert.deepEqual(sent.slice(-3).map(event => event.type), ['response.cancel', 'output_audio_buffer.clear', 'input_audio_buffer.clear']);
  emit({ type: 'response.output_audio_transcript.done', response_id: 'response_one', transcript: 'unheard old caption' });
  assert.equal(messages.length, 0, 'cancelled captions never restored as heard context');
  voice.cancel();
  assert.equal(track.enabled, false);
  assert.equal(remote.enabled, false);

  // Normal phone relay must return function_call_output, then request continuation.
  voice.press(); voice.holdAt -= 500; voice.release();
  emit({ type: 'input_audio_buffer.committed' });
  emit({ type: 'response.created', response: { id: 'response_two' } });
  emit({ type: 'response.function_call_arguments.done', call_id: 'call_one', name: 'choose_support', arguments: '{"user_message":"I feel stuck","situation_summary":"Stuck","current_need":"A next step"}' });
  emit({ type: 'response.done', response: { id: 'response_two', status: 'completed' } });
  await settle();
  assert(sent.some(event => event.item?.type === 'function_call_output' && event.item.call_id === 'call_one'));
  assert.equal(sent.at(-1).type, 'response.create');
  assert.equal(decisions.length, 1);

  // Cancel while the tool is in flight; its late result cannot restart output.
  holdTool = true;
  emit({ type: 'response.created', response: { id: 'response_three' } });
  emit({ type: 'response.function_call_arguments.done', call_id: 'call_two', name: 'choose_support', arguments: '{"user_message":"I feel stuck","situation_summary":"Stuck","current_need":"A next step"}' });
  await settle();
  voice.cancel();
  const count = sent.length;
  delayedTool();
  await settle();
  assert.equal(sent.length, count, 'late cancelled tool causes no provider continuation');
  assert.equal(decisions.length, 1, 'late cancelled decision result is not shown');
  // Captions are retained only after a completed response finishes playback.
  voice.press(); voice.holdAt -= 500; voice.release();
  emit({ type: 'input_audio_buffer.committed' });
  emit({ type: 'response.created', response: { id: 'response_four' } });
  emit({ type: 'output_audio_buffer.started', response_id: 'response_four' });
  emit({ type: 'response.output_audio_transcript.done', response_id: 'response_four', transcript: 'confirmed heard reply' });
  emit({ type: 'response.done', response: { id: 'response_four', status: 'completed' } });
  assert.equal(messages.length, 0, 'generated caption is not yet heard history');
  emit({ type: 'output_audio_buffer.stopped', response_id: 'response_four' });
  assert.equal(messages.at(-1).content, 'confirmed heard reply');
  // An old commit acknowledgement cannot trigger a new response after cancellation.
  voice.press(); voice.holdAt -= 500; voice.release();
  voice.cancel();
  const beforeOldCommit = sent.length;
  emit({ type: 'input_audio_buffer.committed' });
  assert.equal(sent.length, beforeOldCommit);
  voice.press();
  assert.equal(track.enabled, true);
  const oldTrack = track;
  appState.currentState = 'background'; background('background');
  assert.equal(oldTrack.enabled, false);
  assert.equal(oldTrack.stopped, true);
  assert.equal(states.at(-1), 'disconnected');
  assert.equal(errors.length, 0);
  voice.close();
  console.log('Voice controller: mic gate, release, interruption, relay, late-tool cancellation, background cleanup passed. Native Android gate remains pending.');
})().catch(error => { voice.close(); console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
