import json
import time
import sqlite3
from concurrent.futures import ThreadPoolExecutor
import tempfile
import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from server import app as backend
from server.interventions.catalog import PRIMARY_ACTIVITY_IDS, all_interventions, primary_interventions
from server.interventions.eligibility import eligible_interventions
from server.interventions.client_registry import SUPPORTED_CLIENTS
from server.interventions.decision import DecisionInput, select_support
from server.store import DemoStore


class DecisionContract(unittest.IsolatedAsyncioTestCase):
    async def test_current_talk_selector_receives_only_the_nine_primary_activities(self):
        fake = AsyncMock(return_value={'route': 'listen', 'situation_summary': '', 'question': '',
            'offer_reason': '', 'ranked_ids': [], 'intervention': None})
        with patch('server.app.select_support', fake):
            await backend.choose_support({'user_message': 'Hello'},
                compatible_activity_ids=SUPPORTED_CLIENTS[('activity-ui-11', '0.14')])
        offered = fake.call_args.args[1]
        self.assertEqual(tuple(item['id'] for item in offered), PRIMARY_ACTIVITY_IDS)
        expected_groups = {
            'grounding': 'Follow a guide', 'paced_breathing': 'Follow a guide',
            'brain_dump': 'Express', 'one_small_step': 'Move forward',
            'name_a_feeling': 'Express', 'unsent_letter': 'Express',
            'reach_out': 'Move forward', 'short_movement': 'Take a break',
            'one_song_break': 'Take a break',
        }
        self.assertEqual({item['id']: item['category'] for item in offered}, expected_groups)

    def test_catalog_presentation_covers_every_activity(self):
        catalog = all_interventions()
        self.assertEqual(len(catalog), 13)
        for item in catalog:
            with self.subTest(activity=item['id']):
                presentation = item['presentation']
                self.assertIn(presentation['pattern'], ('sort', 'capture', 'steps', 'letter', 'grounding', 'breathing'))
                self.assertIn(presentation['input'], ('none', 'next_step', 'draft', 'choice_or_text', 'letter', 'reflection'))
                self.assertIsInstance(presentation['optional_timer'], bool)
                self.assertGreater(item['duration_seconds'], 0)
                self.assertTrue(item['steps'])
                self.assertEqual(item, backend.get_intervention(item['id']))
        timers = {item['id']: item['duration_seconds'] for item in catalog if item['presentation']['optional_timer']}
        self.assertEqual(timers, {'short_movement': 300})

    def test_explicit_empty_review_allowlist_allows_nothing(self):
        self.assertEqual(eligible_interventions(all_interventions(), allowed_review_states=set()), [])

    async def test_eligibility_and_selector_return_only_canonical_eligible_item(self):
        catalog = eligible_interventions(primary_interventions(), excluded_ids={'paced_breathing'})
        self.assertEqual(len(catalog), 8)
        provider = AsyncMock(return_value={'output': [{'content': [{'type': 'output_text', 'text':
            '{"route":"offer_intervention","situation_summary":"Stuck","question":"","offer_reason":"Asked for a step","ranked_ids":["one_small_step","paced_breathing"]}'}]}]})
        result = await select_support(DecisionInput(user_message='I feel stuck'), catalog, provider)
        self.assertEqual(result['route'], 'offer_intervention')
        self.assertEqual(result['ranked_ids'], ['one_small_step'])
        self.assertEqual(result['intervention']['id'], 'one_small_step')

    async def test_empty_or_invalid_selector_fails_closed_to_listen(self):
        provider = AsyncMock(return_value={'output': [{'content': [{'type': 'output_text', 'text':
            '{"route":"offer_intervention","situation_summary":"","question":"","offer_reason":"","ranked_ids":[]}'}]}]})
        result = await select_support(DecisionInput(), eligible_interventions(all_interventions()), provider)
        self.assertEqual(result['route'], 'listen')
        provider.reset_mock()
        result = await select_support(DecisionInput(), [], provider)
        self.assertEqual(result['route'], 'listen')
        self.assertIsNone(result['intervention'])
        provider.assert_not_awaited()

    async def test_malformed_selector_has_the_same_response_shape(self):
        provider = AsyncMock(return_value={'output': []})
        invalid = await select_support(DecisionInput(), all_interventions(), provider)
        empty = await select_support(DecisionInput(), [], provider)
        self.assertEqual(invalid, empty)


