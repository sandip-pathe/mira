// Store and resource ownership checks. Native device behavior remains unverified.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const { claimMicrophone } = require('./load-microphone-lease.cjs');
const calls = [], systems = [];
let contextRevoked;
const talkReturn = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/call/callTalkReturn.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: talkReturn });
class FakeCall {
  constructor(update) { this.update = update; calls.push(this); }
  reserveMicrophone() { this.release = claimMicrophone(this); }
  start() { this.started = true; }
  stop() { this.release?.(); this.stopped = true; }
  mute(value) { this.muted = value; }
  hold(value) { this.held = value; }
}
class FakeSystem {
  constructor(uuid, callbacks) { this.callbacks = callbacks; systems.push(this); }
  start() { return new Promise(resolve => { this.ready = resolve; }); }
  connected() { this.active = true; }
  ringing(value) { this.isRinging = value; }
  stop() { this.isRinging = false; this.stopped = true; this.ready?.(); }
  status() {}
  mute() {}
  route() {}
}
const result = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/call/callController.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, {
  exports: result, Date,
  require(name) {
    if (name === 'react-native') return { AppState: { currentState: 'active' } };
    if (name === 'expo-crypto') return { randomUUID: () => 'test-uuid' };
    if (name === 'react') return {};
    if (name === './BolnaCall') return { BolnaCall: FakeCall };
    if (name === './AndroidCallSystem') return { AndroidCallSystem: FakeSystem };
    if (name.endsWith('demoEvents')) return { onContextRevoked: listener => {
      contextRevoked = listener; return () => { contextRevoked = undefined; };
    } };
    if (name === './callContext') return { clearCallConversation() {} };
    if (name === './callTalkReturn') return {
      ...talkReturn,
      stageCallTalkReturn() {
        assert.equal(calls.at(-1).stopped, true, 'close provider before staging text fallback');
        assert.equal(systems.at(-1).stopped, true, 'close native call before staging text fallback');
        const release = claimMicrophone({}); release();
        talkReturn.stageCallTalkReturn();
      },
    };
    throw Error(name);
  },
});

(async () => {
  const controller = result.callController;
  const start = controller.start();
  await controller.start();
  assert.equal(calls.length, 1, 'double tap must not start two calls');
  assert.throws(() => claimMicrophone({}), /Microphone is in use/);
  systems[0].ready(); await start;
  assert.notEqual(systems[0].isRinging, true, 'connecting must not synthesize ringing');
  calls[0].update('ringing');
  assert.equal(systems[0].isRinging, true);
  systems[0].callbacks.hold(true);
  assert.equal(systems[0].isRinging, false, 'interruption stops ringback');
  systems[0].callbacks.hold(false);
  assert.equal(systems[0].isRinging, true);
  calls[0].update('connected');
  assert.equal(systems[0].isRinging, false, 'answer stops ringback');
  const connectedAt = controller.getSnapshot().connectedAt;
  calls[0].update('reconnecting'); calls[0].update('connected');
  assert.equal(controller.getSnapshot().connectedAt, connectedAt, 'reconnect preserves timer');
  const unsubscribe = controller.subscribe(() => {});
  unsubscribe();
  assert.equal(calls[0].stopped, undefined, 'screen unsubscription must not end call');
  systems[0].callbacks.hold(true);
  assert.equal(calls[0].held, true);
  controller.mute();
  assert.equal(calls[0].muted, true);
  systems[0].callbacks.fail('Interrupted');
  assert.equal(controller.getSnapshot().state, 'failed');
  assert.equal(calls[0].stopped, true);
  assert.equal(systems[0].stopped, true);
  controller.continueWithTalk();
  assert.equal(talkReturn.consumeCallTalkReturn(), true);
  assert.equal(talkReturn.consumeCallTalkReturn(), false, 'fallback is consumed once');
  const restart = controller.start();
  calls[0].update('ended');
  assert.equal(controller.getSnapshot().state, 'connecting', 'old call must not end new attempt');
  controller.end(); await restart;
  assert.equal(calls[1].started, undefined, 'cancelled native setup must not start provider audio');
  const release = claimMicrophone({}); release();
  const revokedStart = controller.start();
  contextRevoked(); await revokedStart;
  assert.equal(controller.getSnapshot().state, 'failed');
  assert.match(controller.getSnapshot().error, /Shared context changed/);
  assert.equal(contextRevoked, undefined, 'revocation listener is released with the call');
  console.log('Call lifecycle and microphone ownership checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
