import unittest
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient
from server import app as backend


class OfflineCutoverContract(unittest.TestCase):
    def setUp(self):
        backend.sessions.clear()
        self.client = TestClient(backend.app)
        created = self.client.post('/sessions', json={'session_id': str(uuid4())}).json()
        self.path = '/sessions/' + created['session_id']
        self.headers = {'Authorization': 'Bearer ' + created['capability']}

    def test_private_store_is_not_opened_by_server_runtime(self):
        self.assertFalse(hasattr(backend, 'store'))

    def test_old_private_data_routes_return_update_required(self):
        paths = (
            ('GET', '/journal'), ('POST', '/journal'), ('DELETE', '/journal/' + str(uuid4())),
            ('GET', '/journal-sessions'), ('POST', '/memory'), ('GET', '/memory'),
            ('POST', '/feedback'), ('GET', '/actions'), ('GET', '/interventions'),
            ('POST', '/interventions/one_small_step/start'), ('PATCH', '/action-runs/' + str(uuid4())),
            ('POST', '/reset'),
        )
        for method, suffix in paths:
            with self.subTest(method=method, path=suffix):
                response = self.client.request(method, self.path + suffix, headers=self.headers)
                self.assertEqual(response.status_code, 426)
                self.assertIn('device', response.json()['detail'])

    def test_stateless_journal_worker_remains_available(self):
        fake = AsyncMock(return_value='What would you like to remember?')
        with patch.object(backend, 'generate_journal_follow_up', fake):
            response = self.client.post(self.path + '/journal-follow-up', headers=self.headers,
                json={'messages': [{'role': 'user', 'content': 'Today felt busy.'}]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'text': 'What would you like to remember?'})


if __name__ == '__main__':
    unittest.main()
