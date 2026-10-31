const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const user = { uid: 'one', displayName: null, email: 'never-use-this@example.com' };
const auth = { currentUser: user };
let revision = 4;
let selected = { revision: 4,
  matches: [{ scope: 'shared_context', source_type: 'journal', label: 'Shared excerpt', excerpt: 'e'.repeat(900), private_draft: 'DO NOT FORWARD' }],
  preferences: Array.from({ length: 5 }, () => ({ intervention_id: 'grounding', rating: 'helpful', preference: 'p'.repeat(500) })),
};
let lastPurpose;
const result = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/features/call/callContext.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, {
  exports: result,
  require(name) {
    if (name.endsWith('/firebase')) return { firebaseAuth: auth };
    if (name.endsWith('/contextService')) return { getContextSnapshot: async purpose => { lastPurpose = purpose; return selected; } };
    if (name.endsWith('/contextRepository')) return { currentContextRevision: async () => revision };
    throw Error(name);
  },
});
(async () => {
  result.updateCallConversation('one', Array.from({ length: 9 }, (_, i) => ({ role: 'user', content: `${i}`.repeat(1000) })));
  const context = await result.prepareCallContext('one');
  assert.equal(lastPurpose, 'call');
  assert.equal(context.person_name, '', 'never infer a name from email');
  assert.equal(context.recent_messages.length, 6);
  assert.equal(context.recent_messages[0].content.length, 800);
  assert.equal(context.shared_excerpts[0].excerpt.length, 600);
  assert.equal(context.saved_preferences.length, 3);
  assert.equal(context.saved_preferences[0].preference.length, 240);
  assert(!JSON.stringify(context).includes('DO NOT FORWARD'));
  revision++;
  const revoked = await result.prepareCallContext('one');
  assert.equal(revoked.shared_excerpts.length, 0);
  assert.equal(revoked.saved_preferences.length, 0);
  assert.equal(await result.isCallContextCurrent('one', 4), false);
  selected = { revision, matches: [], preferences: [] };
  assert.equal((await result.prepareCallContext('one')).shared_excerpts.length, 0, 'retry reselects saved context');
  auth.currentUser = { uid: 'two', displayName: 'Sandy' };
  await assert.rejects(result.prepareCallContext('one'), /Sign in again/);
  assert.equal((await result.prepareCallContext('two')).recent_messages.length, 0, 'history never crosses accounts');
  result.clearCallConversation();
  console.log('Bounded call context, consent revision, retry and account checks passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
