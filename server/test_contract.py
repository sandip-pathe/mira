"""Contracts for the current worker-only backend."""
import json
import time
import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from server import app as backend
from server.interventions.catalog import (
    PRIMARY_ACTIVITY_IDS,
    all_interventions,
    get_intervention,
    primary_interventions,
)
from server.interventions.client_registry import SUPPORTED_CLIENTS
from server.interventions.decision import DecisionInput, select_support
from server.interventions.eligibility import eligible_interventions


def provider_text(value):
    return {'output': [{'content': [{'type': 'output_text', 'text': json.dumps(value)}]}]}


class DecisionContract(unittest.IsolatedAsyncioTestCase):
    async def test_selector_receives_only_the_nine_primary_activities(self):
        fake = AsyncMock(return_value={
            'route': 'listen', 'situation_summary': '', 'question': '',
            'offer_reason': '', 'ranked_ids': [], 'intervention': None,
        })
        with patch.object(backend, 'select_support', fake):
            await backend.choose_support(
                {'user_message': 'Hello'},
                compatible_activity_ids=set(PRIMARY_ACTIVITY_IDS),
            )
        offered = fake.call_args.args[1]
        self.assertEqual(tuple(item['id'] for item in offered), PRIMARY_ACTIVITY_IDS)
        self.assertEqual(len(eligible_interventions(offered)), 9)

    def test_bundled_selector_catalog_has_supported_presentation_shapes(self):
        catalog = all_interventions()
        self.assertGreaterEqual(len(catalog), 9)
        for item in catalog:
            with self.subTest(activity=item['id']):
                self.assertIn(item['presentation']['pattern'], ('sort', 'capture', 'steps', 'letter', 'grounding', 'breathing'))
                self.assertTrue(item['steps'])
                self.assertEqual(item, get_intervention(item['id']))

    async def test_selector_fails_closed_on_invalid_model_output(self):
        malformed = AsyncMock(return_value={'output': []})
        result = await select_support(DecisionInput(), eligible_interventions(all_interventions()), malformed)
        self.assertEqual(result['route'], 'listen')
        self.assertIsNone(result['intervention'])


