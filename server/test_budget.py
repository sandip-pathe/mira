import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from . import budget


class BudgetLedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.env = patch.dict(os.environ, {
            'MIRA_BUDGET_DB_PATH': str(Path(self.temp.name) / 'budget.sqlite3'),
            'MIRA_OPENAI_REVIEW_BUDGET_USD': '0.10',
            'MIRA_OPENAI_OPERATIONS_PER_USER_PER_DAY': '50',
            'MIRA_BOLNA_CALLS_PER_USER_PER_DAY': '3',
            'MIRA_BOLNA_MINT_COOLDOWN_SECONDS': '0',
        })
        self.env.start()
        self.addCleanup(self.env.stop)
        self.addCleanup(self.temp.cleanup)

    def test_global_openai_budget_is_shared_and_survives_reopen(self):
        first = budget.reserve_openai('reviewer-a', 'responses', 'op-a', 50_000)
        budget.settle_openai(first, 10_000)
        second = budget.reserve_openai('reviewer-b', 'responses', 'op-b', 50_000)
        with self.assertRaises(budget.BudgetDenied) as denied:
            budget.reserve_openai('reviewer-a', 'responses', 'op-c', 50_000)
        self.assertEqual(denied.exception.code, 'review_budget_exhausted')
        self.assertTrue(Path(os.environ['MIRA_BUDGET_DB_PATH']).exists())
        budget.settle_openai(second, 50_000)

    def test_fanout_reservations_count_as_one_daily_operation(self):
        with patch.dict(os.environ, {'MIRA_OPENAI_OPERATIONS_PER_USER_PER_DAY': '1'}):
            budget.reserve_openai('reviewer-a', 'responses', 'same-request', 10_000)
            budget.reserve_openai('reviewer-a', 'responses', 'same-request', 10_000)
            with self.assertRaises(budget.BudgetDenied) as denied:
                budget.reserve_openai('reviewer-a', 'responses', 'next-request', 10_000)
        self.assertEqual(denied.exception.code, 'daily_allowance_reached')
        self.assertIsNotNone(denied.exception.reset_at)

    def test_parallel_reservations_cannot_overdraw_global_cap(self):
        def reserve(index):
            try:
                return budget.reserve_openai(f'reviewer-{index}', 'responses', f'op-{index}', 50_000)
            except budget.BudgetDenied:
                return None

        with ThreadPoolExecutor(max_workers=8) as pool:
            reservations = list(pool.map(reserve, range(8)))
        self.assertEqual(sum(value is not None for value in reservations), 2)

    def test_usage_settlement_and_bolna_daily_cap(self):
        self.assertEqual(budget.response_usage_micros({
            'usage': {
                'input_tokens': 10,
                'output_tokens': 5,
                'input_tokens_details': {'cached_tokens': 2},
            },
        }), 12)
        for index in range(3):
            reservation = budget.reserve_bolna('reviewer-a', f'call-{index}')
            budget.finish_bolna(reservation, f'run-{index}')
        with self.assertRaises(budget.BudgetDenied) as denied:
            budget.reserve_bolna('reviewer-a', 'call-4')
        self.assertEqual(denied.exception.code, 'bolna_daily_allowance_reached')


if __name__ == '__main__':
    unittest.main()