class RelayContract(unittest.TestCase):
    def setUp(self):
        backend.sessions.clear()
        backend.creation_times.clear()
        self.temp_dir = tempfile.TemporaryDirectory()
        backend.store = DemoStore(self.temp_dir.name + '/test.db')
        self.client = TestClient(backend.app)
        result = self.client.post('/sessions', json={'session_id': str(uuid4())}).json()
        self.session_id = result['session_id']
        self.headers = {'Authorization': 'Bearer ' + result['capability']}
        self.path = '/sessions/' + self.session_id
        backend.sessions[self.session_id]['voice_generation'] = 1
        self.call = {'call_id': 'call_demo', 'name': 'choose_support',
                     'arguments': {'user_message': 'Work feels stuck', 'situation_summary': 'Too many tasks', 'current_need': 'A next step'}}

    def tearDown(self):
        backend.store.db.close()
        self.temp_dir.cleanup()

    def register(self, call=None):
        return self.client.post(self.path + '/tool-calls?generation=1', headers=self.headers, json=call or self.call)

    def start_activity(self, intervention_id, *, consented=True):
        capabilities = {
            'client_version': 'activity-ui-11',
            'catalog_version': '0.14',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')]),
        }
        return self.client.post(self.path + f'/interventions/{intervention_id}/start', headers=self.headers,
            json={'consented': consented, 'client_run_id': str(uuid4()),
                  'client_activity_capabilities': capabilities})

    def test_current_actions_and_talk_catalog_expose_nine_while_legacy_content_remains_readable(self):
        actions = self.client.get(self.path + '/actions', headers=self.headers).json()['actions']
        talk_catalog = self.client.get(self.path + '/interventions', headers=self.headers).json()['interventions']
        self.assertEqual(tuple(item['id'] for item in actions), PRIMARY_ACTIVITY_IDS)
        self.assertEqual(tuple(item['id'] for item in talk_catalog), PRIMARY_ACTIVITY_IDS)
        self.assertEqual(len(primary_interventions()), 9)
        self.assertEqual(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')], frozenset(PRIMARY_ACTIVITY_IDS) | {'task_reset_60s'})
        self.assertEqual(self.client.get(self.path + '/interventions/task_reset_60s', headers=self.headers).status_code, 200)
        self.assertEqual(self.client.get(self.path + '/interventions/write_100_words/activity', headers=self.headers).status_code, 200)
        unsupported = self.client.post(self.path + '/interventions/perspective_shift/start', headers=self.headers,
            json={'consented': True, 'client_run_id': str(uuid4()), 'client_activity_capabilities': {
                'client_version': 'activity-ui-11', 'catalog_version': '0.14',
                'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')]),
            }})
        self.assertEqual(unsupported.status_code, 404)

    def test_each_primary_activity_has_compatible_content_and_can_start(self):
        capabilities = {
            'client_version': 'activity-ui-11',
            'catalog_version': '0.14',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')]),
        }
        for activity_id in PRIMARY_ACTIVITY_IDS:
            with self.subTest(activity=activity_id):
                content = self.client.get(self.path + f'/interventions/{activity_id}/activity', headers=self.headers)
                self.assertEqual(content.status_code, 200)
                self.assertEqual(content.json()['catalog_version'], '0.14')
                started = self.client.post(self.path + f'/interventions/{activity_id}/start', headers=self.headers,
                    json={'consented': True, 'client_run_id': str(uuid4()), 'client_activity_capabilities': capabilities})
                self.assertEqual(started.status_code, 200)
                self.assertEqual(started.json()['action_id'], activity_id)

    def relay(self, call=None, *, preferences=None, declines=None, revision=0):
        return self.client.post(self.path + '/tools', headers=self.headers, json={
            'call': call or self.call, 'approved_preferences': preferences or [],
            'declined_interventions': declines or [], 'consent_revision': revision,
        })

    def test_activity_capability_gate_and_start_retry_are_idempotent(self):
        ids = sorted(SUPPORTED_CLIENTS[('activity-ui-1', '0.04')])
        run_id = str(uuid4())
        payload = {
            'consented': True,
            'client_run_id': run_id,
            'client_activity_capabilities': {
                'client_version': 'activity-ui-1',
                'catalog_version': '0.04',
                'activity_ids': ids,
            },
        }
        incompatible = {
            **payload,
            'client_activity_capabilities': {
                **payload['client_activity_capabilities'],
                'catalog_version': '0.05',
            },
        }
        rejected = self.client.post(
            self.path + '/interventions/task_reset_60s/start',
            headers=self.headers,
            json=incompatible,
        )
        self.assertEqual(rejected.status_code, 404)

        endpoint = self.path + '/interventions/task_reset_60s/start'
        first = self.client.post(endpoint, headers=self.headers, json=payload)
        retry = self.client.post(endpoint, headers=self.headers, json=payload)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(first.json()['id'], retry.json()['id'])
        self.assertEqual(len(backend.sessions[self.session_id]['runs']), 1)

    def test_one_small_step_catalog_and_capability_start(self):
        capabilities = {
            'client_version': 'activity-ui-3',
            'catalog_version': '0.06',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-3', '0.06')]),
        }
        content = self.client.get(
            self.path + '/interventions/one_small_step/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertEqual(content.json()['title'], 'One Small Step')
        started = self.client.post(
            self.path + '/interventions/one_small_step/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['state'], 'started')

    def test_paced_breathing_catalog_and_legacy_alias_start(self):
        capabilities = {
            'client_version': 'activity-ui-6',
            'catalog_version': '0.09',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-6', '0.09')]),
        }
        content = self.client.get(
            self.path + '/interventions/paced_breathing/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertEqual(content.json()['presentation']['pattern'], 'breathing')
        legacy = self.client.get(
            self.path + '/interventions/pause_60s/activity',
            headers=self.headers,
        )
        self.assertEqual(legacy.status_code, 200)
        self.assertEqual(legacy.json()['id'], 'paced_breathing')
        started = self.client.post(
            self.path + '/interventions/pause_60s/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['action_id'], 'paced_breathing')

    def test_reach_out_catalog_and_capability_start(self):
        capabilities = {
            'client_version': 'activity-ui-7',
            'catalog_version': '0.10',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-7', '0.10')]),
        }
        content = self.client.get(
            self.path + '/interventions/reach_out/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertFalse(content.json()['requires_person'])
        self.assertIn('Mira will not send it', content.json()['summary'])
        started = self.client.post(
            self.path + '/interventions/reach_out/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['action_id'], 'reach_out')

    def test_short_movement_catalog_and_capability_start(self):
        capabilities = {
            'client_version': 'activity-ui-8',
            'catalog_version': '0.11',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-8', '0.11')]),
        }
        content = self.client.get(
            self.path + '/interventions/short_movement/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertEqual(content.json()['title'], 'Move / Change Your Scene')
        self.assertIn('no-movement break', content.json()['summary'])
        started = self.client.post(
            self.path + '/interventions/short_movement/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['action_id'], 'short_movement')

    def test_one_song_break_catalog_capability_and_legacy_alias(self):
        capabilities = {
            'client_version': 'activity-ui-9',
            'catalog_version': '0.12',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-9', '0.12')]),
        }
        content = self.client.get(
            self.path + '/interventions/one_song_break/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertEqual(content.json()['title'], 'One Song Break')
        self.assertFalse(content.json()['presentation']['optional_timer'])
        legacy = self.client.get(
            self.path + '/interventions/one_song_reset/activity',
            headers=self.headers,
        )
        self.assertEqual(legacy.status_code, 200)
        self.assertEqual(legacy.json()['id'], 'one_song_break')
        started = self.client.post(
            self.path + '/interventions/one_song_reset/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['action_id'], 'one_song_break')

    def test_brain_dump_catalog_and_current_typing_capability(self):
        capabilities = {
            'client_version': 'activity-ui-11',
            'catalog_version': '0.14',
            'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')]),
        }
        content = self.client.get(
            self.path + '/interventions/brain_dump/activity',
            headers=self.headers,
        )
        self.assertEqual(content.status_code, 200)
        self.assertEqual(content.json()['catalog_version'], '0.14')
        self.assertEqual(content.json()['presentation']['pattern'], 'capture')
        started = self.client.post(
            self.path + '/interventions/brain_dump/start',
            headers=self.headers,
            json={
                'consented': True,
                'client_run_id': str(uuid4()),
                'client_activity_capabilities': capabilities,
            },
        )
        self.assertEqual(started.status_code, 200)
        self.assertEqual(started.json()['action_id'], 'brain_dump')

    def finished_feedback_payload(self):
        run = self.start_activity('pause_60s').json()
        self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers,
            json={'state': 'completed'})
        return {'action_run_id': run['id'], 'rating': 'yes', 'reuse_context': True,
                'helpful_lesson': 'Mira may suggest a pause again.'}

    def test_feedback_retry_returns_original_save_without_duplicate_rows(self):
        payload = self.finished_feedback_payload()
        first = self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        retry = self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(first.json(), retry.json())
        self.assertEqual(first.json()['action_run_id'], payload['action_run_id'])
        self.assertEqual(len(backend.store.feedback()), 1)
        self.assertEqual(len(backend.store._rows('SELECT * FROM action_runs')), 1)

    def test_completion_retry_is_idempotent_but_cannot_change_final_outcome(self):
        payload = self.finished_feedback_payload()
        endpoint = self.path + f"/action-runs/{payload['action_run_id']}"
        self.assertEqual(self.client.patch(endpoint, headers=self.headers, json={'state': 'completed'}).status_code, 200)
        self.assertEqual(self.client.patch(endpoint, headers=self.headers, json={'state': 'stopped'}).status_code, 409)

    def test_feedback_retry_cannot_restore_revoked_or_deleted_preference(self):
        payload = self.finished_feedback_payload()
        saved = self.client.post(self.path + '/feedback', headers=self.headers, json=payload).json()
        self.client.patch(self.path + f"/feedback/{saved['id']}/reuse?reuse_context=false", headers=self.headers)
        self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=payload).status_code, 409)
        self.assertEqual(backend.store.feedback()[0]['reuse_context'], 0)
        self.client.delete(self.path + f"/feedback/{saved['id']}", headers=self.headers)
        self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=payload).status_code, 409)
        self.assertEqual(backend.store.feedback(), [])

    def test_concurrent_feedback_submissions_share_one_saved_result(self):
        payload = self.finished_feedback_payload()
        def submit(_):
            return self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        with ThreadPoolExecutor(max_workers=4) as pool:
            results = list(pool.map(submit, range(4)))
        self.assertTrue(all(result.status_code == 200 for result in results))
        self.assertEqual(len({result.json()['id'] for result in results}), 1)
        self.assertEqual(len(backend.store.feedback()), 1)

    def test_feedback_retry_cannot_change_the_saved_preference(self):
        payload = self.finished_feedback_payload()
        self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        changed = {**payload, 'helpful_lesson': 'Different permission text.'}
        self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=changed).status_code, 409)
        self.assertEqual(backend.store.feedback()[0]['helpful_lesson'], payload['helpful_lesson'])

    def test_feedback_transaction_rolls_back_run_when_preference_write_fails(self):
        payload = self.finished_feedback_payload()
        backend.store.db.execute('''CREATE TRIGGER reject_feedback BEFORE INSERT ON feedback
          BEGIN SELECT RAISE(ABORT, 'injected write failure'); END''')
        with self.assertRaises(sqlite3.IntegrityError):
            self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        self.assertIsNone(backend.store.action_run(payload['action_run_id']))
        backend.store.db.execute('DROP TRIGGER reject_feedback')
        self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=payload).status_code, 200)

    def test_declined_feedback_retry_remains_unsaved(self):
        payload = {**self.finished_feedback_payload(), 'reuse_context': False, 'helpful_lesson': None}
        for _ in range(2):
            result = self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json(), {'id': None, 'saved': False})
        self.assertEqual(backend.store.feedback(), [])

    def test_reset_invalidates_unsaved_runs_and_saved_feedback_retries(self):
        unsaved = self.finished_feedback_payload()
        saved = self.finished_feedback_payload()
        self.client.post(self.path + '/feedback', headers=self.headers, json=saved)
        self.client.post(self.path + '/reset', headers=self.headers, json={})
        for payload in (unsaved, saved):
            self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=payload).status_code, 409)
        self.assertEqual(backend.store.feedback(), [])

    def test_round_trip_and_replay_rejection(self):
        decision = {'route': 'offer_intervention', 'situation_summary': 'Too many tasks', 'question': '',
            'offer_reason': 'User asked for a next step', 'ranked_ids': ['task_reset_60s'],
            'intervention': backend.get_intervention('task_reset_60s')}
        with patch.object(backend, 'choose_support', new=AsyncMock(return_value=decision)):
            self.assertEqual(self.register().status_code, 200)
            pending = backend.sessions[self.session_id]['pending']['call_demo']
            self.assertNotIn('call', pending)
            self.assertEqual(len(pending['digest']), 64)
            result = self.relay()
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()['call_id'], 'call_demo')
            self.assertEqual(result.json()['result']['decision']['intervention']['id'], 'task_reset_60s')
        self.assertEqual(self.relay().status_code, 409)
        self.assertEqual(self.register().status_code, 409)

    def test_voice_worker_uses_only_device_supplied_preferences(self):
        backend.sessions[self.session_id]['compatible_activity_ids'] = set(PRIMARY_ACTIVITY_IDS)
        output = {'route': 'listen', 'situation_summary': '', 'question': '', 'offer_reason': '', 'ranked_ids': []}
        fake = AsyncMock(return_value={'output': [{'content': [{'type': 'output_text', 'text': json.dumps(output)}]}]})
        preference = {'intervention_id': 'pause_60s', 'rating': 'yes', 'preference': 'A pause helped me reset.'}
        with patch.object(backend, 'provider', fake), patch.object(backend.store, 'feedback',
                side_effect=AssertionError('worker must not query saved server preferences')):
            self.assertEqual(self.register().status_code, 200)
            result = self.relay(preferences=[preference], declines=['pause_60s'], revision=8)
        self.assertEqual(result.status_code, 200, result.text)
        received = json.loads(fake.call_args.kwargs['json']['input'])['conversation']
        self.assertEqual(received['preferences'][0]['intervention_id'], 'pause_60s')
        self.assertNotIn('pause_60s', fake.call_args.kwargs['json']['text']['format']['schema']['properties']['ranked_ids']['items']['enum'])

    def test_capability_expiry_and_mismatch(self):
        relay = {'call': self.call, 'approved_preferences': [], 'declined_interventions': [], 'consent_revision': 0}
        self.assertEqual(self.client.post(self.path + '/tools', json=relay).status_code, 401)
        self.assertEqual(self.client.post('/sessions/' + str(uuid4()) + '/tools', headers=self.headers, json=relay).status_code, 401)
        backend.sessions[self.session_id]['expires_at'] = time.time() - 1
        self.assertEqual(self.register().status_code, 401)

    def test_unknown_stale_and_changed_calls(self):
        self.assertEqual(self.relay().status_code, 409)
        self.register()
        changed = {**self.call, 'arguments': {**self.call['arguments'], 'current_need': 'changed'}}
        self.assertEqual(self.relay(changed).status_code, 409)
        backend.sessions[self.session_id]['pending']['call_demo']['expires_at'] = time.time() - 1
        self.assertEqual(self.relay().status_code, 409)

    def test_tool_allowlist_and_stale_generation(self):
        bad = {**self.call, 'arguments': {**self.call['arguments'], 'unexpected': 'invented'}}
        self.assertEqual(self.register(bad).status_code, 422)
        self.assertEqual(self.client.post(self.path + '/tool-calls?generation=2', headers=self.headers, json=self.call).status_code, 409)

    def test_local_context_tool_is_not_relayed_to_server(self):
        call = {'call_id': 'call_memory', 'name': 'retrieve_shared_context', 'arguments': {'query': 'work', 'max_results': 1}}
        self.assertEqual(self.register(call).status_code, 422)
        bad = {**call, 'call_id': 'call_other', 'arguments': {'query': 'work', 'max_results': 1, 'user_id': 'someone'}}
        self.assertEqual(self.register(bad).status_code, 422)

    def test_voice_configuration_is_manual_and_key_stays_server_side(self):
        fake = AsyncMock(return_value={'value': 'short_lived_test_key', 'expires_at': time.time() + 60})
        with patch.object(backend, 'provider', fake):
            result = self.client.post(self.path + '/voice', headers=self.headers)
        self.assertEqual(result.status_code, 200)
        config = fake.call_args.kwargs['json']['session']
        self.assertIsNone(config['audio']['input']['turn_detection'])
        self.assertEqual([tool['name'] for tool in config['tools']], ['retrieve_shared_context', 'choose_support', 'update_moment_state'])
        self.assertEqual(result.json()['value'], 'short_lived_test_key')

    def test_brain_dump_uses_transcription_only_client_secret(self):
        fake = AsyncMock(return_value={'value': 'short_lived_transcription_key', 'expires_at': time.time() + 60})
        with patch.object(backend, 'provider', fake):
            result = self.client.post(self.path + '/voice/transcription', headers=self.headers, json={})
        self.assertEqual(result.status_code, 200)
        config = fake.call_args.kwargs['json']['session']
        self.assertEqual(config['type'], 'transcription')
        self.assertIsNone(config['audio']['input']['turn_detection'])
        self.assertEqual(config['audio']['input']['transcription']['model'], 'gpt-live-transcribe')
        self.assertNotIn('instructions', config)
        self.assertNotIn('tools', config)
        self.assertNotIn('generation', result.json())
        self.assertEqual(result.json()['value'], 'short_lived_transcription_key')

    def test_transcription_upload_forwards_audio_and_returns_text(self):
        fake = AsyncMock(return_value={'text': 'A short synthetic journal note.'})
        audio = b'local-test-audio'
        with patch.object(backend, 'provider', fake):
            result = self.client.post(self.path + '/transcriptions', headers=self.headers,
                files={'file': ('journal.m4a', audio, 'audio/mp4')})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.json(), {'text': 'A short synthetic journal note.'})
        self.assertEqual(fake.call_args.args, ('audio/transcriptions',))
        self.assertEqual(fake.call_args.kwargs['files']['file'], ('journal.m4a', audio, 'audio/mp4'))

    def test_journal_memory_requires_separate_approval_and_revokes_immediately(self):
        saved = self.client.post(self.path + '/journal', headers=self.headers,
            json={'text': 'I feel scattered about my work tasks.', 'input_type': 'text'})
        self.assertEqual(saved.status_code, 200)
        memory = self.client.post(self.path + '/memory', headers=self.headers,
            json={'source_entry_id': saved.json()['id'], 'excerpt': 'I feel scattered about my work tasks.'})
        self.assertEqual(memory.status_code, 200)
        self.assertEqual(backend.store.retrieve('work tasks'), [])
        lookup = {'call_id': 'memory_before_approval', 'name': 'retrieve_shared_context',
            'arguments': {'query': 'work tasks', 'max_results': 1}}
        self.assertEqual(self.register(lookup).status_code, 422)
        self.assertEqual(self.client.post(self.path + f"/memory/{memory.json()['id']}/approve",
            headers=self.headers).status_code, 200)
        self.assertEqual(backend.store.retrieve('work tasks')[0]['source_type'], 'journal')
        lookup['call_id'] = 'memory_after_approval'
        self.assertEqual(self.register(lookup).status_code, 422)
        self.assertEqual(self.client.post(self.path + f"/memory/{memory.json()['id']}/revoke",
            headers=self.headers).status_code, 200)
        self.assertEqual(backend.store.retrieve('work tasks'), [])

    def test_active_action_is_shared_with_talk_and_yesterday_query_matches_action_date(self):
        response = self.client.get(self.path + '/interventions', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['interventions']), 9)
        self.assertEqual(self.client.get(self.path + '/interventions/not-approved', headers=self.headers).status_code, 404)
        fake_selector = AsyncMock(return_value={'output': [{'content': [{'type': 'output_text', 'text':
            '{"route":"offer_intervention","situation_summary":"","question":"","offer_reason":"","ranked_ids":[]}'}]}]})
        with patch.object(backend, 'provider', fake_selector):
            awaitable_result = backend.choose_support({'user_message': 'Try something'},
                declined_interventions={'pause_60s'})
            import asyncio
            decision = asyncio.run(awaitable_result)
        ids = fake_selector.call_args.kwargs['json']['text']['format']['schema']['properties']['ranked_ids']['items']['enum']
        self.assertNotIn('pause_60s', ids)
        self.assertEqual(decision['route'], 'listen')

        denied = self.start_activity('task_reset_60s', consented=False)
        self.assertEqual(denied.status_code, 422)
        started = self.start_activity('task_reset_60s')
        self.assertEqual(started.status_code, 200)
        run = started.json()
        self.assertEqual(backend.store.retrieve('what am I doing?'), [])
        self.assertEqual(self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers,
            json={'state': 'completed'}).status_code, 200)
        result = self.client.post(self.path + '/feedback', headers=self.headers,
            json={'action_run_id': run['id'], 'rating': 'yes', 'reuse_context': False})
        self.assertEqual(result.status_code, 200)
        self.assertEqual(backend.store.feedback(), [])

    def test_feedback_only_retrieves_after_explicit_future_context_opt_in(self):
        run = self.start_activity('task_reset_60s').json()
        self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers,
            json={'state': 'completed'})
        saved = self.client.post(self.path + '/feedback', headers=self.headers,
            json={'action_run_id': run['id'], 'rating': 'a_little', 'reuse_context': True,
                  'helpful_lesson': 'Mira may suggest Task reset again in a similar moment.'})
        self.assertEqual(saved.status_code, 200)
        self.assertEqual(backend.store.retrieve('task reset similar moment')[0]['source_type'], 'feedback')

    def test_helpful_lesson_requires_consent_and_is_retrievable_then_deletable(self):
        run = self.start_activity('task_reset_60s').json()
        self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers, json={'state': 'completed'})
        payload = {'action_run_id': run['id'], 'rating': 'yes', 'reuse_context': False,
            'helpful_lesson': 'A short task breakdown helped when overwhelmed.'}
        self.assertEqual(self.client.post(self.path + '/feedback', headers=self.headers, json=payload).status_code, 422)
        payload['reuse_context'] = True
        saved = self.client.post(self.path + '/feedback', headers=self.headers, json=payload)
        self.assertEqual(saved.status_code, 200)
        self.assertIn('task breakdown', backend.store.retrieve('what helped when overwhelmed')[0]['excerpt'])
        self.assertEqual(self.client.delete(self.path + f"/feedback/{saved.json()['id']}", headers=self.headers).status_code, 200)
        self.assertEqual(backend.store.retrieve('what helped when overwhelmed'), [])

    def test_moment_tool_and_bounded_task_sort_preserve_original_lines(self):
        state = {'what_happened': 'Work feels like too much.', 'current_need': 'One small step', 'what_is_unclear': '',
            'support_mode': 'offer_action', 'suggested_action': 'Task reset', 'previously_helpful': ''}
        call = {'call_id': 'moment_state', 'name': 'update_moment_state', 'arguments': state}
        self.assertEqual(self.register(call).status_code, 422)
        bad_state = {**state, 'support_mode': 'diagnose'}
        self.assertEqual(self.register({**call, 'call_id': 'bad_state', 'arguments': bad_state}).status_code, 422)
        lines = ['Email the team', 'Open the document']
        fake = AsyncMock(return_value={'output': [{'content': [{'type': 'output_text', 'text': '{"now":[1],"later":[0],"ignore":[]}'}]}]})
        with patch.object(backend, 'provider', fake):
            organized = self.client.post(self.path + '/task-reset/organize', headers=self.headers, json={'items': lines})
        self.assertEqual(organized.status_code, 200)
        self.assertEqual(organized.json(), {'now': ['Open the document'], 'later': ['Email the team'], 'ignore': []})
        fake.return_value = {'output': [{'content': [{'type': 'output_text', 'text': '{"now":[0],"later":[0],"ignore":[]}'}]}]}
        with patch.object(backend, 'provider', fake):
            invalid = self.client.post(self.path + '/task-reset/organize', headers=self.headers, json={'items': lines})
        self.assertEqual(invalid.status_code, 502)

    def test_feedback_cannot_be_injected_into_voice_without_opt_in(self):
        run = self.start_activity('pause_60s').json()
        self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers,
            json={'state': 'completed'})
        self.client.patch(self.path + f"/action-runs/{run['id']}", headers=self.headers, json={'state': 'completed'})
        feedback = self.client.post(self.path + '/feedback', headers=self.headers,
            json={'action_run_id': run['id'], 'rating': 'yes', 'reuse_context': True,
                  'helpful_lesson': 'Mira may suggest a short pause again.'}).json()
        fake = AsyncMock(return_value={'value': 'short_lived_test_key', 'expires_at': time.time() + 60})
        with patch.object(backend, 'provider', fake):
            connected = self.client.post(self.path + '/voice', headers=self.headers,
                json={'feedback_id': feedback['id']})
        self.assertEqual(connected.status_code, 422)
        fake.assert_not_awaited()

    def test_text_fallback_uses_and_labels_only_approved_context(self):
        entry = self.client.post(self.path + '/journal', headers=self.headers,
            json={'text': 'Work has felt scattered this week.', 'input_type': 'text'}).json()
        memory = self.client.post(self.path + '/memory', headers=self.headers,
            json={'source_entry_id': entry['id'], 'excerpt': 'Work has felt scattered this week.'}).json()
        decision_output = {'route': 'ask_question', 'situation_summary': 'Work feels scattered.', 'question': 'What feels hardest?',
            'offer_reason': '', 'ranked_ids': []}
        response_json = {'reply': 'What feels hardest?', 'what_happened': 'Work feels scattered.', 'current_need': 'A little space',
            'what_is_unclear': '', 'support_mode': 'clarify', 'suggested_action': '', 'previously_helpful': ''}
        fake = AsyncMock(side_effect=[
            {'output': [{'content': [{'type': 'output_text', 'text': __import__('json').dumps(decision_output)}]}]},
            {'output': [{'content': [{'type': 'output_text', 'text': __import__('json').dumps(response_json)}]}]},
            {'output': [{'content': [{'type': 'output_text', 'text': __import__('json').dumps(decision_output)}]}]},
            {'output': [{'content': [{'type': 'output_text', 'text': __import__('json').dumps(response_json)}]}]},
        ])
        prior_state = {'what_happened': 'Work has been hard.', 'current_need': 'A clear next step', 'what_is_unclear': '',
            'support_mode': 'clarify', 'suggested_action': '', 'previously_helpful': ''}
        payload = {'messages': [{'role': 'user', 'content': 'I am struggling with work.'}],
            'context_matches': [], 'approved_preferences': [], 'consent_revision': 0,
            'moment_state': prior_state, 'client_activity_capabilities': {
                'client_version': 'activity-ui-11', 'catalog_version': '0.14',
                'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')]),
            }}
        with patch.object(backend, 'provider', fake), patch.object(backend.store, 'retrieve',
                side_effect=AssertionError('Talk context must be selected by the device')), patch.object(backend.store,
                'feedback', side_effect=AssertionError('preferences must be selected by the device')):
            pending = self.client.post(self.path + '/text', headers=self.headers, json=payload)
        self.assertEqual(pending.status_code, 200, pending.text)
        self.assertEqual(pending.json()['context_matches'], [])
        self.assertNotIn('scattered', fake.call_args.kwargs['json']['instructions'])
        self.assertIn('A clear next step', fake.call_args.kwargs['json']['instructions'])
        self.client.post(self.path + f"/memory/{memory['id']}/approve", headers=self.headers)
        with patch.object(backend, 'provider', fake), patch.object(backend.store, 'retrieve',
                side_effect=AssertionError('Talk context must be selected by the device')), patch.object(backend.store,
                'feedback', side_effect=AssertionError('preferences must be selected by the device')):
            approved = self.client.post(self.path + '/text', headers=self.headers, json=payload)
        self.assertEqual(approved.json()['context_matches'], [])
        self.assertNotIn('scattered', fake.call_args.kwargs['json']['instructions'])
        self.assertEqual(approved.json()['moment_state']['support_mode'], 'clarify')

    def test_text_uses_phone_selected_context_and_preferences_without_private_lookup(self):
        decision = {'route': 'listen', 'situation_summary': '', 'question': '',
            'offer_reason': '', 'ranked_ids': []}
        reply = {'reply': 'What feels most useful right now?', 'what_happened': '',
            'current_need': '', 'what_is_unclear': '', 'support_mode': 'listen_more',
            'suggested_action': '', 'previously_helpful': ''}
        fake = AsyncMock(side_effect=[
            {'output': [{'content': [{'type': 'output_text', 'text': json.dumps(decision)}]}]},
            {'output': [{'content': [{'type': 'output_text', 'text': json.dumps(reply)}]}]},
        ])
        payload = {'messages': [{'role': 'user', 'content': 'Work is hard today.'}],
            'context_matches': [{'id': 'local-memory', 'source_type': 'journal',
                'source_id': 'local-entry', 'excerpt': 'Work has felt scattered.',
                'label': 'Journal excerpt'}],
            'approved_preferences': [{'intervention_id': 'pause_60s', 'rating': 'yes',
                'preference': 'A short pause helped me reset.'}],
            'consent_revision': 12,
            'client_activity_capabilities': {'client_version': 'activity-ui-11',
                'catalog_version': '0.14',
                'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')])}}
        with patch.object(backend, 'provider', fake), patch.object(backend.store, 'retrieve',
                side_effect=AssertionError('new client must select context locally')):
            response = self.client.post(self.path + '/text', headers=self.headers, json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()['context_matches'][0]['id'], 'local-memory')
        self.assertIn('Work has felt scattered.', fake.call_args_list[1].kwargs['json']['instructions'])
        decision_input = json.loads(fake.call_args_list[0].kwargs['json']['input'])['conversation']
        self.assertEqual(decision_input['preferences'][0]['intervention_id'], 'pause_60s')


if __name__ == '__main__':
    unittest.main()
