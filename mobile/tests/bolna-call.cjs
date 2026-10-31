const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

let deliverSession;
let microphoneRequests = 0;
const session = new Promise(resolve => { deliverSession = resolve; });
const output = ts.transpileModule(fs.readFileSync('src/features/call/BolnaCall.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exportsObject = {};
vm.runInNewContext(output, {
  exports: exportsObject, AbortController, setTimeout, clearTimeout,
  require(name) {
    if (name.includes('microphoneLease')) return require('./load-microphone-lease.cjs');
    if (name === './callContext') return {
      prepareCallContext: async () => ({ context_version: 1, consent_revision: 1 }),
      isCallContextCurrent: async () => true,
    };
    if (name === 'sip.js') return { SessionState: { Established: 'Established', Establishing: 'Establishing' } };
    if (name.includes('shared/api')) return {
      getAuthenticatedSession: async () => ({ userId: 'test' }), requestWithRenewal: () => session,
    };
    if (name === 'react-native-webrtc') return {
      mediaDevices: { getUserMedia: async () => { microphoneRequests++; throw Error('unexpected mic'); } },
    };
    throw Error(name);
  },
});
(async () => {
  const states = [];
  const call = new exportsObject.BolnaCall(state => states.push(state));
  const starting = call.start();
  await new Promise(setImmediate);
  call.stop();
  deliverSession({});
  await starting;
  assert.equal(microphoneRequests, 0, 'cancel during mint must not acquire microphone');
  assert.deepEqual(states, ['connecting', 'ended']);
  call.stop();
  assert.equal(states.length, 2, 'hang-up must be idempotent');
  console.log('Bolna cancellation checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
