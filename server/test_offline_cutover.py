import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient
from server import app as backend


class OfflineCutoverContract(unittest.TestCase):
    def setUp(self):
        backend.voice_states.clear()
        self.auth_patch = patch.object(backend, 'verify_firebase_uid', return_value='firebase-user-test')
        self.auth_patch.start()
        self.addCleanup(self.auth_patch.stop)
        self.client = TestClient(backend.app)
        self.path = '/sessions/firebase-user-test'
        self.headers = {'Authorization': 'Bearer firebase-test-token'}

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

if __name__ == '__main__':
    unittest.main()
