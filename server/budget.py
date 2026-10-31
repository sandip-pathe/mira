"""Durable, atomic submission usage reservations; never stores user content."""
from __future__ import annotations

import json
import math
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

MICROS_PER_USD = 1_000_000
MIN_OPENAI_RESERVATION_MICROS = 10_000  # $0.01 floor per provider request
OPENAI_INPUT_PER_MILLION = 400_000  # gpt-4.1-mini, dollars expressed in micros
OPENAI_CACHED_INPUT_PER_MILLION = 100_000
OPENAI_OUTPUT_PER_MILLION = 1_600_000
DEFAULT_OPENAI_DAILY_OPERATIONS = 50
DEFAULT_BOLNA_DAILY_CALLS = 3
DEFAULT_BOLNA_MINT_COOLDOWN_SECONDS = 60


class BudgetDenied(Exception):
    def __init__(self, code: str, *, status: int, reset_at: str | None = None):
        super().__init__(code)
        self.code = code
        self.status = status
        self.reset_at = reset_at


def _database_path() -> Path:
    configured = os.getenv('MIRA_BUDGET_DB_PATH', '').strip()
    path = Path(configured) if configured else Path(__file__).with_name('data') / 'review-budget.sqlite3'
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(_database_path(), timeout=10, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA busy_timeout = 10000')
    # Set journal mode only once; repeating this pragma on every connection can
    # race with concurrent opens even though the database itself is serialized.
    if not getattr(_connect, '_initialized', False):
        connection.execute('PRAGMA journal_mode = WAL')
    connection.execute('''CREATE TABLE IF NOT EXISTS usage_reservations (
        id TEXT PRIMARY KEY,
        uid TEXT NOT NULL,
        provider TEXT NOT NULL,
        feature TEXT NOT NULL,
        operation_id TEXT NOT NULL,
        reserved_micros INTEGER NOT NULL,
        actual_micros INTEGER,
        status TEXT NOT NULL CHECK (status IN ('reserved', 'settled', 'released')),
        created_at REAL NOT NULL,
        provider_session_id TEXT
    )''')
    connection.execute('''CREATE INDEX IF NOT EXISTS usage_by_provider_uid_date
        ON usage_reservations(provider, uid, created_at)''')
    connection.execute('''CREATE TABLE IF NOT EXISTS usage_controls (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        openai_budget_micros INTEGER NOT NULL
    )''')
    configured_limit = _env_usd_micros('MIRA_OPENAI_REVIEW_BUDGET_USD', 20.0)
    connection.execute(
        'INSERT OR IGNORE INTO usage_controls (id, openai_budget_micros) VALUES (1, ?)',
        (configured_limit,),
    )
    _connect._initialized = True
    return connection


def _env_usd_micros(name: str, default: float) -> int:
    try:
        value = float(os.getenv(name, str(default)))
        if not math.isfinite(value):
            return 0
        return max(0, math.floor(value * MICROS_PER_USD))
    except (OverflowError, ValueError):
        return 0


def _utc_day_start(now: float) -> tuple[str, float, str]:
    moment = datetime.fromtimestamp(now, timezone.utc)
    start = moment.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = start.timestamp() + 86400
    return start.date().isoformat(), start.timestamp(), datetime.fromtimestamp(tomorrow, timezone.utc).isoformat()


def _openai_limit(connection: sqlite3.Connection) -> int:
    persisted = int(connection.execute(
        'SELECT openai_budget_micros FROM usage_controls WHERE id = 1'
    ).fetchone()['openai_budget_micros'])
    # Runtime config may reduce the cap, but raising it never silently refills the ledger.
    configured = _env_usd_micros('MIRA_OPENAI_REVIEW_BUDGET_USD', 20.0)
    return min(persisted, configured)


def estimate_openai_reservation_micros(body: dict) -> int:
    """Conservative reservation using an 8-token/character bound and 2x headroom."""
    encoded_size = len(json.dumps(body, ensure_ascii=False, separators=(',', ':')))
    input_tokens = encoded_size * 8
    try:
        output_tokens = min(4096, max(1, int(body.get('max_output_tokens', 2000))))
    except (TypeError, ValueError):
        output_tokens = 4096
    estimate = math.ceil((
        input_tokens * OPENAI_INPUT_PER_MILLION
        + output_tokens * OPENAI_OUTPUT_PER_MILLION
    ) / 1_000_000)
    return max(MIN_OPENAI_RESERVATION_MICROS, estimate * 2)


def reserve_openai(uid: str, feature: str, operation_id: str, reserve_micros: int) -> str:
    """Reserve before a provider request; SQLite BEGIN IMMEDIATE serializes contenders."""
    now = datetime.now(timezone.utc).timestamp()
    _, day_start, reset_at = _utc_day_start(now)
    limit = max(0, int(os.getenv('MIRA_OPENAI_OPERATIONS_PER_USER_PER_DAY', str(DEFAULT_OPENAI_DAILY_OPERATIONS))))
    reservation_id = str(uuid4())
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        daily = connection.execute(
            "SELECT COUNT(DISTINCT operation_id) AS n, MAX(operation_id=?) AS same_operation FROM usage_reservations WHERE provider='openai' AND uid=? AND created_at>=? AND status!='released'",
            (operation_id, uid, day_start),
        ).fetchone()
        if daily['n'] >= limit and not daily['same_operation']:
            raise BudgetDenied('daily_allowance_reached', status=429, reset_at=reset_at)
        totals = connection.execute('''SELECT
            COALESCE(SUM(CASE WHEN status='settled' THEN actual_micros ELSE 0 END), 0) AS spent,
            COALESCE(SUM(CASE WHEN status='reserved' THEN reserved_micros ELSE 0 END), 0) AS held
            FROM usage_reservations WHERE provider='openai'
        ''').fetchone()
        reserve = max(MIN_OPENAI_RESERVATION_MICROS, reserve_micros)
        if totals['spent'] + totals['held'] + reserve > _openai_limit(connection):
            raise BudgetDenied('review_budget_exhausted', status=402)
        connection.execute(
            '''INSERT INTO usage_reservations
               (id, uid, provider, feature, operation_id, reserved_micros, status, created_at)
               VALUES (?, ?, 'openai', ?, ?, ?, 'reserved', ?)''',
            (reservation_id, uid, feature[:80], operation_id, reserve, now),
        )
        connection.commit()
        return reservation_id
    except Exception:
        if connection.in_transaction:
            connection.rollback()
        raise
    finally:
        connection.close()


def response_usage_micros(result: dict) -> int | None:
    """Calculate settled Responses API usage for the only enabled billable model."""
    usage = result.get('usage')
    if not isinstance(usage, dict):
        return None
    try:
        input_tokens = int(usage['input_tokens'])
        output_tokens = int(usage['output_tokens'])
        details = usage.get('input_tokens_details') or {}
        cached = int(details.get('cached_tokens', 0))
        if min(input_tokens, output_tokens, cached) < 0 or cached > input_tokens:
            return None
    except (KeyError, TypeError, ValueError):
        return None
    uncached = input_tokens - cached
    exact = (
        uncached * OPENAI_INPUT_PER_MILLION
        + cached * OPENAI_CACHED_INPUT_PER_MILLION
        + output_tokens * OPENAI_OUTPUT_PER_MILLION
    ) / 1_000_000
    return math.ceil(exact)


def settle_openai(reservation_id: str, actual_micros: int | None) -> None:
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        row = connection.execute(
            "SELECT reserved_micros, status FROM usage_reservations WHERE id=? AND provider='openai'",
            (reservation_id,),
        ).fetchone()
        if row and row['status'] == 'reserved':
            # Unknown charges keep the full reservation. Refund only provider-reported usage.
            charged = row['reserved_micros'] if actual_micros is None else max(0, actual_micros)
            connection.execute(
                "UPDATE usage_reservations SET actual_micros=?, status='settled' WHERE id=?",
                (charged, reservation_id),
            )
        connection.commit()
    except Exception:
        if connection.in_transaction:
            connection.rollback()
        raise
    finally:
        connection.close()


def release_openai_rejected(reservation_id: str) -> None:
    """Release only when no billable operation was accepted by the provider."""
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        connection.execute(
            "UPDATE usage_reservations SET status='released' WHERE id=? AND provider='openai' AND status='reserved'",
            (reservation_id,),
        )
        connection.commit()
    finally:
        connection.close()


def reserve_bolna(uid: str, operation_id: str) -> str:
    now = datetime.now(timezone.utc).timestamp()
    _, day_start, reset_at = _utc_day_start(now)
    limit = max(0, int(os.getenv('MIRA_BOLNA_CALLS_PER_USER_PER_DAY', str(DEFAULT_BOLNA_DAILY_CALLS))))
    cooldown = max(0, int(os.getenv('MIRA_BOLNA_MINT_COOLDOWN_SECONDS', str(DEFAULT_BOLNA_MINT_COOLDOWN_SECONDS))))
    reservation_id = str(uuid4())
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        last = connection.execute(
            "SELECT created_at FROM usage_reservations WHERE provider='bolna' AND uid=? ORDER BY created_at DESC LIMIT 1",
            (uid,),
        ).fetchone()
        if last and now - last['created_at'] < cooldown:
            retry_at = datetime.fromtimestamp(last['created_at'] + cooldown, timezone.utc).isoformat()
            raise BudgetDenied('call_cooldown', status=429, reset_at=retry_at)
        daily = connection.execute(
            "SELECT COUNT(*) AS n FROM usage_reservations WHERE provider='bolna' AND uid=? AND created_at>=? AND status!='released'",
            (uid, day_start),
        ).fetchone()['n']
        if daily >= limit:
            raise BudgetDenied('bolna_daily_allowance_reached', status=429, reset_at=reset_at)
        connection.execute(
            '''INSERT INTO usage_reservations
               (id, uid, provider, feature, operation_id, reserved_micros, status, created_at)
               VALUES (?, ?, 'bolna', 'call_session', ?, 0, 'reserved', ?)''',
            (reservation_id, uid, operation_id, now),
        )
        connection.commit()
        return reservation_id
    except Exception:
        if connection.in_transaction:
            connection.rollback()
        raise
    finally:
        connection.close()


def finish_bolna(reservation_id: str, run_id: str) -> None:
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        connection.execute(
            "UPDATE usage_reservations SET status='settled', provider_session_id=? WHERE id=? AND provider='bolna' AND status='reserved'",
            (run_id[:128], reservation_id),
        )
        connection.commit()
    finally:
        connection.close()


def release_bolna_rejected(reservation_id: str) -> None:
    """Release only when Bolna explicitly rejects session creation without minting."""
    connection = _connect()
    try:
        connection.execute('BEGIN IMMEDIATE')
        connection.execute(
            "UPDATE usage_reservations SET status='released' WHERE id=? AND provider='bolna' AND status='reserved'",
            (reservation_id,),
        )
        connection.commit()
    finally:
        connection.close()
