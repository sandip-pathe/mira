"""Stateless Journal worker checks, without calling OpenAI or writing private data."""
import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from fastapi.testclient import TestClient
from server import app as backend


class NoPrivateStore:
    def __getattr__(self, name):
        raise AssertionError(f'Journal worker attempted private persistence: {name}')


class JournalWorkerContract(unittest.TestCase):
    def setUp(self):
        backend.creation_times.clear()
        self.client = TestClient(backend.app)
        session = self.client.post('/sessions', json={'session_id': str(uuid4())}).json()
        self.url = f"/sessions/{session['session_id']}/journal-follow-up"
        self.headers = {'Authorization': f"Bearer {session['capability']}"}

    def test_worker_returns_only_text_without_private_store_access(self):
        provider = AsyncMock(return_value={'output': [{'content': [
            {'type': 'output_text', 'text': 'What would you like to write next?'}]}]})
        messages = [{'role': 'assistant', 'content': 'A prompt?'}, {'role': 'user', 'content': 'Synthetic writing.'}]
        with patch.object(backend, 'store', NoPrivateStore(), create=True), patch.object(backend, 'provider', provider):
            response = self.client.post(self.url, headers=self.headers, json={'messages': messages})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'text': 'What would you like to write next?'})
        payload = provider.call_args.kwargs['json']
        self.assertFalse(payload['store'])
        self.assertEqual(payload['input'], messages)

    def test_worker_requires_capability_and_bounded_user_turn(self):
        with patch.object(backend, 'provider', AsyncMock()) as provider:
            self.assertEqual(self.client.post(self.url, json={'messages': [{'role': 'user', 'content': 'Synthetic'}]}).status_code, 401)
            bad = [{'role': 'assistant', 'content': 'A prompt?'}]
            self.assertEqual(self.client.post(self.url, headers=self.headers, json={'messages': bad}).status_code, 422)
            oversized = [{'role': 'user', 'content': 'x' * 12000}] * 3
            self.assertEqual(self.client.post(self.url, headers=self.headers, json={'messages': oversized}).status_code, 422)
            provider.assert_not_called()

    def test_invalid_model_response_never_claims_a_save(self):
        with patch.object(backend, 'store', NoPrivateStore(), create=True), patch.object(backend, 'provider', AsyncMock(return_value={'output': []})):
            response = self.client.post(self.url, headers=self.headers, json={'messages': [{'role': 'user', 'content': 'Synthetic'}]})
        self.assertEqual(response.status_code, 503)
        self.assertNotIn('saved', response.json())