class WorkerContract(unittest.TestCase):
    def setUp(self):
        backend.voice_states.clear()
        self.auth_patch = patch.object(backend, 'verify_firebase_uid', return_value='firebase-user-test')
        self.auth_patch.start()
        self.addCleanup(self.auth_patch.stop)
        self.client = TestClient(backend.app)
        self.session_id = 'firebase-user-test'
        self.path = '/workers'
        self.headers = {'Authorization': 'Bearer firebase-test-token'}
        backend.voice_state(self.session_id)['voice_generation'] = 1
        self.call = {
            'call_id': 'call_demo',
            'name': 'choose_support',
            'arguments': {
                'user_message': 'Work feels stuck',
                'situation_summary': 'Too many tasks',
                'current_need': 'A next step',
            },
        }

    def register(self, call=None):
        return self.client.post(
            self.path + '/tool-calls?generation=1', headers=self.headers, json=call or self.call,
        )

    def relay(self, call=None, preferences=None, declines=None, revision=0):
        return self.client.post(self.path + '/tools', headers=self.headers, json={
            'call': call or self.call,
            'approved_preferences': preferences or [],
            'declined_interventions': declines or [],
            'consent_revision': revision,
        })

    def test_voice_tool_relay_is_bound_and_replay_safe(self):
        decision = {
            'route': 'offer_intervention', 'situation_summary': 'Too many tasks',
            'question': '', 'offer_reason': 'Asked for a next step',
            'ranked_ids': ['one_small_step'],
            'intervention': get_intervention('one_small_step'),
        }
        with patch.object(backend, 'choose_support', new=AsyncMock(return_value=decision)):
            self.assertEqual(self.register().status_code, 200)
            pending = backend.voice_states[self.session_id]['pending']['call_demo']
            self.assertNotIn('call', pending)
            self.assertEqual(len(pending['digest']), 64)
            response = self.relay()
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()['result']['decision']['intervention']['id'], 'one_small_step')
        self.assertEqual(self.relay().status_code, 409)

    def test_relay_uses_only_request_supplied_preferences_and_exclusions(self):
        backend.voice_states[self.session_id]['compatible_activity_ids'] = set(PRIMARY_ACTIVITY_IDS)
        fake = AsyncMock(return_value=provider_text({
            'route': 'listen', 'situation_summary': '', 'question': '',
            'offer_reason': '', 'ranked_ids': [],
        }))
        preference = {'intervention_id': 'pause_60s', 'rating': 'yes', 'preference': 'A pause helped me reset.'}
        with patch.object(backend, 'provider', fake):
            self.assertEqual(self.register().status_code, 200)
            response = self.relay(preferences=[preference], declines=['pause_60s'], revision=8)
        self.assertEqual(response.status_code, 200, response.text)
        decision_input = json.loads(fake.call_args.kwargs['json']['input'])['conversation']
        self.assertEqual(decision_input['preferences'][0]['intervention_id'], 'pause_60s')
        self.assertNotIn('pause_60s', fake.call_args.kwargs['json']['text']['format']['schema']['properties']['ranked_ids']['items']['enum'])

    def test_missing_and_mismatched_firebase_identity_are_rejected(self):
        payload = {'call': self.call, 'approved_preferences': [], 'declined_interventions': [], 'consent_revision': 0}
        self.assertEqual(self.client.post(self.path + '/tools', json=payload).status_code, 401)
        with patch.object(backend, 'verify_firebase_uid', return_value=''):
            self.assertEqual(self.client.post(self.path + '/tools', headers=self.headers, json=payload).status_code, 401)

    def test_tool_allowlist_and_local_tools_are_enforced(self):
        unexpected = {**self.call, 'arguments': {**self.call['arguments'], 'unexpected': 'value'}}
        self.assertEqual(self.register(unexpected).status_code, 422)
        local_tool = {
            'call_id': 'local_context', 'name': 'retrieve_shared_context',
            'arguments': {'query': 'work', 'max_results': 1},
        }
        self.assertEqual(self.register(local_tool).status_code, 422)
        self.assertEqual(self.client.post(
            self.path + '/tool-calls?generation=2', headers=self.headers, json=self.call,
        ).status_code, 409)

    def test_voice_credential_keeps_push_to_talk_and_tool_contract(self):
        fake = AsyncMock(return_value={'value': 'short_lived_test_key', 'expires_at': time.time() + 60})
        with patch.object(backend, 'provider', fake):
            response = self.client.post(self.path + '/voice', headers=self.headers)
        self.assertEqual(response.status_code, 200)
        config = fake.call_args.kwargs['json']['session']
        self.assertIsNone(config['audio']['input']['turn_detection'])
        self.assertEqual([tool['name'] for tool in config['tools']], [
            'retrieve_shared_context', 'choose_support', 'update_moment_state',
        ])

    def test_transcription_credential_has_no_conversation_tools(self):
        fake = AsyncMock(return_value={'value': 'short_lived_test_key', 'expires_at': time.time() + 60})
        with patch.object(backend, 'provider', fake):
            response = self.client.post(self.path + '/voice/transcription', headers=self.headers, json={})
        self.assertEqual(response.status_code, 200)
        config = fake.call_args.kwargs['json']['session']
        self.assertEqual(config['type'], 'transcription')
        self.assertIsNone(config['audio']['input']['turn_detection'])
        self.assertNotIn('instructions', config)
        self.assertNotIn('tools', config)

    def test_text_worker_accepts_only_bounded_device_selected_context(self):
        decision = {'route': 'listen', 'situation_summary': '', 'question': '', 'offer_reason': '', 'ranked_ids': []}
        reply = {'reply': 'What feels useful right now?', 'what_happened': '', 'current_need': '',
            'what_is_unclear': '', 'support_mode': 'listen_more', 'suggested_action': '', 'previously_helpful': ''}
        fake = AsyncMock(side_effect=[provider_text(decision), provider_text(reply)])
        payload = {
            'messages': [{'role': 'user', 'content': 'Work feels hard today.'}],
            'context_matches': [{'id': 'local-excerpt', 'source_type': 'journal',
                'source_id': 'local-entry', 'excerpt': 'A bounded approved excerpt.', 'label': 'Journal excerpt'}],
            'approved_preferences': [{'intervention_id': 'pause_60s', 'rating': 'yes',
                'preference': 'A short pause helped.'}],
            'consent_revision': 4,
            'client_activity_capabilities': {'client_version': 'activity-ui-11', 'catalog_version': '0.14',
                'activity_ids': sorted(SUPPORTED_CLIENTS[('activity-ui-11', '0.14')])},
        }
        with patch.object(backend, 'provider', fake):
            response = self.client.post(self.path + '/text', headers=self.headers, json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()['context_matches'][0]['id'], 'local-excerpt')
        self.assertIn('A bounded approved excerpt.', fake.call_args_list[1].kwargs['json']['instructions'])
        self.assertFalse(hasattr(backend, 'store'))

    def test_task_sort_worker_preserves_input_lines(self):
        fake = AsyncMock(return_value={'output': [{'content': [
            {'type': 'output_text', 'text': '{"now":[1],"later":[0],"ignore":[]}'}]}]})
        lines = ['Email the team', 'Open the document']
        with patch.object(backend, 'provider', fake):
            response = self.client.post(self.path + '/task-reset/organize', headers=self.headers, json={'items': lines})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'now': ['Open the document'], 'later': ['Email the team'], 'ignore': []})
        self.assertFalse(fake.call_args.kwargs['json']['store'])


if __name__ == '__main__':
    unittest.main()
