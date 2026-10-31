import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient
from server import app as backend


class BolnaSessionTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(backend.app)

    def test_requires_sign_in_before_minting(self):
        with patch.object(backend, 'mint_call_session', new_callable=AsyncMock) as mint:
            self.assertEqual(self.client.post('/workers/bolna/session').status_code, 401)
            mint.assert_not_awaited()

    def test_session_is_not_cached(self):
        with patch.object(backend, 'verify_firebase_uid', return_value='bolna-test'), \
                patch.object(backend, 'mint_call_session', new_callable=AsyncMock, return_value={'run_id': 'test'}):
            response = self.client.post('/workers/bolna/session', headers={'Authorization': 'Bearer test'})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['cache-control'], 'no-store')

    def test_provider_failure_does_not_expose_credentials(self):
        from server.bolna import mint_call_session
        import asyncio
        from fastapi import HTTPException
        response = httpx.Response(401, request=httpx.Request('POST', 'https://api.bolna.ai'),
                                  json={'secret': 'provider-detail'})
        with patch.dict('os.environ', {'BOLNA_API_KEY': 'secret-key', 'BOLNA_AGENT_ID': 'agent'}), \
                patch('server.bolna.httpx.AsyncClient.post', new_callable=AsyncMock, return_value=response):
            with self.assertRaises(HTTPException) as error:
                asyncio.run(mint_call_session())
        self.assertEqual(error.exception.status_code, 503)
        self.assertNotIn('secret', error.exception.detail)

    def test_context_limits_and_extra_fields_are_rejected(self):
        invalid = (
            {'person_name': 'x' * 81},
            {'recent_messages': [{'role': 'user', 'content': 'x'}] * 7},
            {'shared_excerpts': [{'source_type': 'journal', 'label': 'shared', 'excerpt': 'x' * 601}]},
            {'agent_id': 'client-must-not-select-provider-agent'},
            {'journal': 'private content'},
        )
        with patch.object(backend, 'mint_call_session', new_callable=AsyncMock) as mint:
            for body in invalid:
                with self.subTest(body=list(body)):
                    self.assertEqual(self.client.post('/workers/bolna/session', json=body).status_code, 422)
            mint.assert_not_awaited()

    def test_context_forwarding_has_only_the_expected_dynamic_variables(self):
        import asyncio
        import json
        from server.bolna import BolnaCallContext, mint_call_session
        payload = {'run_id': 'run', 'agent_id': 'agent', 'sip_username': 'temporary',
                   'sip_password': 'temporary', 'sip_domain': 'example.com', 'wss_url': 'wss://example.com',
                   'ice_servers': [], 'sip_register': False, 'expires_in': 120}
        response = httpx.Response(200, request=httpx.Request('POST', 'https://api.bolna.ai'), json=payload)
        context = BolnaCallContext(person_name='Sandy', consent_revision=7,
                                   recent_messages=[{'role': 'user', 'content': 'A difficult morning'}])
        with patch.dict('os.environ', {'BOLNA_API_KEY': 'server-only', 'BOLNA_AGENT_ID': 'agent'}), \
                patch('server.bolna.httpx.AsyncClient.post', new_callable=AsyncMock, return_value=response) as post:
            asyncio.run(mint_call_session(context))
        data = post.call_args.kwargs['json']['user_data']
        self.assertEqual(set(data), {'person_name', 'mira_context'})
        self.assertEqual(data['person_name'], 'Sandy')
        snapshot = json.loads(data['mira_context'])
        self.assertEqual(snapshot['recent_messages'][0]['content'], 'A difficult morning')
        self.assertNotIn('consent_revision', snapshot)
        self.assertNotIn('server-only', str(data))
