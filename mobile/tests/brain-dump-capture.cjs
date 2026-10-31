// Mocked protocol/lifecycle checks only; these do not establish native Android capture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

let background;
let pc;
let permission = async () => {};
const sent = [];
const states = [];
const transcripts = [];
const failures = [];
const cancelled = [];
const appState = { currentState: 'active', addEventListener: (_, callback) => {
  background = callback; return { remove() { if (background === callback) background = undefined; } };
} };
class Peer {
  constructor() { pc = this; this.connectionState = 'connected'; }
  addTransceiver() { return { sender: { replaceTrack: async track => { this.track = track; } } }; }
  createDataChannel() { this.channel = { readyState: 'open', send: value => sent.push(JSON.parse(value)), close() {} }; return this.channel; }
  async createOffer() { return { sdp: 'test_sdp' }; }
  async setLocalDescription() {}
  async setRemoteDescription() { this.channel.onopen(); this.onconnectionstatechange(); }
  close() { this.connectionState = 'closed'; }
}
let track;
const originalLoad = Module._load;
Module._load = function(name, parent, isMain) {
  if (name === 'react-native') return { AppState: appState };
  if (name === 'react-native-webrtc') return {
    RTCPeerConnection: Peer,
    RTCSessionDescription: class { constructor(value) { Object.assign(this, value); } },
    mediaDevices: { getUserMedia: async () => {
      track = { enabled: false, stopped: false, stop() { this.stopped = true; } };
      return { getAudioTracks: () => [track], getTracks: () => [track], release() {} };
    } },
  };
  if (name === './api' && parent?.filename.endsWith('transcriptCapture.ts')) return {
    getAuthenticatedSession: async () => ({ userId: 'firebase-user', token: 'firebase-id-token' }),
    request: async path => { assert.match(path, /voice\/transcription$/); return { value: 'short_lived_key' }; },
  };
  if (name === './voice' && parent?.filename.endsWith('transcriptCapture.ts')) return {
    requestMicrophonePermission: (...args) => permission(...args),
  };
  return originalLoad.call(this, name, parent, isMain);
};
global.fetch = async () => ({ ok: true, text: async () => 'test_answer' });
const filename = path.resolve(__dirname, '../src/shared/transcriptCapture.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = new Module(filename, module);
loaded.filename = filename;
loaded.paths = module.paths;
loaded._compile(compiled, filename);
const { TranscriptCapture, transformInsertionAnchor } = loaded.exports;
const settle = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  assert.equal(transformInsertionAnchor('alpha omega', 'alpha NEW omega', 6), 10, 'insertion anchor moves with typing before it');
  assert.equal(transformInsertionAnchor('alpha omega', 'alpha omega!', 5), 5, 'typing after the anchor does not move it');
  assert.equal(transformInsertionAnchor('abcdef', 'abXYef', 3), 4, 'an edit across the anchor maps it after the replacement');
  const capture = new TranscriptCapture('run_one', {
    state: value => states.push(value),
    transcript: value => transcripts.push(value),
    failure: value => failures.push(value),
    cancelled: (...value) => cancelled.push(value),
  });
  await capture.hold('request_one');
  assert(states.includes('permission') && states.includes('connecting'), 'permission and connection stages are distinct');
  pc.channel.onmessage({ data: JSON.stringify({ type: 'session.created', session: { type: 'transcription', audio: { input: { turn_detection: null } } } }) });
  await settle();
  assert.equal(states.at(-1), 'recording', 'Recording is shown only after the track is live');
  assert.equal(track.enabled, true);
  await capture.release('request_one');
  assert.equal(track.stopped, true, 'release stops the microphone track');
  assert(sent.some(event => event.type === 'input_audio_buffer.commit'));
  assert(!sent.some(event => event.type === 'response.create'), 'transcription capture never requests a model response');
  pc.channel.onmessage({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'item_one', transcript: 'A dictated line.' }) });
  pc.channel.onmessage({ data: JSON.stringify({ type: 'input_audio_buffer.committed', item_id: 'item_one' }) });
  assert.equal(transcripts[0].runId, 'run_one');
  assert.equal(transcripts[0].requestId, 'request_one');
  assert.equal(transcripts[0].itemId, 'item_one');
  assert.equal(transcripts[0].text, 'A dictated line.');

  await capture.hold('request_two'); await settle();
  pc.channel.onmessage({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'item_one', transcript: 'duplicate text' }) });
  assert.equal(transcripts.length, 1, 'duplicate prior item cannot enter a later request');
  await capture.release('request_two');
  pc.channel.onmessage({ data: JSON.stringify({ type: 'input_audio_buffer.committed', item_id: 'item_two' }) });
  pc.channel.onmessage({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.failed', item_id: 'item_two' }) });
  assert.equal(failures.at(-1).requestId, 'request_two');
  const failureCount = failures.length;
  pc.channel.onmessage({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'item_two', transcript: 'late text' }) });
  assert.equal(transcripts.length, 1, 'late completion after failure is ignored');
  assert.equal(failures.length, failureCount);
  capture.close();

  const interrupted = new TranscriptCapture('run_interrupted', {
    state: value => states.push(value), transcript: value => transcripts.push(value),
    failure: value => failures.push(value), cancelled: (...value) => cancelled.push(value),
  });
  await interrupted.hold('request_interrupted');
  pc.channel.onmessage({ data: JSON.stringify({ type: 'session.created', session: { type: 'transcription', audio: { input: { turn_detection: null } } } }) });
  await settle();
  const interruptedTrack = track;
  appState.currentState = 'background'; background('background');
  assert.equal(interruptedTrack.stopped, true, 'background interruption stops the active track');
  assert.equal(failures.at(-1).kind, 'interrupted');
  assert.notEqual(states.at(-1), 'recording', 'capture does not restart automatically');
  appState.currentState = 'active';
  interrupted.close();

  let allowPermission;
  permission = () => new Promise(resolve => { allowPermission = resolve; });
  const early = new TranscriptCapture('run_early', {
    state: value => states.push(value), transcript: value => transcripts.push(value),
    failure: value => failures.push(value), cancelled: (...value) => cancelled.push(value),
  });
  const opening = early.hold('request_early');
  await settle();
  await early.release('request_early');
  allowPermission();
  await opening;
  assert.deepEqual(cancelled.at(-1), ['run_early', 'request_early']);
  assert.equal(states.at(-1), 'idle');
  early.close();
  console.log('Brain Dump transcription controller: permission/connection gates, cursor-anchor rebasing, release/commit, out-of-order and duplicate transcript correlation, failure, background interruption, and early-release cancellation passed. Native Android capture remains unverified.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Module._load = originalLoad; });
