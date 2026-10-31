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
